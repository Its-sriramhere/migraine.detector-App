import type {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentStatus,
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

/**
 * The user's standing from their assessment answers.
 *
 * 404 means the assessment has not been completed yet, so the caller can
 * fall back to the "not set up yet" state rather than showing an error.
 */
export async function getStatus(): Promise<AssessmentStatus | null> {
  try {
    return await api.get<AssessmentStatus>("/assessment/status");
  } catch {
    return null;
  }
}
