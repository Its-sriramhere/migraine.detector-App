"""Authenticated test alerts, isolated from prediction and SMS delivery."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .deps import get_current_user
from ..core.config import settings
from ..db.session import get_db
from ..models import Alert, User
from ..schemas import AlertOut
from ..websocket.manager import manager

router = APIRouter(prefix="/api/developer", tags=["developer"])


def require_developer(current: User = Depends(get_current_user)) -> User:
    if current.email.lower() not in settings.developer_emails:
        raise HTTPException(403, "Developer account required")
    return current


class ManualAlertIn(BaseModel):
    level: Literal["low", "moderate", "high"] = "moderate"
    message: str = Field(default="Manual wearable alert test", min_length=1, max_length=400)


@router.get("/status")
def status(current: User = Depends(get_current_user)):
    return {"enabled": current.email.lower() in settings.developer_emails}


@router.post("/alerts", response_model=AlertOut, status_code=201)
async def manual_alert(body: ManualAlertIn, current: User = Depends(require_developer), db: Session = Depends(get_db)):
    text = body.message.strip()
    if not text:
        raise HTTPException(422, "Enter a test message")
    alert = Alert(
        user_id=current.id,
        risk_level=body.level,
        risk_score={"low": 15, "moderate": 55, "high": 85}[body.level],
        message=f"[DEVELOPER TEST] {text}",
        acknowledged=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    payload = AlertOut.model_validate(alert)
    # Test alerts go through the existing in-app websocket path. No live
    # sensor data is changed and no SMS/paid provider is invoked.
    await manager.broadcast_to_user(current.id, {"type": "alert_update", **payload.model_dump(mode="json")})
    return payload
