import asyncio
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.api.developer import ManualAlertIn, manual_alert, require_developer
from app.api.chat import chat
from app.core.config import settings
from app.db.session import Base
from app.models import Alert, NotificationLog, Prediction, User
from app.schemas import ChatRequest
from app.services.chat_service import answer_with_context, offline_answer, safe_metrics


class MiraTests(unittest.TestCase):
    def test_educational_questions_do_not_open_unrelated_sections(self):
        for question in ["What does HRV mean?", "How does sleep affect migraines?", "What is SpO₂?"]:
            with self.subTest(question=question):
                result = offline_answer(question)
                self.assertEqual(result["mode"], "demo")
                self.assertIsNone(result["topic_id"])

    def test_navigation_and_typos(self):
        for question, topic in [("How do I connect my watch?", "watch"), ("Where can I log migraine episodes?", "history"), ("Explain sleep stages", "sleep"), ("How reliable is the risk score?", "limitations")]:
            with self.subTest(question=question):
                self.assertEqual(offline_answer(question)["topic_id"], topic)

    def test_safety_overrides_explicit_topic(self):
        self.assertEqual(offline_answer("sudden severe headache and slurred speech", "watch")["mode"], "safety")

    def test_followup_uses_prior_question_but_new_question_does_not(self):
        history = [{"role": "user", "content": "How do I connect my watch?"}]
        self.assertEqual(answer_with_context(history + [{"role": "user", "content": "Tell me more"}])["topic_id"], "watch")
        self.assertIsNone(answer_with_context(history + [{"role": "user", "content": "What does HRV mean?"}])["topic_id"])

    def test_metrics_reject_nonfinite_and_private_values(self):
        self.assertEqual(safe_metrics({"hrvMs": 48, "spo2": float("nan"), "name": "private", "systolic": True}), {"hrvMs": 48.0})

    def test_personal_numbers_are_not_invented(self):
        answer = offline_answer("What is my current risk?")
        self.assertIn("don't have access", answer["reply"])

    def test_wellness_variants_match_faq(self):
        for question, expected in [("Hydration tips?", "Drink water"), ("Help me with breathing", "breathing break"), ("Tips for prevention", "triggers vary")]:
            with self.subTest(question=question):
                self.assertIn(expected, offline_answer(question)["reply"])

    def test_ai_outage_falls_back_to_local_answer(self):
        body = ChatRequest(messages=[{"role": "user", "content": "What does HRV mean?"}])
        with patch("app.api.chat._ai_mode", return_value=True), patch("app.api.chat._call_model", side_effect=HTTPException(502, "Unavailable")):
            answer = chat(body)
        self.assertEqual(answer.mode, "demo")
        self.assertIn("HRV means", answer.reply)

    def test_app_help_never_calls_ai(self):
        body = ChatRequest(messages=[{"role": "user", "content": "How do I connect my watch?"}])
        with patch("app.api.chat._ai_mode", return_value=True), patch("app.api.chat._call_model") as model:
            answer = chat(body)
        model.assert_not_called()
        self.assertEqual(answer.topic_id, "watch")


class DeveloperTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.dev = User(name="Developer", email=next(iter(settings.developer_emails)), password_hash="test", consent_given=True)
        self.regular = User(name="Regular", email="regular@example.com", password_hash="test", consent_given=True)
        self.db.add_all([self.dev, self.regular])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_regular_user_cannot_use_console(self):
        with self.assertRaises(HTTPException) as error:
            require_developer(self.regular)
        self.assertEqual(error.exception.status_code, 403)

    def test_test_alert_is_scoped_and_does_not_send_sms_or_change_predictions(self):
        with patch("app.api.developer.manager.broadcast_to_user", new_callable=AsyncMock) as broadcast:
            result = asyncio.run(manual_alert(ManualAlertIn(level="high", message="Smoke test"), self.dev, self.db))
            self.assertTrue(result.message.startswith("[DEVELOPER TEST]"))
            broadcast.assert_awaited_once()
            self.assertEqual(broadcast.call_args.args[0], self.dev.id)
        self.assertEqual(len(self.db.scalars(select(Alert)).all()), 1)
        self.assertEqual(len(self.db.scalars(select(Prediction)).all()), 0)
        self.assertEqual(len(self.db.scalars(select(NotificationLog)).all()), 0)


if __name__ == "__main__":
    unittest.main()
