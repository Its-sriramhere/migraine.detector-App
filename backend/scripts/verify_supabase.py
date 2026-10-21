import os
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\LOQ\Desktop\Migrainedetector-App")
sys.path.insert(0, str(ROOT))
os.chdir(ROOT / "backend")

# The target connection comes from the environment or backend/.env.
if not os.environ.get("DATABASE_URL"):
    env_file = ROOT / "backend" / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip()
                break

from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.db.session import SessionLocal, engine

print("DATABASE_URL ->", settings.DATABASE_URL)
print("SMS_ENABLED  ->", settings.SMS_ENABLED)
print("SMS_PROVIDER ->", settings.SMS_PROVIDER)

with engine.connect() as conn:
    print("\n-- live checks against Supabase --")
    for label, sql in [
        ("users", "SELECT COUNT(*) FROM users"),
        ("assessment_questions", "SELECT COUNT(*) FROM assessment_questions"),
        ("predictions", "SELECT COUNT(*) FROM predictions"),
        ("sensor_readings", "SELECT COUNT(*) FROM sensor_readings"),
        ("alerts", "SELECT COUNT(*) FROM alerts"),
        ("user_risk_profiles", "SELECT COUNT(*) FROM user_risk_profiles"),
    ]:
        n = conn.execute(text(sql)).scalar()
        print(f"  {label}: {n}")

    rows = conn.execute(text(
        "SELECT email, name FROM users ORDER BY id"
    )).fetchall()
    print("\n  users:")
    for r in rows:
        print(f"    - {r[0]} ({r[1]})")

db = SessionLocal()
try:
    from backend.app.models import User
    dev = db.query(User).filter(User.email == "developer@migraine.example.com").first()
    print(f"\n  developer account present: {dev is not None}")
finally:
    db.close()
engine.dispose()
