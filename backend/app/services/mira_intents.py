"""Mira's intent catalog and safety tiers.

Routing data from the Mira conversation playbook. Two things matter here:

1. **Safety runs first.** Every message is screened for emergency and
   urgent-but-not-emergency red flags *before* any intent is chosen, so a
   safety message can never be answered with a wellness tip.
2. **Precedence is fixed.** When several intents could match, the order below
   decides. Clinical safety outranks everything.
"""
from __future__ import annotations

import re
from typing import Any, Optional

# --- safety tiers -----------------------------------------------------------
SAFETY_ROUTINE = "routine"
SAFETY_PROMPT_CARE = "prompt_care"
SAFETY_EMERGENCY = "emergency"
SAFETY_DATA_REQUIRED = "data_required"
SAFETY_CONSENT_REQUIRED = "consent_required"
SAFETY_AUTH_AND_CONFIRMATION = "auth_and_confirmation"

SAFETY_LEVELS = (
    SAFETY_EMERGENCY,
    SAFETY_PROMPT_CARE,
    SAFETY_AUTH_AND_CONFIRMATION,
    SAFETY_CONSENT_REQUIRED,
    SAFETY_DATA_REQUIRED,
    SAFETY_ROUTINE,
)

# --- emergency red flags ----------------------------------------------------
# "A sudden severe headache or new weakness, speech, or vision changes can be
# an emergency." These interrupt the normal flow.
EMERGENCY_PATTERNS: list[str] = [
    r"\b(thunderclap|worst (?:headache|one) (?:of|in) (?:my|the) life|worst headache ever|worst pain of my life|sudden(?:ly)? (?:worst|severe|explosive|worst-ever) headache|headache (?:hit|came on) (?:full force|instantly)|headache came on in seconds)\b",
    r"\b(?:new |sudden )?(?:one[- ]side weakness|weakness on one side|arm is weak|face is drooping|facial droop|slurring (?:my )?words|slurred speech|trouble speaking|can'?t speak|cannot speak|stroke symptoms|confusion so severe)\b",
    r"\b(?:new |sudden )?(?:vision loss|loss of vision|lost vision|vision went dark|blind in one eye|can'?t see (?:in one eye|at all))\b",
    r"\b(seizure|seizures|passed out|fainted|unconscious|black(ed)? out)\b",
    r"\b(?:fever (?:with|and) (?:a )?stiff neck|stiff neck (?:and|with) (?:a )?fever|severe headache after (?:a )?(?:head|falling) injury)\b",
    r"\b(?:can'?t breathe|cannot breathe|difficulty breathing|chest pain|chest tightness)\b",
]

# --- urgent but not necessarily emergency -----------------------------------
URGENT_PATTERNS: list[str] = [
    r"\b(?:for |been )?(?:four|5|five|3|three|4|several|multiple) days\b",
    r"\b(?:headache|migraine|symptoms?) (?:for|lasting|going on) (?:more than|over) (?:72 hours|three days|4 days)\b",
    r"\b(?:aura|visual aura) (?:for|lasting|lasting over|more than) (?:an? )?hour\b",
    r"\b(first[- ]time|first time|new) aura\b",
    r"\b(?:i am|i'm|my) pregnant\b",
    r"\bjust (?:had|gave birth|given birth|had the baby)\b",
    r"\bpostpartum\b",
    r"\b(?:vomiting|throwing up) (?:repeatedly|again and again|constantly)\b",
    r"\bcan'?t keep (?:water|fluids|liquids) down\b",
    r"\b(?:getting|getting worse|more frequent|progressively) (?:worse|more severe|frequent)\b",
    r"\b(?:headache|migraine) (?:is|are|get) (?:worse|different|changing)\b",
]

_EMERGENCY_RE = [re.compile(p, re.IGNORECASE) for p in EMERGENCY_PATTERNS]
_URGENT_RE = [re.compile(p, re.IGNORECASE) for p in URGENT_PATTERNS]


def scan_safety(message: str) -> tuple[str, list[str]]:
    """Return (safety_level, matched_flags) for a message."""
    text = str(message or "")
    flags = [p.pattern for p in _EMERGENCY_RE if p.search(text)]
    if flags:
        return SAFETY_EMERGENCY, flags
    flags = [p.pattern for p in _URGENT_RE if p.search(text)]
    if flags:
        return SAFETY_PROMPT_CARE, flags
    return SAFETY_ROUTINE, []


