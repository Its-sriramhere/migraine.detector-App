"""Run from backend/: python -m app.provision_developer.

Creates the reserved testing account without changing existing passwords.
"""
import secrets

from sqlalchemy import select

from .core.config import settings
from .core.security import hash_password
from .db.seed import init_db
from .db.session import SessionLocal
from .models import User


def main():
    init_db()
    email = sorted(settings.developer_emails)[0] if settings.developer_emails else None
    if not email:
        raise SystemExit("Set DEVELOPER_EMAILS before provisioning")
    with SessionLocal() as db:
        if db.execute(select(User).where(User.email == email)).scalar_one_or_none():
            raise SystemExit("Developer account already exists; its password was not changed.")
        password = secrets.token_urlsafe(18)
        db.add(User(name="Developer", email=email, password_hash=hash_password(password), consent_given=True))
        db.commit()
    print(f"Developer email: {email}\nOne-time displayed password: {password}")


if __name__ == "__main__":
    main()
