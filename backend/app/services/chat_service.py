"""Mira — the in-app guide and wellness assistant.

Ported from the Mira v2 Node/Express widget so the mobile app can talk to a
single FastAPI backend. The feature guide is the single source of truth for
what the app actually contains, so it must be kept in sync with the shipped
screens.

App-feature questions are always answered from this deterministic guide, even
when an AI key is configured, so the assistant can never invent a feature the
app does not have. Only open-ended wellness questions may reach the model.
"""

from __future__ import annotations

import re
import math
import unicodedata
from typing import Any, Iterable, Optional

APP_NAME = "Migraine Detector"

EMERGENCY_TEXT = (
    "Your symptoms may indicate a medical emergency. Seek immediate emergency "
    "care or call your local emergency number now. Do not rely on this chatbot "
    "or a smartwatch reading."
)

# --- Feature guide ---------------------------------------------------------

APP_FEATURES: list[dict[str, Any]] = [
    {
        "id": "overview",
        "icon": "?",
        "title": "App overview",
        "short_title": "Overview",
        "route": "home",
        "summary": (
            "Migraine Detector is a wearable-inspired migraine wellness "
            "companion. It combines sleep, HRV, blood-pressure and SpO2 "
            "displays with an explainable risk estimate, trends, educational "
            "alerts, a migraine log and a wearable connection screen."
        ),
        "see": (
            "The app opens on the Home dashboard, then moves through Migraine "
            "Prediction, Health Metrics, Trends & Analytics, Insights & "
            "Alerts, Recommendations, Migraine History, Sleep Analytics, the "
            "Wearable Connection screen and Profile & Settings."
        ),
        "steps": [
            "Open Home to check the wearable connection and your daily summary.",
            "Open Migraine Prediction to read the risk estimate and the signals behind it.",
            "Review Health Metrics and Trends & Analytics for individual measurements.",
            "Use Insights & Alerts for illustrative warnings and self-care suggestions.",
            "Open Migraine History to review episodes, and Profile & Settings for preferences.",
        ],
        "note": (
            "This is a research prototype. Risk numbers and onset windows are "
            "illustrative, not a validated forecast or a clinical diagnosis."
        ),
        "keywords": [
            "what does the app do", "about the app", "feature list", "features overview",
            "app walkthrough", "how does this app work", "start using the app",
            "all features", "tour", "introduction", "app overview",
        ],
    },
    {
        "id": "dashboard",
        "icon": "o",
        "title": "Home Dashboard",
        "short_title": "Dashboard",
        "route": "home",
        "summary": (
            "The Home dashboard is a quick snapshot of your predicted risk, the "
            "wearable connection state and today's sleep, HRV, blood pressure "
            "and SpO2."
        ),
        "see": (
            "A Migraine Risk card with the current level, a Today's Health "
            "grid of four metric cards, and a Your Trend card that links to "
            "analytics and insights."
        ),
        "steps": [
            "Open the Home tab.",
            "Check the risk card first, then the four health metric cards.",
            "Tap the risk card to open Migraine Prediction.",
            "Use View analytics for trends and Insights & alerts for warnings.",
        ],
        "note": (
            "A single reading cannot confirm or rule out a migraine, and not "
            "every watch measures blood pressure."
        ),
        "keywords": [
            "home screen", "home tab", "dashboard", "overview cards", "main screen",
            "risk card", "today health", "wearable battery on home",
        ],
    },
    {
        "id": "prediction",
        "icon": "?",
        "title": "Migraine Prediction",
        "short_title": "Prediction",
        "route": "prediction",
        "summary": (
            "The Migraine Prediction screen shows the current risk estimate as "
            "a three-band gauge, the possible risk trend over the coming "
            "hours, and the signals that most influenced the estimate."
        ),
        "see": (
            "An estimated risk gauge that moves from green to amber to red, a "
            "possible risk trend chart with a now / +2h to +12h axis, and a "
            "Signals to review list covering sleep consistency, HRV pattern "
            "and resting signals."
        ),
        "steps": [
            "Open Migraine Prediction from the risk card on Home.",
            "Read the score together with its band and the disclaimer under it.",
            "Scroll to Possible risk trend to see how the estimate has moved.",
            "Read the Signals to review list to see which measurements to look at.",
        ],
        "note": (
            "The score is produced by a heuristic model, not a clinically "
            "validated predictor. It is not a diagnosis."
        ),
        "keywords": [
            "prediction screen", "prediction tab", "migraine prediction",
            "risk prediction", "risk score meaning", "risk score", "why this risk",
            "risk calculation", "how does it predict", "predict migraines",
            "early detection", "prediction model", "algorithm", "signals to review",
            "possible risk trend",
        ],
    },
    {
        "id": "vitals",
        "icon": "?",
        "title": "Health Metrics",
        "short_title": "Vitals",
        "route": "monitoring",
        "summary": (
            "Health Metrics shows each wearable signal on its own, with a "
            "range selector and a chart of the recent readings."
        ),
        "see": (
            "Sleep, HRV, blood pressure and SpO2, each with the current value, "
            "the most recent readings, and the predicted risk for the day."
        ),
        "steps": [
            "Open the Monitoring tab.",
            "Switch between Sleep, HRV, Blood Pressure and SpO2.",
            "Read the units: HRV in ms, blood pressure in mmHg, SpO2 in %, sleep as hours and minutes.",
            "Compare the readings with your own usual range rather than one spike.",
        ],
        "note": (
            "Not all watches measure blood pressure. For medical decisions use "
            "a validated device and your clinician's guidance."
        ),
        "keywords": [
            "vitals screen", "vitals trends", "trends screen", "health metrics",
            "hrv chart", "spo2 chart", "blood pressure chart", "heart rate chart",
            "24h 7d 30d", "view trends", "measurements graph", "graph reading",
            "monitoring tab",
        ],
    },
    {
        "id": "trends",
        "icon": "?",
        "title": "Trends & Analytics",
        "short_title": "Trends",
        "route": "trends",
        "summary": (
            "Trends & Analytics plots the predicted risk over a chosen window "
            "and lists every prediction that was made."
        ),
        "see": (
            "A 7D, 30D or ALL range selector, a risk trend chart, and summary "
            "tiles for average risk, number of predictions and high-risk count."
        ),
        "steps": [
            "Open Trends & Analytics from the Your Trend card on Home.",
            "Choose the 7D, 30D or ALL range.",
            "Read the average risk, prediction count and high-risk count.",
            "Scroll the prediction list for the score, window and source of each entry.",
        ],
        "note": (
            "The trend reflects the readings that were available at the time, "
            "not a confirmed outcome."
        ),
        "keywords": [
            "trends screen", "analytics", "risk trend", "prediction history",
            "7d 30d all", "average risk", "how has my risk changed",
        ],
    },
    {
        "id": "sleep",
        "icon": "?",
        "title": "Sleep Analytics",
        "short_title": "Sleep",
        "route": "sleep",
        "summary": (
            "Sleep Analytics summarises overnight duration, an estimated sleep "
            "quality score and a breakdown of the sleep stages."
        ),
        "see": (
            "Total sleep time, a quality score out of 100, stacked bars for "
            "Awake, REM, Light and Deep, and a stage breakdown with a routine "
            "tip."
        ),
        "steps": [
            "Open Sleep Analytics.",
            "Check last night's total sleep time and the quality score.",
            "Compare the Awake, REM, Light and Deep stage estimates.",
            "Use the routine tip to aim for a steadier bed and wake time.",
        ],
        "note": (
            "Watch sleep stages and quality scores are estimates, not a "
            "clinical sleep study. Stage data is modelled until your wearable "
            "reports it directly."
        ),
        "keywords": [
            "sleep screen", "sleep analytics", "sleep stages", "sleep quality score",
            "rem deep light", "sleep chart", "sleep history in app", "where is sleep",
            "awake rem light deep",
        ],
    },
    {
        "id": "history",
        "icon": "?",
        "title": "Migraine History",
        "short_title": "History",
        "route": "history",
        "summary": (
            "Migraine History is your logbook: the episodes you recorded, how "
            "often they happened and how severe they were."
        ),
        "see": (
            "A month selector, tiles for episode days, average severity and the "
            "change against last month, an episode frequency chart, and your "
            "recent episodes."
        ),
        "steps": [
            "Open Migraine History.",
            "Use the arrows to move between months.",
            "Check the episode days, average severity and month-on-month change.",
            "Open the Symptoms tab to log a new episode.",
        ],
        "note": (
            "Counts and averages reflect only what was logged. A log entry "
            "near a reading does not prove the reading caused the episode."
        ),
        "keywords": [
            "history screen", "migraine history", "diary", "episode log",
            "symptom log", "trigger chart", "top triggers", "profile settings",
            "migraine days", "history chart", "where to log", "episode frequency",
        ],
    },
    {
        "id": "alerts",
        "icon": "?",
        "title": "Insights & Alerts",
        "short_title": "Alerts",
        "route": "alerts",
        "summary": (
            "Insights & Alerts lists the warnings the app raised and the "
            "self-care suggestions that came with them."
        ),
        "see": (
            "An alert list with the risk level and the signals involved, plus "
            "recommendations such as staying hydrated, resting, breathing and "
            "reducing screen exposure."
        ),
        "steps": [
            "Open Insights & Alerts from the Home trend card.",
            "Read which signals each warning cited.",
            "Choose a general self-care action that fits your needs.",
            "Follow a clinician-provided care plan rather than an app alert for medication.",
        ],
        "note": (
            "Alerts reflect prototype model estimates and can include labelled "
            "developer tests. They are not clinical warnings and never decide "
            "treatment for you."
        ),
        "keywords": [
            "alert screen", "alerts", "notification", "early warning", "reminder",
            "recommendations screen", "recommended actions", "breathing exercise in app",
            "rest reduce activity", "screen exposure", "insights",
        ],
    },
    {
        "id": "recommendations",
        "icon": "?",
        "title": "Recommendations",
        "short_title": "Tips",
        "route": "recommendations",
        "summary": (
            "Recommendations turns the current prediction into concrete, "
            "low-effort next steps."
        ),
        "see": (
            "A short ordered list of calming steps, each tied to the signal "
            "that triggered it."
        ),
        "steps": [
            "Open Recommendations from Insights & Alerts.",
            "Work through the steps in order.",
            "Re-check the prediction after resting.",
        ],
        "note": (
            "These are general wellbeing suggestions, not treatment advice."
        ),
        "keywords": [
            "recommendations", "advice", "what should I do", "next steps",
            "calming steps", "rest and reduce activity",
        ],
    },
    {
        "id": "watch",
        "icon": "?",
        "title": "Connect & Sync a Wearable",
        "short_title": "Wearable",
        "route": "watch",
        "summary": (
            "The Wearable Connection screen pairs your watch, shows its "
            "battery and streams live readings into the app."
        ),
        "see": (
            "Connection state, battery percentage, a sync action and the live "
            "heart rate, HRV, blood pressure and SpO2 coming from the device."
        ),
        "steps": [
            "Tap the + button in the bottom navigation to open Wearable Connection.",
            "Scan for nearby wearables and pair the one you want.",
            "Check the battery and the live readings.",
            "Use the simulated wearable when you have no hardware to hand.",
        ],
        "note": (
            "Expo Go uses the simulated device because it does not include "
            "the Bluetooth native module. An installed native build can pair "
            "a compatible wearable."
        ),
        "keywords": [
            "connect watch", "connect wearable", "pair watch", "garmin", "sync data",
            "sync watch", "bluetooth", "device connection", "battery status",
            "watch setup", "wearable integration", "no data", "device disconnected",
            "simulated wearable", "plus button",
        ],
    },
    {
        "id": "profile",
        "icon": "?",
        "title": "Profile & Settings",
        "short_title": "Profile",
        "route": "profile",
        "summary": (
            "Profile & Settings holds your account, the health assessment, "
            "your migraine log and the app preferences."
        ),
        "see": (
            "Your name and email, links to the health assessment, migraine "
            "history, medication notes, notifications, data and privacy, and "
            "help and support."
        ),
        "steps": [
            "Open the Profile tab.",
            "Re-take the health assessment to refresh your personal baseline.",
            "Review notification and privacy preferences.",
        ],
        "note": (
            "The app stores your readings on the backend and keeps your session "
            "token in the device keystore."
        ),
        "keywords": [
            "settings", "privacy", "permissions", "notifications settings",
            "change alerts", "data privacy", "profile screen", "health assessment",
            "baseline", "personal information", "medication notes",
        ],
    },
    {
        "id": "limitations",
        "icon": "?",
        "title": "Accuracy & Safety",
        "short_title": "Accuracy",
        "route": "prediction",
        "summary": (
            "The app is a prototype. Its scores, alert cards and trend lines "
            "are illustrative rather than the output of a clinically validated "
            "predictive model."
        ),
        "see": (
            "Wearables estimate signals, and a migraine cannot be predicted "
            "reliably from a single sleep, HRV, blood-pressure or SpO2 reading."
        ),
        "steps": [
            "Treat the risk indicator as an interface example only.",
            "Read trends alongside symptoms and relevant context.",
            "Discuss frequent or changing headaches with a qualified clinician.",
            "Seek urgent care for a sudden severe headache or neurological warning signs.",
        ],
        "note": (
            "Neither this assistant nor the risk score is a substitute for "
            "medical care."
        ),
        "keywords": [
            "accuracy", "how accurate", "is it reliable", "is it medical",
            "is it validated", "false alarm", "limitations", "data accurate",
            "can it detect", "real prediction", "diagnosis", "trust prediction",
            "training data", "how reliable is the risk score",
        ],
    },
]