# --- intents ----------------------------------------------------------------
# (intent, pattern, safety level, quick replies)
_INTENTS: list[tuple[str, str, str, list[str]]] = [
    # --- clinical safety first -------------------------------------------
    ("severe_headache", r"\b(worst|worst ever|worst headache ever|explosive|thunderclap|can'?t speak|can'?t walk|vision loss|passed out|seizure|face droop|one[- ]side weakness)\b", SAFETY_EMERGENCY, ["Emergency help"]),
    ("urgent_clinical", r"\b(pregnant|postpartum|four days|for days|more than 72 hours|aura for over an hour|repeatedly vomiting|can'?t keep (?:water|fluids) down|getting worse|new and different)\b", SAFETY_PROMPT_CARE, ["Get care info", "Prepare symptom summary"]),

    # --- privacy and medication -----------------------------------------
    ("privacy_delete", r"\b(delete|remove|erase|forget)\b.*\b(my |our )?(headache |migraine |symptom |conversation|chat |data)\b", SAFETY_AUTH_AND_CONFIRMATION, ["Privacy controls", "Cancel"]),
    ("medication_question", r"\b(take|pop|swallow|double)\b.*\b(another |more |extra |a )?(tablet|pill|dose|medication|medicine|painkiller|ibuprofen|paracetamol)\b|\b(dose|dosage)\b|\b(medication|medicine|painkiller|ibuprofen|paracetamol)\b", SAFETY_ROUTINE, ["Log medication", "Comfort options", "Done"]),

    # --- recording ---------------------------------------------------------
    ("log_episode", r"\b(?:i want to|i'd like to|can you|please)\s+(?:save|log|record|note)\b|\b(?:save|log|record|note (?:down|it))\b.*\b(?:this|my|a|an|episode|attack|headache|migraine|symptom)\b", SAFETY_CONSENT_REQUIRED, ["Save", "Edit details", "Cancel"]),
    ("view_history", r"\b(show|list|see|open)\b.*\b(last|past|previous|my )?(attacks?|episodes?|history|diary)\b", SAFETY_ROUTINE, ["Open History", "Summary"]),

    # --- rest and comfort --------------------------------------------------
    ("headache_now", r"\b(my head hurts|(?:i have|i've got|i got|got) (?:a |an |another )?(?:\w+ )?headache|headache (?:is )?(?:here|starting|now|again)|migraine (?:is )?(?:starting|now|coming)|it'?s a headache)\b", SAFETY_ROUTINE, ["Dark room", "Log it", "More symptoms"]),
    ("symptom_checkin", r"\b(ask me how i feel|check.?in|how (?:am i|do i) feel|how severe)\b", SAFETY_ROUTINE, ["Mild", "Moderate", "Severe"]),
    ("light_sensitivity", r"\b(screen (?:is |too )?bright|bright light|light (?:hurts|is too much)|photophobia)\b", SAFETY_ROUTINE, ["Dim screen", "Quiet tips", "Done"]),
    ("sound_sensitivity", r"\b(noise|noises|sound|loud)\b.*\b(hurts|too much|unbearable|too loud)\b", SAFETY_ROUTINE, ["Reduce sounds", "Log", "Done"]),
    ("rest_guidance", r"\b(help me rest|need to (?:lie down|rest)|find a calm place|quiet place|rest)\b", SAFETY_ROUTINE, ["Quiet room", "Calming pause", "Stop chatting"]),
    ("hydration", r"\b(should i drink|drink water|hydrated|dehydrated)\b", SAFETY_ROUTINE, ["Small sips", "Nauseated", "Done"]),
    ("nausea", r"\b(nausea|nauseated|feel sick|throwing up|vomit)\b", SAFETY_ROUTINE, ["Small sips", "Quiet room", "Get help"]),
    ("cold_compress", r"\b(cold (?:pack|compress|cloth)|ice pack|anything besides lying down)\b", SAFETY_ROUTINE, ["Try it", "Other tip", "Done"]),
    ("breathing", r"\b(help me relax|calm me|breathing|relax)\b", SAFETY_ROUTINE, ["Start", "Stop", "Other tip"]),
    ("stress_support", r"\b(stressed|stressing|overwhelmed|anxious|too much going on)\b", SAFETY_ROUTINE, ["Pause 2 min", "Quiet tips", "Done"]),
    ("sleep_habits", r"\b(slept badly|slept little|no sleep|bad sleep|didn'?t sleep|can'?t sleep)\b", SAFETY_ROUTINE, ["Plan tonight", "Log sleep", "Done"]),
    ("meal_regular", r"\b(skipped (?:lunch|breakfast|dinner|meal)|haven'?t eaten|no food)\b", SAFETY_ROUTINE, ["Eat a snack", "Log", "Later"]),
    ("trigger_reflection", r"\b(why (?:migraine|headache|attack)|what caused|caused this|my trigger)\b", SAFETY_ROUTINE, ["Sleep", "Stress", "Diary"]),
    ("post_attack", r"\b(feeling better|pain (?:is )?going away|attack (?:is )?over|feeling better now)\b", SAFETY_ROUTINE, ["Save episode", "Rest", "Done"]),
    ("appointment_prep", r"\b(see(?:ing)? a doctor|doctor appointment|appointment|tell my doctor|gp visit)\b", SAFETY_ROUTINE, ["Create summary", "Not now"]),

    # --- app data ----------------------------------------------------------
    ("wearable_status", r"\b(is my watch|watch connected|heart rate not updating|is it connected|device status)\b", SAFETY_ROUTINE, ["Reconnect", "Last synced", "Help"]),
    ("vitals_explain", r"\b(what is hrv|what'?s hrv|what is hr|what is heart rate|what does hrv mean|explain (?:hrv|spo2|blood pressure|sleep))\b", SAFETY_ROUTINE, ["Heart rate", "Sleep", "Done"]),
    ("prediction_explain", r"\b(why (?:does it say|did it say|is (?:the )?risk|high risk|elevated)|what does the risk score|risk score explain|explain (?:the )?risk)\b", SAFETY_DATA_REQUIRED, ["See factors", "Rest tips", "History"]),
    ("no_data", r"\b(where is my|where'?s my|no sleep data|missing (?:data|readings)|not (?:syncing|updating))\b", SAFETY_DATA_REQUIRED, ["Reconnect", "Log manually", "Later"]),
    ("capability_limits", r"\b(can you detect|can you predict|are you (?:a doctor|medical)|do you diagnose|how accurate)\b", SAFETY_ROUTINE, ["What you track", "Log symptoms"]),
    ("reminder_control", r"\b(remind me|set a reminder|stop messaging|stop texting|stop chatting|leave me alone)\b", SAFETY_ROUTINE, ["Set reminder", "Not now"]),
    ("appointment_summary", r"\b(summary|summarise|summarize)\b.*\b(doctor|appointment|history)\b", SAFETY_ROUTINE, ["Create summary", "Not now"]),

    # --- greeting ----------------------------------------------------------
    ("greeting", r"^(hi|hello|hey|good morning|good afternoon|good evening|yo)\b", SAFETY_ROUTINE, ["Headache help", "Rest tips", "My data"]),
]

