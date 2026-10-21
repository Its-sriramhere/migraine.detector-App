"""Mira's reviewed-style knowledge cards.

Content seed from the Mira conversation playbook. Every card carries a
``review_status`` and a ``version`` so the library can be audited and rolled
back.

``review_status`` is deliberately seeded as ``"draft"``: the playbook states
that a qualified clinician must review health content and safety pathways
before public release, so nothing here may be presented as clinically
approved until that review happens.
"""
from __future__ import annotations

from typing import Any, Optional

CONTENT_VERSION = "mira-content-1.0"

REVIEW_STATUS_DRAFT = "draft"
REVIEW_STATUS_APPROVED = "approved"


def _card(
    card_id: str,
    category: str,
    title: str,
    body: str,
    use_when: str,
    avoid: str = "",
    safety: str = "",
    quick_replies: Optional[list[str]] = None,
) -> dict[str, Any]:
    return {
        "card_id": card_id,
        "category": category,
        "title": title,
        "body": body,
        "use_when": use_when,
        "avoid": avoid,
        "safety": safety,
        "quick_replies": quick_replies or [],
        "locale": "en",
        "version": CONTENT_VERSION,
        "review_status": REVIEW_STATUS_DRAFT,
    }


KNOWLEDGE_CARDS: list[dict[str, Any]] = [
    _card(
        "REST_01",
        "rest",
        "Dim, quiet rest",
        "If you can, move to a quiet space and dim the lights. Lying down may "
        "feel more comfortable during an attack. You can close the chat "
        "whenever you need.",
        "Active headache with light or sound sensitivity, or a request for a "
        "rest tip.",
        "Claiming rest will stop the attack or delay urgent care.",
        quick_replies=["Low-stimulation mode", "Another tip", "Done"],
    ),
    _card(
        "REST_02",
        "rest",
        "Cool compress",
        "A cool compress may ease discomfort for some people. Wrap it in cloth "
        "and place it gently on your forehead or neck for a short period. "
        "Stop if it feels uncomfortable.",
        "The user asks for a physical comfort idea.",
        safety="Avoid direct ice against skin. Limit applications to about "
        "15 minutes at a time and do not sleep with a heating pad.",
        quick_replies=["Try it", "More ideas", "Done"],
    ),
    _card(
        "REST_03",
        "rest",
        "Gentle hydration",
        "If drinking is safe for you, try a few sips of water. You do not need "
        "to force a large amount at once.",
        "The user may not have drunk enough and has no fluid restriction.",
        safety="If the user has medically prescribed fluid restrictions, "
        "follow clinician instructions. If they cannot keep fluids down, "
        "prompt care.",
        quick_replies=["Small sips", "I feel nauseated", "Done"],
    ),
    _card(
        "REST_04",
        "rest",
        "Sensory break",
        "Let's keep this short. Lower the screen brightness and take a break "
        "from notifications or loud sounds if possible.",
        "Screen or noise exposure is bothersome.",
        quick_replies=["Enable quiet mode", "Close Mira", "Another tip"],
    ),
    _card(
        "REST_05",
        "rest",
        "Short calming pause",
        "Would a brief calming pause help? Try a short breathing break: relax "
        "your shoulders and breathe in a comfortable, natural rhythm. There is "
        "no need to hold your breath or force deep breaths.",
        "The user is stressed and wants relaxation.",
        safety="Optional; stop if dizzy or uncomfortable. Never frame it as "
        "migraine treatment or emergency care.",
        quick_replies=["Start 1 minute", "Skip", "Other tip"],
    ),
    _card(
        "REST_06",
        "rest",
        "Nausea-friendly comfort",
        "Nausea can accompany migraine. A quiet space and small sips of water "
        "may help if tolerated. If you keep vomiting or cannot hold down "
        "fluids, seek medical advice promptly.",
        "Nausea without emergency signs.",
        quick_replies=["Small sips", "Log nausea", "Get care info"],
    ),
    _card(
        "ROUTINE_01",
        "routine",
        "Sleep consistency",
        "Many people find a steady sleep and wake schedule helpful. Consider a "
        "calmer wind-down and similar bedtimes when possible; one unusual "
        "night does not tell us the cause of a headache.",
        "The user asks about prevention habits or poor sleep.",
        quick_replies=["Tonight's plan", "Track sleep", "Done"],
    ),
    _card(
        "ROUTINE_02",
        "routine",
        "Regular meals",
        "Skipping meals may contribute to headaches for some people. When you "
        "feel able to eat, try a regular meal or snack that works for you.",
        "The user missed meals or asks about habits.",
        quick_replies=["Log a skipped meal", "Hydration", "Done"],
    ),
    _card(
        "ROUTINE_03",
        "routine",
        "Caffeine awareness",
        "Caffeine affects people differently; too much or sudden changes can "
        "be associated with headaches. If you notice a pattern, track timing "
        "and amount rather than making abrupt changes.",
        "The user asks whether caffeine causes or helps migraine.",
        quick_replies=["Log caffeine", "See diary", "Done"],
    ),
    _card(
        "ROUTINE_04",
        "routine",
        "Personal headache diary",
        "A diary can help you spot patterns over time. Consider noting when "
        "symptoms started, how they felt, what you were doing, sleep, meals, "
        "and what helped.",
        "The user wonders about triggers or clinician visits.",
        quick_replies=["Log this episode", "Open History", "Not now"],
    ),
    _card(
        "ROUTINE_05",
        "routine",
        "Gradual return after attack",
        "I'm glad it's easing. Some people feel tired afterward. Return to "
        "your usual activities at a pace that feels manageable and keep your "
        "normal rest and meal routine where possible.",
        "Symptoms are improving.",
        quick_replies=["Save an episode", "Quiet mode", "Done"],
    ),
    _card(
        "DATA_01",
        "data",
        "Explain heart rate",
        "Heart rate is the number of heartbeats per minute. It changes with "
        "activity, stress, sleep, and many other factors. A watch measurement "
        "alone cannot confirm a migraine or rule out a medical problem.",
        "The user asks what heart rate means.",
    ),
    _card(
        "DATA_02",
        "data",
        "Explain HRV",
        "HRV means heart rate variability: it describes the variation in the "
        "time between heartbeats. It can change with sleep, stress, illness, "
        "and other factors. Different devices calculate it differently; a "
        "single number is not a migraine diagnosis.",
        "The user asks what HRV means.",
        safety="Only show a user-specific HRV value if the source actually "
        "supplies verified HRV or RR intervals with units.",
    ),
    _card(
        "DATA_03",
        "data",
        "Explain sleep data",
        "Watch sleep information is an estimate, not a sleep test. It may help "
        "reveal trends when recordings are complete, but one night's score "
        "does not establish a migraine trigger.",
        "The user asks what the sleep data means.",
    ),
    _card(
        "DATA_04",
        "data",
        "Explain SpO2 and blood pressure",
        "Some watches estimate oxygen saturation or blood pressure, but these "
        "values may have important accuracy limits. Do not change treatment "
        "based on a watch estimate; use validated measurements and medical "
        "guidance.",
        "The user asks what SpO2 or blood pressure means.",
    ),
    _card(
        "DATA_05",
        "data",
        "Prediction transparency",
        "The app displayed {risk_label} at {model_timestamp} based on "
        "{available_features}. This is a model estimate, not a diagnosis or "
        "guarantee. {data_quality_caveat}.",
        "The user asks why the app shows a particular risk level.",
        safety="Use only real prediction API fields. If no prediction is "
        "available, say that prediction is not available yet.",
    ),
]

