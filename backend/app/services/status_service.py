"""Assessment-derived personal status.

The health assessment does not produce a risk score. It produces a
``user_risk_profiles`` row describing the person's baseline. A score only
exists once a sensor reading arrives, because the band edges in
``thresholds.json`` are calibrated against physiological measurements rather
than questionnaire answers.

So the status below is deliberately **descriptive and not diagnostic**: it
reports what the person said about themselves, names the areas worth
attention, and offers one low-risk action at a time. It never assigns a risk
level, a probability, or a prediction.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from .mira_content import get_card

SOURCE_NOTE = (
    "Based on your assessment answers, not a diagnosis. A risk estimate "
    "appears here once your wearable sends readings."
)

_STATUS_SENTENCE = {
    "Very consistent": "your sleep schedule is consistent",
    "Mostly consistent": "your sleep schedule is mostly consistent",
    "Sometimes irregular": "your sleep schedule varies quite a bit",
    "Very irregular": "your sleep schedule is irregular",
}

_STRESS_SENTENCE = {
    "Rarely": "you rarely feel significant stress",
    "Occasionally": "you feel significant stress occasionally",
    "Frequently": "you feel significant stress frequently",
    "Almost daily": "you feel significant stress almost daily",
}

_HYDRATION_SENTENCE = {
    "Low": "you tend to drink little",
    "Moderate": "your fluid intake is moderate",
    "Good": "you keep your fluid intake up well",
    "Very good": "you keep your fluid intake up very well",
}

_CAFFEINE_SENTENCE = {
    "None": "you avoid caffeine",
    "1 serving/day": "you have about one caffeinated drink a day",
    "2–3 servings/day": "you have two or three caffeinated drinks a day",
    "2-3 servings/day": "you have two or three caffeinated drinks a day",
    "More than 3 servings/day": "you have more than three caffeinated drinks a day",
}

_ACTIVITY_SENTENCE = {
    "Very low": "you are not very physically active",
    "Low": "you are lightly physically active",
    "Moderate": "you keep a moderate activity level",
    "High": "you are physically active",
}

_HISTORY_SENTENCE = {
    "Never": "you have never had migraine or headache episodes",
    "Occasionally": "you have migraine or headache episodes occasionally",
    "Frequently": "you have migraine or headache episodes frequently",
    "Very frequently": "you have migraine or headache episodes very frequently",
}

_FREQUENCY_SENTENCE = {
    "Less than once/month": "less than once a month",
    "1–3/month": "one to three times a month",
    "1-3/month": "one to three times a month",
    "4–8/month": "four to eight times a month",
    "4-8/month": "four to eight times a month",
    "More than 8/month": "more than eight times a month",
}


def _card_body(card_id: str) -> str:
    card = get_card(card_id)
    return card["body"] if card else ""


def _load_profile(db: Session, user_id: int) -> Optional[dict[str, Any]]:
    row = db.execute(
        text("SELECT * FROM user_risk_profiles WHERE user_id = :uid"),
        {"uid": user_id},
    ).mappings().first()
    if row is None:
        return None
    profile = dict(row)
    triggers = profile.get("trigger_profile")
    if isinstance(triggers, str):
        import json

        try:
            profile["trigger_profile"] = json.loads(triggers)
        except ValueError:
            profile["trigger_profile"] = []
    return profile


def assessment_status(db: Session, user_id: int) -> Optional[dict[str, Any]]:
    """Describe the person's current standing from their assessment answers.

    Returns ``None`` when the user has not completed the assessment.
    """
    profile = _load_profile(db, user_id)
    if profile is None:
        return None

    focus: list[dict[str, str]] = []
    strengths: list[dict[str, str]] = []
    tips: list[dict[str, str]] = []

    # --- sleep ------------------------------------------------------------
    sleep = profile.get("sleep_profile")
    hours = profile.get("sleep_hours")
    if sleep:
        if sleep in ("Sometimes irregular", "Very irregular"):
            focus.append({
                "area": "Sleep",
                "detail": _STATUS_SENTENCE.get(sleep, sleep.lower()),
                "card_id": "ROUTINE_01",
            })
        else:
            strengths.append({
                "area": "Sleep",
                "detail": _STATUS_SENTENCE.get(sleep, sleep.lower()),
            })
    if hours:
        if hours < 6:
            focus.append({
                "area": "Sleep hours",
                "detail": f"you usually sleep about {hours:g} hours a night",
                "card_id": "ROUTINE_01",
            })
            strengths = [s for s in strengths if s["area"] != "Sleep"]
        elif hours > 9:
            focus.append({
                "area": "Sleep hours",
                "detail": f"you usually sleep about {hours:g} hours a night",
                "card_id": "ROUTINE_01",
            })

    # --- stress ------------------------------------------------------------
    stress = profile.get("stress_profile")
    if stress:
        if stress in ("Frequently", "Almost daily"):
            focus.append({
                "area": "Stress",
                "detail": _STRESS_SENTENCE.get(stress, stress.lower()),
                "card_id": "REST_05",
            })
        else:
            strengths.append({
                "area": "Stress",
                "detail": _STRESS_SENTENCE.get(stress, stress.lower()),
            })

    # --- hydration ---------------------------------------------------------
    hydration = profile.get("hydration_profile")
    if hydration:
        if hydration == "Low":
            focus.append({
                "area": "Hydration",
                "detail": _HYDRATION_SENTENCE.get(hydration, hydration.lower()),
                "card_id": "REST_03",
            })
        else:
            strengths.append({
                "area": "Hydration",
                "detail": _HYDRATION_SENTENCE.get(hydration, hydration.lower()),
            })

    # --- caffeine -----------------------------------------------------------
    caffeine = profile.get("caffeine_profile")
    if caffeine:
        if caffeine in ("2–3 servings/day", "2-3 servings/day", "More than 3 servings/day"):
            focus.append({
                "area": "Caffeine",
                "detail": _CAFFEINE_SENTENCE.get(caffeine, caffeine.lower()),
                "card_id": "ROUTINE_03",
            })
        else:
            strengths.append({
                "area": "Caffeine",
                "detail": _CAFFEINE_SENTENCE.get(caffeine, caffeine.lower()),
            })

    # --- activity -----------------------------------------------------------
    activity = profile.get("activity_profile")
    if activity:
        if activity in ("Very low", "Low"):
            focus.append({
                "area": "Activity",
                "detail": _ACTIVITY_SENTENCE.get(activity, activity.lower()),
                "card_id": "ROUTINE_01",
            })
        else:
            strengths.append({
                "area": "Activity",
                "detail": _ACTIVITY_SENTENCE.get(activity, activity.lower()),
            })

    # --- migraine history ---------------------------------------------------
    history_score = float(profile.get("migraine_history_score") or 0.0)
    history_note = None
    if history_score > 0:
        history_note = (
            f"you reported migraine or headache episodes "
            f"(history score {history_score:g} out of 12)"
        )
        if history_score >= 5.4:
            focus.append({
                "area": "Migraine history",
                "detail": history_note,
                "card_id": "ROUTINE_04",
            })
        else:
            strengths.append({"area": "Migraine history", "detail": history_note})

    # --- triggers -----------------------------------------------------------
    triggers = profile.get("trigger_profile") or []
    trigger_note = None
    if triggers:
        pretty = ", ".join(str(t).lower() for t in triggers)
        trigger_note = f"you have linked these to your headaches: {pretty}"
        focus.append({
            "area": "Your triggers",
            "detail": trigger_note,
            "card_id": "ROUTINE_04",
        })

    # --- headline and summary ------------------------------------------------
    if focus:
        headline = "Your baseline is set — here is where to start"
        areas = ", ".join(f["area"].lower() for f in focus[:2])
        summary = (
            f"Based on your assessment, {areas} "
            f"{'are' if len(focus) > 1 else 'is'} the area{'s' if len(focus) > 1 else ''} "
            f"worth attention first. Everything else looks reasonable, and a risk "
            f"estimate will appear once your wearable starts sending readings."
        )
    else:
        headline = "Your baseline looks steady"
        summary = (
            "Your assessment did not flag anything that needs attention right now. "
            "A risk estimate will appear once your wearable starts sending "
            "readings, and your diary will show how things change over time."
        )

    # --- tips ---------------------------------------------------------------
    seen: set[str] = set()
    for item in focus[:3]:
        card_id = item.get("card_id")
        if not card_id or card_id in seen:
            continue
        seen.add(card_id)
        tips.append({
            "card_id": card_id,
            "title": (get_card(card_id) or {}).get("title", ""),
            "body": _card_body(card_id),
        })
    if not tips:
        tips.append({
            "card_id": "ROUTINE_01",
            "title": (get_card("ROUTINE_01") or {}).get("title", ""),
            "body": _card_body("ROUTINE_01"),
        })

    baseline_note = ""
    resting_hr = profile.get("resting_hr")
    if resting_hr:
        baseline_note = (
            f"Resting heart rate about {resting_hr:g} bpm"
            + (f", typical sleep {hours:g} hours" if hours else "")
            + ". These come from your answers, not from a measurement yet."
        )

    return {
        "headline": headline,
        "summary": summary,
        "focus_areas": focus[:3],
        "strengths": strengths[:3],
        "tips": tips,
        "baseline_note": baseline_note,
        "source_note": SOURCE_NOTE,
        "content_version": (get_card("REST_01") or {}).get("version", "mira-content-1.0"),
    }


def status_reply(status: dict[str, Any]) -> str:
    """Render the status as a short Mira message."""
    parts = [status["summary"]]
    if status.get("focus_areas"):
        parts.append("You could start with: " + status["focus_areas"][0]["body"] + ".")
    if status.get("baseline_note"):
        parts.append(status["baseline_note"])
    parts.append(status["source_note"])
    return "\n\n".join(parts)