_COMPILED = [(name, re.compile(pat, re.IGNORECASE), level, qrs) for name, pat, level, qrs in _INTENTS]

# Precedence: earlier entries win. Safety tiers are already handled by
# scan_safety before this table is consulted, but the ordering below keeps
# the remaining clinical intents above the conversational ones.
PRECEDENCE = [
    "severe_headache",
    "urgent_clinical",
    "privacy_delete",
    "medication_question",
    "log_episode",
    "view_history",
    "headache_now",
    "symptom_checkin",
    "light_sensitivity",
    "sound_sensitivity",
    "rest_guidance",
    "hydration",
    "nausea",
    "cold_compress",
    "breathing",
    "stress_support",
    "sleep_habits",
    "meal_regular",
    "trigger_reflection",
    "post_attack",
    "appointment_prep",
    "wearable_status",
    "vitals_explain",
    "prediction_explain",
    "no_data",
    "capability_limits",
    "reminder_control",
    "appointment_summary",
    "greeting",
]

_ORDER = {name: i for i, name in enumerate(PRECEDENCE)}


def classify_intent(message: str) -> dict[str, Any]:
    """Pick the intent for a message, honouring the fixed precedence."""
    text = str(message or "")
    matches: list[tuple[str, str, list[str]]] = []
    for name, pattern, level, quick_replies in _COMPILED:
        if pattern.search(text):
            matches.append((name, level, quick_replies))
    if not matches:
        return {"intent": "unknown", "safety_level": SAFETY_ROUTINE, "quick_replies": []}
    matches.sort(key=lambda m: _ORDER.get(m[0], 999))
    name, level, quick_replies = matches[0]
    return {"intent": name, "safety_level": level, "quick_replies": quick_replies}


def intent_quick_replies(intent: str) -> list[str]:
    for name, _pattern, _level, quick_replies in _COMPILED:
        if name == intent:
            return list(quick_replies)
    return []


def known_intents() -> list[str]:
    return list(PRECEDENCE)