TOUR_IDS = [
    "overview", "dashboard", "prediction", "vitals", "trends",
    "sleep", "history", "alerts", "watch", "limitations",
]

APP_QUESTIONS = [
    {"title": "Take the app tour", "topic_id": "overview", "question": "Show me the full app walkthrough"},
    {"title": "Explain the risk score", "topic_id": "prediction", "question": "What does the migraine risk score mean?"},
    {"title": "Understand HRV charts", "topic_id": "vitals", "question": "How do I read the vitals charts?"},
    {"title": "Connect my watch", "topic_id": "watch", "question": "How do I connect my watch?"},
    {"title": "View migraine history", "topic_id": "history", "question": "How do I view migraine history?"},
    {"title": "How reliable is it?", "topic_id": "limitations", "question": "Is this migraine prediction clinically validated?"},
]

HEALTH_PROMPTS = [
    "What does HRV mean?",
    "How does sleep affect migraines?",
    "Common migraine triggers",
    "What is SpO2?",
]


def get_feature(feature_id: str) -> Optional[dict[str, Any]]:
    for feature in APP_FEATURES:
        if feature["id"] == feature_id:
            return feature
    return None


_APP_INTENT = re.compile(
    r"\b(app|feature|screen|tab|dashboard|inside|navigate|navigation|show me|tour|"
    r"guide|walkthrough|where (can|do|is)|how (do|can) i (find|open|view|see|use|track|check)|"
    r"connect|pair|sync|settings|notification|risk score|onset window|"
    r"how does (the|your|this) (app|model|detector)|migraine detector|chart|graph|history|"
    r"diary|log|prediction|predict|alerts?|sleep stages|reliab|accurac|validat|limitations)\b",
    re.IGNORECASE,
)

