"""Smoke-test a running Migraine Detector API instance.

Usage: python backend/scripts/smoke_test_api.py [base_url]
"""
import sys

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://192.168.1.84:8000"

failures = []


def check(label, condition, detail=""):
    status = "OK  " if condition else "FAIL"
    print(f"  [{status}] {label}{(' -> ' + detail) if detail else ''}")
    if not condition:
        failures.append(label)


print(f"=== smoke test {BASE} ===")

# 1. Mira status
r = requests.get(f"{BASE}/api/chat/status", timeout=20)
body = r.json() if r.ok else {}
check("GET /api/chat/status", r.status_code == 200, str(body))
check("Mira is in offline guide mode", body.get("mode") == "demo", f"mode={body.get('mode')}")

# 2. Mira guide
r = requests.get(f"{BASE}/api/chat/guide", timeout=20)
guide = r.json() if r.ok else {}
check("GET /api/chat/guide", r.status_code == 200, f"{len(guide.get('features', []))} features")

# 3. Mira chat
r = requests.post(f"{BASE}/api/chat", json={"messages": [{"role": "user", "content": "hello"}]}, timeout=20)
chat = r.json() if r.ok else {}
check("POST /api/chat", r.status_code == 200 and bool(chat.get("reply")), str(chat.get("mode")))

# 4. Login
r = requests.post(
    f"{BASE}/api/auth/login",
    json={"email": "developer@migraine.example.com", "password": "testtest"},
    timeout=30,
)
login = r.json() if r.ok else {}
token = login.get("access_token")
check("POST /api/auth/login", r.status_code == 200 and bool(token), f"status={r.status_code}")
if not token:
    print("\nCannot continue without a token.")
    raise SystemExit(1)

H = {"Authorization": f"Bearer {token}"}

# 5. Identity
r = requests.get(f"{BASE}/api/auth/me", headers=H, timeout=20)
me = r.json() if r.ok else {}
check("GET /api/auth/me", r.status_code == 200, me.get("email", ""))

# 6. Assessment bank
r = requests.get(f"{BASE}/api/assessment/questions", headers=H, timeout=20)
questions = r.json() if r.ok else []
check("GET /api/assessment/questions", r.status_code == 200 and len(questions) > 0, f"{len(questions)} questions")

# 7. Predictions / readings / alerts
for path, label in [
    ("/api/predictions/history", "GET /api/predictions/history"),
    ("/api/sensor/history", "GET /api/sensor/history"),
    ("/api/alerts", "GET /api/alerts"),
    ("/api/reports/overview", "GET /api/reports/overview"),
    ("/api/datasets/thresholds", "GET /api/datasets/thresholds"),
    ("/api/chat/status", "GET /api/chat/status (auth)"),
]:
    r = requests.get(f"{BASE}{path}", headers=H, timeout=30)
    check(label, r.status_code == 200, f"status={r.status_code}")

# 8. Unauthenticated access must be rejected
r = requests.get(f"{BASE}/api/auth/me", timeout=20)
check("GET /api/auth/me without token is 401", r.status_code == 401, f"status={r.status_code}")

print(f"\n=== {len(failures)} failure(s) ===")
for f in failures:
    print("  -", f)
raise SystemExit(1 if failures else 0)
