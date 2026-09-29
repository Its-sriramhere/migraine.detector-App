import type {
  AssessmentAnswer,
  AssessmentQuestion,
  BaselineEstimates,
  RiskProfile,
  User,
} from "../types";
import { api } from "./api";

export function getMe() {
  return api.get<User>("/users/me");
}

export function getQuestions() {
  return api.get<AssessmentQuestion[]>("/assessment/questions");
}

export function submitAssessment(answers: AssessmentAnswer[]) {
  return api.post<RiskProfile>("/assessment/responses", { answers });
}

export function getRiskProfile() {
  return api.get<RiskProfile>("/assessment/profile");
}

export function getBaseline() {
  return api.get<BaselineEstimates>("/assessment/baseline");
}
