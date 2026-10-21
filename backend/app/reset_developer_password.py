"""Reset the reserved developer account password to a known value.

Usage (from backend/):  python -m app.reset_developer_password <new-password>
"""
import sys

from sqlalchemy import select

from .core.config import settings
from .core.security import hash_password
from .db.session import SessionLocal
from .models import User


def main() -> None:
    password = sys.argv[1] if len(sys.argv) > 1 else "testtest"
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    emails = sorted(settings.developer_emails)
    if not emails:
        raise SystemExit("Set DEVELOPER_EMAILS before resetting.")

    with SessionLocal() as db:
        for email in emails:
            user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if user is None:
                db.add(User(
                    name="Developer",
                    email=email,
                    password_hash=hash_password(password),
                    consent_given=True,
                ))
                print(f"Created developer account: {email}")
                continue
            user.password_hash = hash_password(password)
            user.consent_given = True
            print(f"Reset password for: {email}")
        db.commit()


if __name__ == "__main__":
    main()
