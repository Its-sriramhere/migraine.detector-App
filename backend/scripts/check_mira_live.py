"""Live check of the Mira envelope and the assessment status endpoint."""
import json
import sys

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://migraine-detector-api.onrender.com"

print(f"=== {BASE} ===")

# 1. chat status
r = requests.get(f"{BASE}/api/chat/status", timeout=30)
print("chat/status:", r.status_code, r.json())

# 2. login
r = requests.post(
    f"{BASE}/api/auth/login",
    json={"email": "developer@migraine.example.com", "password": "testtest"},
    timeout=30,
)
print("login:", r.status_code)
if r.status_code != 200:
    print(r.text[:300])
    raise SystemExit(1)
token = r.json()["access_token"]
H = {"Authorization": f"Bearer {token}"}

# 3. assessment status
r = requests.get(f"{BASE}/api/assessment/status", headers=H, timeout=30)
print("\nassessment/status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    print(json.dumps(data, indent=2)[:1400])
else:
    print(r.text[:300])

# 4. chat envelope
print("\n=== chat envelope ===")
for question in [
    "Hi Mira",
    "What is my current status?",
    "What is HRV?",
    "Worst headache ever, sudden worst ever",
    "Can I take another tablet?",
]:
    r = requests.post(
        f"{BASE}/api/chat",
        json={"messages": [{"role": "user", "content": question}]},
        headers=H,
        timeout=30,
    )
    body = r.json()
    print(f"\nQ: {question}")
    print(f"  status={r.status_code} intent={body.get('intent')} safety={body.get('safety_level')}")
    print(f"  quick_replies={[q['label'] for q in body.get('quick_replies', [])]}")
    print(f"  cards={len(body.get('cards', []))} content_version={body.get('content_version')}")
    print(f"  reply: {body.get('reply', '')[:200]}")

# 5. guide carries the cards
r = requests.get(f"{BASE}/api/chat/guide", timeout=30)
guide = r.json()
print(f"\n=== guide ===\nstatus={r.status_code} features={len(guide.get('features', []))} cards={len(guide.get('cards', []))} version={guide.get('content_version')}")