_ACCURACY = re.compile(
    r"\b(accurate|accuracy|reliable|reliability|validated|validation|validity|"
    r"clinical proof|false alarm|trustworthy)\b",
    re.IGNORECASE,
)


def find_feature_for_question(question: str, topic_id: Optional[str] = None) -> Optional[dict[str, Any]]:
    """Prefer an explicit feature selection, otherwise require app intent."""
    if topic_id:
        chosen = get_feature(topic_id)
        if chosen:
            return chosen

    q = normalize_question(question)
    # Educational questions should not accidentally match app navigation
    # words such as 'prevent', 'history', or 'prediction'.
    if re.search(r"\b(what (is|does)|meaning of|define|how does|why does)\b", q) and not re.search(
        r"\b(app|screen|chart|score|model|predict|prediction|work)\b", q
    ):
        return None
    if not _APP_INTENT.search(q):
        return None

    if _ACCURACY.search(q):
        return get_feature("limitations")

    # Strong, specific intent takes priority over loose keyword scores.
    for pattern, feature_id in [
        (r"\b(connect|pair|bluetooth|sync|wearable|watch|device)\b", "watch"),
        (r"\b(log|record)\b.*\b(migraine|episode|symptom|headache)\b", "history"),
        (r"\b(sleep stages|sleep analytics|sleep quality)\b", "sleep"),
        (r"\b(why this risk|risk score|prediction screen|prediction model)\b", "prediction"),
    ]:
        if re.search(pattern, q):
            return get_feature(feature_id)

    best: Optional[dict[str, Any]] = None
    best_score = 0
    for feature in APP_FEATURES:
        points = 0
        if feature["title"].lower() in q:
            points += 9
        if feature["short_title"].lower() in q:
            points += 5
        for word in feature["keywords"]:
            if word.lower() in q:
                points += max(2, min(10, len(word) // 3))
        if feature["id"] == "overview" and re.search(r"\b(tour|walkthrough|all features|about the app)\b", q):
            points += 12
        if feature["id"] == "prediction" and re.search(r"risk score|prediction|why this risk", q):
            points += 8
        if feature["id"] == "watch" and re.search(r"watch|garmin|sync|device|bluetooth", q):
            points += 7
        if feature["id"] == "history" and re.search(r"trigger|diary|log|migraine history|episode", q):
            points += 7
        if feature["id"] == "sleep" and re.search(r"sleep (stage|screen|analytics|chart)", q):
            points += 8
        if feature["id"] == "vitals" and re.search(r"hrv chart|trends|vitals|metrics", q):
            points += 6
        if points > best_score:
            best_score = points
            best = feature

    if not best:
        return None
    return best


def format_feature_answer(feature: dict[str, Any], concise: bool = False) -> str:
    steps = feature["steps"]
    if concise:
        return (
            f"{feature['title']}\n{feature['summary']}\n\n"
            f"Where to look: {steps[0]}\n\n"
            f"Note: {feature['note']}"
        )
    numbered = "\n".join(f"{i}. {step}" for i, step in enumerate(steps, start=1))
    return (
        f"{feature['title']}\n\n"
        f"What this feature does\n{feature['summary']}\n\n"
        f"What you'll see\n{feature['see']}\n\n"
        f"How to use it\n{numbered}\n\n"
        f"Important\n{feature['note']}"
    )


# --- Safety ----------------------------------------------------------------

_URGENT_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\b(thunderclap|worst headache (?:of|in) (?:my|the) life|sudden (?:worst|severe|explosive) headache)\b",
        r"\b(?:new |sudden )?(?:one.side weakness|weakness on one side|facial droop|slurred speech|trouble speaking|can't speak|cannot speak|stroke symptoms)\b",
        r"\b(?:new vision loss|sudden loss of vision|seizure|unconscious|passed out|fainted|fever (?:with|and) stiff neck|stiff neck (?:and|with) fever|can't breathe|cannot breathe|difficulty breathing)\b",
    ]
]


