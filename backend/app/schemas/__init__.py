from datetime import datetime
from typing import Any, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Auth ---

class RegisterRequest(BaseModel):
    name: str = Field(default="", max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    consent_given: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORMBase):
    id: int
    name: str
    email: str
    consent_given: bool
    created_at: Optional[datetime] = None


# --- Assessment ---

class AssessmentQuestionOut(ORMBase):
    id: int
    question_text: str
    question_type: str
    options: list[Any] = []


class AssessmentAnswerIn(BaseModel):
    question_id: int
    answer: str


class AssessmentSubmitRequest(BaseModel):
    answers: list[AssessmentAnswerIn]


class RiskProfileOut(ORMBase):
    user_id: int
    migraine_history_score: float = 0.0
    sleep_profile: Optional[str] = None
    stress_profile: Optional[str] = None
    activity_profile: Optional[str] = None
    hydration_profile: Optional[str] = None
    caffeine_profile: Optional[str] = None
    trigger_profile: list[Any] = []
    profile_version: str = "v1"
    # Both are stored by build_risk_profile and read by the risk engine, so
    # the app needs them to show the same baseline the model uses.
    sleep_hours: Optional[float] = None
    resting_hr: Optional[float] = None


class StatusFocusArea(BaseModel):
    area: str
    detail: str
    card_id: Optional[str] = None


class StatusTip(BaseModel):
    card_id: str
    title: str
    body: str


class AssessmentStatusOut(BaseModel):
    """Descriptive standing derived from the assessment answers.

    Deliberately carries no risk level or score: the band edges are
    calibrated against sensor readings, not questionnaire answers.
    """
    headline: str
    summary: str
    focus_areas: list[StatusFocusArea] = []
    strengths: list[StatusFocusArea] = []
    tips: list[StatusTip] = []
    baseline_note: str = ""
    source_note: str = ""
    content_version: str = "mira-content-1.0"


class BaselineEstimates(BaseModel):
    heart_rate_low: float
    heart_rate_high: float
    sleep_hours: Optional[float] = None
    resting_note: str = ""


# --- Devices ---

class DeviceRegisterRequest(BaseModel):
    device_identifier: str = Field(min_length=1, max_length=120)
    device_name: str = "Raspberry Pi"


class DeviceOut(ORMBase):
    id: int
    device_identifier: str
    device_name: str
    status: str
    last_seen: Optional[datetime] = None


# --- Sensor ---

class SensorReadingIn(BaseModel):
    device_id: Optional[int] = None
    source: str = "pi"
    timestamp: Optional[datetime] = None
    heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    activity: Optional[float] = None
    signal_quality: Optional[float] = 1.0


class SensorReadingOut(ORMBase):
    id: int
    source: str
    timestamp: Optional[datetime] = None
    heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    activity: Optional[float] = None
    signal_quality: Optional[float] = None


class SensorReadingResponse(BaseModel):
    reading: SensorReadingOut
    prediction: "PredictionOut"


# --- Predictions ---

class PredictionFeatureOut(ORMBase):
    id: int
    feature_name: str
    feature_value: Optional[float] = None
    contribution: float


class PredictionFeatureLight(BaseModel):
    feature_name: str
    feature_value: Optional[float] = None
    contribution: float


class PredictionOut(ORMBase):
    id: int
    timestamp: Optional[datetime] = None
    risk_score: float
    risk_level: str
    prediction_window: int
    model_version: str
    outcome: str = "pending"
    source: str = "pi"
    features: list[PredictionFeatureOut] = []
    advice: list[str] = Field(default_factory=list, validation_alias="advice_texts")


class PredictRequest(BaseModel):
    heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    activity: Optional[float] = None


class PredictResponse(BaseModel):
    risk_score: float
    risk_level: str
    prediction_window_minutes: int
    model_version: str
    explanation: list[PredictionFeatureLight] = []
    advice: list[str] = []


# --- Migraine ---

class MigraineIn(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    severity: Optional[str] = None
    symptoms: list[str] = []
    trigger: Optional[str] = None
    notes: Optional[str] = None


class MigraineOut(ORMBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    severity: Optional[str] = None
    symptoms: list[Any] = []
    trigger: Optional[str] = None
    notes: Optional[str] = None


# --- Alerts ---

class AlertOut(ORMBase):
    id: int
    timestamp: Optional[datetime] = None
    risk_score: float
    risk_level: str
    message: str
    acknowledged: bool
    feedback: Optional[str] = None
    prediction_id: Optional[int] = None
    advice: list[str] = Field(default_factory=list, validation_alias="advice_texts")


class AlertFeedbackIn(BaseModel):
    feedback: str = Field(pattern="^(yes|no|not_sure)$")


# --- Demo ---

class DemoSensorData(SensorReadingIn):
    source: str = "demo"


class DemoScenarioRequest(BaseModel):
    scenario: str = Field(pattern="^(normal|moderate|high)$")
    signal: Optional[dict[str, Any]] = None


class DemoSessionStatus(BaseModel):
    running: bool
    scenario: Optional[str] = None


class DemoStartResponse(DemoSessionStatus):
    reading: Optional[SensorReadingOut] = None
    prediction: Optional["PredictionOut"] = None


# --- Reports ---

class ReportOverview(BaseModel):
    total_readings: int
    total_predictions: int
    total_alerts: int
    total_episodes: int
    latest_risk_score: Optional[float] = None
    latest_risk_level: Optional[str] = None
    average_risk: Optional[float] = None
    risk_band_counts: dict[str, int] = {}
    days_monitored: int = 0


# --- Chat (Mira) ---

class ChatMessageIn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=1000)


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(min_length=1, max_length=16)
    topic_id: Optional[str] = Field(
        default=None,
        max_length=40,
        validation_alias=AliasChoices("topic_id", "topicId"),
    )
    share_metrics: bool = Field(
        default=False,
        validation_alias=AliasChoices("share_metrics", "shareMetrics"),
    )
    wearable_data: Optional[dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("wearable_data", "wearableData"),
    )


class QuickReply(BaseModel):
    id: str
    label: str


class UiAction(BaseModel):
    """Something the client can offer, e.g. saving an episode."""

    type: str
    label: str
    payload: dict[str, Any] = {}


class ChatResponse(BaseModel):
    # Legacy fields kept so older clients keep working.
    reply: str
    mode: str = "demo"
    topic_id: Optional[str] = None

    # Structured envelope.
    conversation_id: str = ""
    intent: str = "unknown"
    safety_level: str = "routine"
    content_version: str = "mira-content-1.0"
    quick_replies: list[QuickReply] = []
    ui_actions: list[UiAction] = []
    requires_confirmation: bool = False
    medical_data_used: bool = False
    cards: list[dict[str, Any]] = []


class ChatFeatureOut(BaseModel):
    id: str
    icon: str
    title: str
    short_title: str
    route: str
    summary: str
    see: str
    steps: list[str]
    note: str


class ChatGuideOut(BaseModel):
    features: list[ChatFeatureOut]
    tour_ids: list[str]
    questions: list[dict[str, str]]
    health_prompts: list[str]
    cards: list[dict[str, Any]] = []
    content_version: str = "mira-content-1.0"


class ChatStatusOut(BaseModel):
    mode: str
    guide: bool = True
    content_version: str = "mira-content-1.0"
    review_status: str = "draft"


PredictionOut.model_rebuild()
SensorReadingResponse.model_rebuild()
DemoStartResponse.model_rebuild()