_CARD_INDEX: dict[str, dict[str, Any]] = {c["card_id"]: c for c in KNOWLEDGE_CARDS}


def get_card(card_id: str) -> Optional[dict[str, Any]]:
    return _CARD_INDEX.get(card_id)


def cards_for(intent: str) -> list[dict[str, Any]]:
    """Cards a given intent is allowed to surface."""
    mapping = {
        "rest_guidance": ["REST_01", "REST_05", "REST_04"],
        "light_sensitivity": ["REST_04", "REST_01"],
        "sound_sensitivity": ["REST_04", "REST_01"],
        "breathing": ["REST_05"],
        "stress_support": ["REST_05", "REST_01"],
        "hydration": ["REST_03"],
        "nausea": ["REST_06", "REST_03"],
        "cold_compress": ["REST_02"],
        "sleep_habits": ["ROUTINE_01", "DATA_03"],
        "meal_regular": ["ROUTINE_02"],
        "trigger_reflection": ["ROUTINE_04", "ROUTINE_03"],
        "post_attack": ["ROUTINE_05"],
        "vitals_explain": ["DATA_01", "DATA_02", "DATA_03", "DATA_04"],
        "prediction_explain": ["DATA_05"],
        "no_data": ["DATA_03"],
        "headache_now": ["REST_01", "REST_03"],
    }
    return [_CARD_INDEX[c] for c in mapping.get(intent, []) if c in _CARD_INDEX]


# Which metric the user actually asked about, so "what is HRV?" does not get
# the heart-rate card.
_METRIC_CARDS = (
    (("hrv", "heart rate variability"), "DATA_02"),
    (("heart rate", "pulse", "bpm"), "DATA_01"),
    (("sleep", "stages", "bedtime"), "DATA_03"),
    (("spo2", "oxygen", "saturation", "blood pressure", "bp"), "DATA_04"),
)


def best_card(intent: str, text: str) -> Optional[dict[str, Any]]:
    """The single most relevant card for a question."""
    cards = cards_for(intent)
    if not cards:
        return None
    lowered = str(text or "").lower()
    if intent == "vitals_explain":
        for keywords, card_id in _METRIC_CARDS:
            if any(k in lowered for k in keywords):
                return _CARD_INDEX.get(card_id)
    return cards[0]


def content_payload() -> list[dict[str, Any]]:
    return [dict(card) for card in KNOWLEDGE_CARDS]