def has_urgent_symptoms(question: str) -> bool:
    return any(pattern.search(str(question or "")) for pattern in _URGENT_PATTERNS)


def safe_metrics(payload: Any) -> Optional[dict[str, float]]:
    """Whitelist the numeric wearable fields that may be shared with the model."""
    if not isinstance(payload, dict):
        return None
    ranges = {
        "sleepHours": (0, 24),
        "hrvMs": (0, 500),
        "systolic": (40, 300),
        "diastolic": (20, 200),
        "spo2": (0, 100),
    }
    out: dict[str, float] = {}
    for key, (low, high) in ranges.items():
        value = payload.get(key)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            number = float(value)
            if math.isfinite(number) and low <= number <= high:
                out[key] = number
    return out or None


# --- Offline answers -------------------------------------------------------

_WELLNESS: list[tuple[str, str]] = [
    (
        r"\b(hrv|heart rate variability)\b",
        "HRV means heart rate variability: small changes in the time between "
        "heartbeats. Stress, sleep, illness, exercise and measurement conditions "
        "can affect it. In the app, open Health Metrics to compare your HRV over "
        "time; one HRV number cannot diagnose or predict a migraine.",
    ),
    (
        r"(spo2|oxygen|saturation)",
        "SpO2 estimates blood oxygen saturation. Wrist readings can be inaccurate "
        "due to motion, fit, temperature and other factors. The Health Metrics "
        "screen can display SpO2; it is not a test for migraine. Trouble "
        "breathing needs urgent medical care.",
    ),
    (
        r"\b(blood pressure|bp)\b",
        "Blood pressure describes the pressure in your arteries, reported as "
        "systolic/diastolic in mmHg. Not all watches support reliable BP "
        "readings; use a validated cuff when medical accuracy matters. A BP "
        "change by itself does not establish migraine risk.",
    ),
    (
        r"\b(sleep|bedtime|rest|insomnia)\b",
        "Consistent sleep and wake times may help with migraine management. "
        "Sleep Analytics shows your duration and estimated sleep stages, and "
        "Migraine History lets you compare changes with your diary. Watch "
        "estimates are not a clinical sleep study.",
    ),
    (
        r"\b(hydrat\w*|water|drink\w*|dehydrat\w*)\b",
        "Drink water regularly, especially in hot weather or with activity. "
        "Dehydration can be a headache trigger for some people; drinking extra "
        "water is not a guaranteed treatment for a migraine. Use Migraine "
        "History to look for your own patterns.",
    ),
    (
        r"\b(trigger\w*|prevent\w*|avoid\w*|food\w*|caffeine)\b",
        "Potential migraine triggers vary from person to person. Changes in "
        "sleep, missed meals, stress, dehydration and certain foods can be "
        "associated with attacks for some people. Keep a diary and compare "
        "entries over several weeks; a correlation does not prove cause.",
    ),
    (
        r"\b(stress\w*|anxious|breath\w*|relax\w*)\b",
        "You could try a short breathing break, gentle stretching and a quieter "
        "environment if those feel helpful. The Insights & Alerts screen "
        "illustrates supportive self-care suggestions, but they are not "
        "treatments or substitutes for professional care.",
    ),
    (
        r"\b(medicine|medication|tablet|painkiller|treatment|drug)\b",
        "Migraine medication choices depend on your health history and other "
        "medicines. Follow a plan from your clinician or ask a pharmacist for "
        "advice; do not start, stop or change prescriptions because of a risk "
        "score. Seek medical help for new or concerning symptoms.",
    ),
    (
        r"\b(migraine|headache|pain|aura|attack)\b",
        "Migraine is a neurological condition that can involve headache, "
        "sensitivity to light or sound, nausea and sometimes aura. A dark, "
        "quiet space and following your clinician's care plan may help during "
        "an episode. Sudden severe or unusual symptoms need medical assessment. "
        "Migraine History helps you track patterns.",
    ),
]

