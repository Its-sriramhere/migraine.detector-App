import logging
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models import NotificationLog

logger = logging.getLogger("migraine.notifications")

LEVEL_SCORES = {"high": 3, "moderate": 2, "low": 1}


@dataclass
class NotificationReceipt:
    status: str
    provider: str
    detail: str = ""


class NotificationProvider:
    """Interface for any alert delivery channel (SMS, push, etc.)."""

    name = "base"

    def send(self, recipient: str, message: str, level: str) -> NotificationReceipt:
        raise NotImplementedError


class MockSmsProvider(NotificationProvider):
    """Default provider: records the message and simulates a successful send.

    Always succeeds in mock mode; no Twilio credentials needed.
    """

    name = "mock"

    def send(self, recipient: str, message: str, level: str) -> NotificationReceipt:
        logger.info("[SMS mock -> %s] %s", recipient, message)
        return NotificationReceipt(status="sent", provider=self.name,
                                   detail="logged locally (mock mode)")


def _provider() -> NotificationProvider:
    return MockSmsProvider()


def _should_notify(level: str) -> bool:
    if not settings.SMS_ENABLED:
        return False
    threshold = LEVEL_SCORES.get("high", 0)
    return LEVEL_SCORES.get(level, 0) >= threshold


def _real_sends_used(db: Session) -> int:
    """Count delivery attempts already made (sent or failed)."""
    return (
        db.execute(
            select(func.count())
            .select_from(NotificationLog)
            .where(NotificationLog.provider == "mock")
        )
        .scalar()
        or 0
    )


def _quota_exceeded(db: Session) -> bool:
    """Hard cap protecting the delivery budget (see SMS_MAX_SENDS)."""
    return settings.SMS_ENABLED and _real_sends_used(db) >= settings.SMS_MAX_SENDS


def send_alert_notification(
    db: Session,
    user_id: int,
    alert_id: int,
    risk_level: str,
    message: str,
) -> Optional[NotificationLog]:
    """Dispatch a notification when enabled; always records an audit entry.

    Existing rows are reconciled - it never blocks the prediction flow.
    """
    recipient = "app-notifications"
    provider = _provider()

    if not _should_notify(risk_level):
        receipt = NotificationReceipt(status="skipped", provider=provider.name,
                                      detail="SMS disabled or below alert level")
    elif _quota_exceeded(db):
        receipt = NotificationReceipt(status="quota_exceeded", provider=provider.name,
                                      detail=f"real sends capped at {settings.SMS_MAX_SENDS} (SMS_MAX_SENDS)")
    else:
        receipt = provider.send(recipient, message, risk_level)

    log = NotificationLog(
        user_id=user_id,
        alert_id=alert_id,
        kind="sms",
        provider=receipt.provider,
        recipient=recipient,
        risk_level=risk_level,
        status=receipt.status,
        detail=receipt.detail,
        message=message,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log