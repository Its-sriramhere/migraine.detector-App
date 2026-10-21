"""Migrate the Migraine Detector backend from local SQLite to Supabase Postgres.

- Creates the schema from the backend's own SQLAlchemy models (exact match).
- Seeds the assessment question bank.
- Copies every row from backend/migraine.db, preserving primary keys so all
  foreign keys stay valid.
- Re-syncs Postgres sequences so new inserts do not collide.

The target connection comes from the DATABASE_URL environment variable, or
from backend/.env when it is already configured. Credentials are never
hardcoded here.
"""
import os
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\LOQ\Desktop\Migrainedetector-App")
sys.path.insert(0, str(ROOT))

# Force the target connection before any settings import. Environment
# variables take priority over the .env file in pydantic-settings.
if not os.environ.get("DATABASE_URL"):
    env_file = ROOT / "backend" / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.startswith("DATABASE_URL="):
                os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip()
                break

import sqlite3

from sqlalchemy import create_engine, text

from backend.app.core.config import settings
from backend.app.db.session import Base
from backend.app.db.seed import seed_questions
from backend.app.db.session import SessionLocal
from backend.app import models  # noqa: F401  (registers all tables)

SQLITE_PATH = ROOT / "backend" / "migraine.db"

assert settings.DATABASE_URL.startswith("postgresql://"), settings.DATABASE_URL
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# ---------------------------------------------------------------- schema
print("== creating schema on Supabase ==")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    tables = [
        r[0] for r in conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema='public' ORDER BY table_name"
        ))
    ]
print(f"   tables: {tables}")

# ---------------------------------------------------------------- seed
print("\n== seeding assessment questions ==")
db = SessionLocal()
try:
    seed_questions(db)
    with engine.connect() as conn:
        n = conn.execute(text("SELECT COUNT(*) FROM assessment_questions")).scalar()
    print(f"   assessment_questions seeded: {n}")
finally:
    db.close()

# ---------------------------------------------------------------- copy
print("\n== copying rows from SQLite ==")
src = sqlite3.connect(SQLITE_PATH)
src.row_factory = sqlite3.Row
src_tables = [
    r[0] for r in src.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' "
        "AND name != 'test_batch' ORDER BY name"
    )
]

COPY_ORDER = [
    "users",
    "user_profiles",
    "assessment_questions",
    "assessment_responses",
    "user_risk_profiles",
    "devices",
    "sensor_readings",
    "migraine_episodes",
    "predictions",
    "prediction_features",
    "alerts",
    "alert_advice",
    "notification_logs",
    "datasets",
]

with engine.begin() as conn:
    # SQLite does not enforce VARCHAR lengths, but Postgres does. Widen any
    # character column whose real data is wider than the declared length so
    # the historical rows can be copied without truncation.
    for table in COPY_ORDER:
        if table not in src_tables:
            continue
        declared = {
            r[0]: r[1] for r in conn.execute(text(
                "SELECT column_name, character_maximum_length "
                "FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t "
                "AND data_type='character varying'"
            ), {"t": table})
        }
        if not declared:
            continue
        for column, max_len in declared.items():
            if not max_len:
                continue
            longest = src.execute(
                f'SELECT COALESCE(MAX(LENGTH("{column}")), 0) FROM "{table}"'
            ).fetchone()[0]
            if longest and longest > max_len:
                conn.execute(text(
                    f'ALTER TABLE "{table}" ALTER COLUMN "{column}" '
                    f'TYPE VARCHAR({longest})'
                ))
                print(f"   widened {table}.{column}: VARCHAR({max_len}) -> VARCHAR({longest})")

    for table in COPY_ORDER:
        if table not in src_tables:
            continue
        rows = src.execute(f'SELECT * FROM "{table}"').fetchall()
        if not rows:
            print(f"   {table}: 0 rows (skipped)")
            continue
        cols = list(rows[0].keys())

        # SQLite stores booleans as 0/1 integers; Postgres needs real booleans.
        bool_cols = {
            r[0] for r in conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t "
                "AND data_type='boolean'"
            ), {"t": table})
        }

        collist = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join(f":{c}" for c in cols)
        stmt = text(
            f'INSERT INTO "{table}" ({collist}) VALUES ({placeholders}) '
            f"ON CONFLICT DO NOTHING"
        )
        payload = []
        for row in rows:
            record = {c: row[c] for c in cols}
            for c in bool_cols:
                if record.get(c) is not None:
                    record[c] = bool(record[c])
            payload.append(record)
        conn.execute(stmt, payload)
        print(f"   {table}: {len(rows)} rows copied")

# ---------------------------------------------------------------- sequences
print("\n== resyncing sequences ==")
with engine.begin() as conn:
    for table in COPY_ORDER:
        if table not in src_tables:
            continue
        exists = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ), {"t": table}).scalar()
        if not exists:
            continue
        max_id = conn.execute(text(f'SELECT COALESCE(MAX(id), 0) FROM "{table}"')).scalar()
        if max_id:
            conn.execute(text(
                f"SELECT setval(pg_get_serial_sequence(:t, 'id'), :v, true)"
            ), {"t": table, "v": max_id})
print("   sequences synced")

# ---------------------------------------------------------------- verify
print("\n== verification ==")
with engine.connect() as conn:
    for table in COPY_ORDER:
        if table not in src_tables:
            continue
        src_n = src.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
        dst_n = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
        flag = "OK " if src_n == dst_n else "DIFF"
        print(f"   [{flag}] {table}: sqlite={src_n} supabase={dst_n}")

    q = conn.execute(text(
        "SELECT question_text FROM assessment_questions ORDER BY id"
    )).fetchall()
    print(f"\n   total assessment questions in Supabase: {len(q)}")

src.close()
engine.dispose()
print("\nMigration finished.")
