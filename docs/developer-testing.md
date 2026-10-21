# Developer alert testing

From `backend/`, run `python -m app.provision_developer` using the backend virtual environment. It creates `developer@migraine.example.com` with a generated password displayed once. Existing accounts and passwords are never overwritten. Override `DEVELOPER_EMAILS` on the backend for another reserved address; these addresses cannot use public registration.

Sign in using the normal login screen. Open **Profile → Developer testing**, enter a message, and send a low, moderate, or high test alert. The server verifies the authenticated account against `DEVELOPER_EMAILS` on every send. Other accounts receive HTTP 403 even if they call the endpoint directly.

Alerts are labelled `[DEVELOPER TEST]`, scoped to the developer's own account, saved in the existing alert table, and broadcast through the existing `alert_update` websocket channel. The regular Alerts screen can acknowledge them. They do not replace real predictions, modify wearable readings, or send SMS. Android system notifications depend on app permissions and the installed runtime; the in-app list is the reliable test surface in Expo Go.

Mira app-navigation replies are deterministic. General wellness answers use the local FAQ unless `OPENAI_API_KEY` is configured on the backend. The key is never included in the mobile build. If the provider is unavailable, the backend returns the local answer.

Checks: `python -m unittest discover -s tests -p test_mira_and_developer.py` from `backend/`; `node node_modules/typescript/lib/tsc.js --noEmit` from `mobile/`.
