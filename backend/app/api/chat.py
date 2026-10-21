"""Mira — the in-app guide and wellness assistant.

The assistant answers two kinds of question:

* app questions, always answered from the deterministic guide in
  :mod:`app.services.chat_service`, so it can never invent a feature
* open-ended wellness questions, answered from the built-in FAQ, or by the
  language model when ``OPENAI_API_KEY`` is configured

The API key never leaves the backend.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status

from ..core.config import settings
from ..schemas import (
    ChatGuideOut,
    ChatRequest,
    ChatResponse,
    ChatStatusOut,
)
from ..services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])

INSTRUCTIONS = """You are Mira, a calm, concise assistant inside Migraine Detector, a prototype wearable migraine wellness app.
Answer general migraine and health education questions in accessible language, generally 2-5 short sentences, and respond in the user's language when possible.
Migraine Detector is a research prototype. Its risk scores, alert cards and trend lines are illustrative rather than the output of a clinically validated predictive model. Do not claim the system can detect or forecast attacks.
App feature questions are handled separately by the deterministic guide; if such a question reaches you, do not invent features or actual integration.
Wearable measurements can be inaccurate, especially estimated sleep stages and wrist blood pressure. Interpret trends cautiously, not as diagnoses.
Never diagnose conditions, provide prescription choices or dosing, suggest changing existing medicines, or promise a migraine will or will not happen. Never make up personal health data or claim access to the current user's records or live device.
For sudden very severe headache, new neurological deficits, loss of consciousness, seizures, breathing difficulty, or fever with a stiff neck, immediately urge emergency medical help.
For chronic illness, pregnancy, children, or concerning readings, encourage evaluation by a qualified clinician.
Wearable values are shared only with the user's opt-in; do not ask for identifying information. No provider-validated medical device claims."""


def _ai_mode() -> bool:
    return bool(getattr(settings, "OPENAI_API_KEY", ""))


@router.get("/status", response_model=ChatStatusOut)
def chat_status() -> ChatStatusOut:
    return ChatStatusOut(mode="ai" if _ai_mode() else "demo", guide=True)


@router.get("/guide", response_model=ChatGuideOut)
def chat_guide() -> ChatGuideOut:
    return ChatGuideOut(
        features=chat_service.feature_payload(),
        tour_ids=chat_service.TOUR_IDS,
        questions=chat_service.APP_QUESTIONS,
        health_prompts=chat_service.HEALTH_PROMPTS,
    )


def _call_model(messages: list[dict[str, str]], readings: Optional[dict[str, float]]) -> str:
    """Ask the model for an answer. The key stays on the server."""
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    model = getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini")
    instructions = INSTRUCTIONS
    if readings:
        instructions += (
            "\n\nExplicitly user-consented, approximate wearable data: "
            f"{json.dumps(readings)}."
        )

    body = {
        "model": model,
        "instructions": instructions,
        "input": messages,
        "max_output_tokens": 340,
        "store": False,
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "AI answers are temporarily unavailable. You can still use the built-in app guide.",
        ) from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "AI answers are temporarily unavailable. You can still use the built-in app guide.",
        ) from exc

    text = (payload.get("output_text") or "").strip()
    if not text:
        for item in payload.get("output") or []:
            for part in item.get("content") or []:
                if part.get("type") == "output_text" and part.get("text"):
                    text = part["text"].strip()
                    break
    return text or "I could not generate an answer. Please try again."


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest) -> ChatResponse:
    messages = [
        {"role": m.role, "content": m.content.strip()}
        for m in body.messages[-10:]
    ]
    if not messages or messages[-1]["role"] != "user" or not messages[-1]["content"]:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "The latest message must be a question."
        )

    question = messages[-1]["content"]

    # Safety first, before anything else touches the question.
    if chat_service.has_urgent_symptoms(question):
        return ChatResponse(
            reply=chat_service.EMERGENCY_TEXT, mode="safety", topic_id=None
        )

    canned = chat_service.answer_with_context(messages, body.topic_id)

    # App help stays deterministic even when an AI key is configured.
    if canned["mode"] == "guide" or not _ai_mode():
        return ChatResponse(
            reply=canned["reply"], mode=canned["mode"], topic_id=canned.get("topic_id")
        )

    readings = (
        chat_service.safe_metrics(body.wearable_data)
        if body.share_metrics and body.wearable_data
        else None
    )
    try:
        reply = _call_model(messages, readings)
    except HTTPException:
        # Keep the local guide usable when the optional provider is down.
        return ChatResponse(reply=canned["reply"] + "\n\nAI is unavailable; this answer comes from the built-in guide.", mode=canned["mode"], topic_id=canned.get("topic_id"))
    return ChatResponse(reply=reply, mode="ai", topic_id=None)