_FALLBACK = (
    "I can guide you through every screen of Migraine Detector, explain the "
    "risk score, wearable syncing, sleep and vitals charts, alerts, history "
    "and profile, and give general migraine wellness tips. Try \"Take the app "
    "tour\" or pick a feature below."
)


def offline_answer(question: str, topic_id: Optional[str] = None) -> dict[str, Any]:
    """Deterministic answer from the built-in guide and wellness FAQ."""
    q = normalize_question(question)

    if has_urgent_symptoms(q):
        return {"reply": EMERGENCY_TEXT, "mode": "safety", "topic_id": None}

    if re.search(r"\b(what is|what's|tell me|why is) my (current )?(risk|score|hrv|blood pressure|spo2|sleep)\b", q):
        return {"reply": "I don't have access to your personal readings in this conversation. Open Home for the latest values, Migraine Prediction for the risk estimate, or Monitoring for the measurement history. Tell me which measurement you want explained; I can describe its meaning without guessing your results.", "mode": "guide", "topic_id": "dashboard"}

    feature = find_feature_for_question(q, topic_id)
    if feature:
        return {
            "reply": format_feature_answer(feature, concise=True),
            "mode": "guide",
            "topic_id": feature["id"],
        }

    if re.fullmatch(r"(hi|hello|hey|good morning|good evening)[!. ]*", q):
        return {"reply": "Hi, I'm Mira. Ask me about a screen, connecting your watch, or a migraine wellness topic. What would you like help with?", "mode": "demo", "topic_id": None}

    for pattern, reply in _WELLNESS:
        if re.search(pattern, q):
            return {"reply": reply, "mode": "demo", "topic_id": None}

    return {"reply": _FALLBACK, "mode": "demo", "topic_id": None}


def normalize_question(question: str) -> str:
    q = unicodedata.normalize("NFKC", str(question or "")).lower().replace("’", "'")
    for typo, word in {"montoring": "monitoring", "symptomps": "symptoms", "bluethooth": "bluetooth", "migrane": "migraine", "heartrate": "heart rate", "sp02": "spo2"}.items():
        q = re.sub(rf"\b{typo}\b", word, q)
    return re.sub(r"\s+", " ", q).strip()


def answer_with_context(messages: list[dict[str, str]], topic_id: Optional[str] = None) -> dict[str, Any]:
    question = messages[-1]["content"]
    q = normalize_question(question)
    # Only borrow context for explicit short follow-ups. A new health
    # question must not inherit an unrelated previously selected topic.
    if not topic_id and re.fullmatch(r"(tell me more|explain (it|that)|how (do|can) i (open|use|find) it|where is (it|that))[?.! ]*", q):
        for message in reversed(messages[:-1]):
            if message["role"] != "user":
                continue
            feature = find_feature_for_question(message["content"])
            if feature:
                topic_id = feature["id"]
                break
    return offline_answer(question, topic_id)


def feature_payload() -> list[dict[str, Any]]:
    """The guide as the mobile app wants it."""
    return [
        {
            "id": f["id"],
            "icon": f["icon"],
            "title": f["title"],
            "short_title": f["short_title"],
            "route": f["route"],
            "summary": f["summary"],
            "see": f["see"],
            "steps": f["steps"],
            "note": f["note"],
        }
        for f in APP_FEATURES
    ]


def iter_feature_ids(features: Iterable[dict[str, Any]]) -> list[str]:
    return [f["id"] for f in features]
