export interface EligibilityRuleItem {
  field_name: string;
  display_name: string;
  type: string;
  description: string;
  benchmark_or_range: string;
}

export interface EligibilityRulesResponse {
  currency: string;
  currency_symbol: string;
  model_version: string;
  algorithm: string;
  features: EligibilityRuleItem[];
  cibil_score_guide: Record<string, string>;
  disclaimer: string;
}

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  application_count: number;
}

export interface AdminUsersResponse {
  total: number;
  users: AdminUserSummary[];
}

export interface AdminDashboardResponse {
  total_applications: number;
  approved_applications: number;
  rejected_applications: number;
  under_review_applications: number;
  approval_rate: number;
  total_requested_loan_amount: number;
  average_loan_amount: number;
  average_cibil_score: number;
  risk_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  recent_applications: LoanApplication[];
}

export interface AdminAnalyticsResponse {
  total_applications: number;
  approved_count: number;
  rejected_count: number;
  under_review_count: number;
  approval_rate: number;
  rejection_rate: number;
  cibil_bands: Record<string, number>;
  loan_amount_bands: Record<string, number>;
  risk_distribution: Record<string, number>;
  education_distribution: Record<string, number>;
  employment_distribution: Record<string, number>;
  total_loan_volume: number;
  total_asset_volume: number;
}

export interface CandidateModelTestMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  brier_score_loss: number;
  confusion_matrix?: number[][];
  classification_report?: Record<string, any>;
  fit_time_seconds?: number;
}

export interface CandidateModelCvMetrics {
  accuracy_mean: number;
  accuracy_std: number;
  precision_mean: number;
  precision_std: number;
  recall_mean: number;
  recall_std: number;
  f1_mean: number;
  f1_std: number;
  roc_auc_mean: number;
  roc_auc_std: number;
}

export interface AdminMonitoringResponse {
  model_version: string;
  algorithm: string;
  status: string;
  total_predictions: number;
  average_latency_ms: number;
  risk_distribution: Record<string, number>;
  recommendation_distribution: Record<string, number>;
  training_metrics: Record<string, any>;
  feature_importance: Record<string, number>;
  recent_predictions: Array<{
    id: number;
    application_id?: number;
    recommendation: string;
    approval_probability: number;
    risk_level: string;
    inference_latency_ms: number;
    created_at: string;
  }>;
  all_models_test_metrics?: Record<string, CandidateModelTestMetrics>;
  all_models_cv_metrics?: Record<string, CandidateModelCvMetrics>;
  candidate_models?: string[];
  champion_model?: string;
  champion_version?: string;
}

export interface HealthCheckResponse {
  status: string;
  project: string;
  model_version: string;
  model_loaded: boolean;
  database: string;
  currency: string;
  timestamp: string;
}

export interface FactorExplanation {
  feature_name: string;
  display_name: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  direction: string;
  rank: number;
  explanation_text: string;
}

export interface DerivedIndicators {
  monthly_income: number;
  loan_to_annual_income_ratio: number;
  loan_to_monthly_income_ratio: number;
  total_asset_value: number;
  asset_to_loan_ratio: number;
  bank_asset_to_annual_income_ratio: number;
  loan_term_months: number;
  estimated_principal_monthly_payment: number;
  estimated_payment_to_income_ratio: number;
}

export interface RiskAssessment {
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  credit_strength: string;
  repayment_capacity: string;
  asset_coverage: string;
  financial_health_score: number;
  summary: string;
  positive_factors: string[];
  risk_factors: string[];
  estimated_eligible_loan_amount?: number;
}

export interface PredictionResult {
  id?: number;
  application_id?: number;
  model_version: string;
  recommendation: "APPROVED" | "REJECTED";
  advisory_recommendation?: string;
  approval_probability: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  inference_latency_ms: number;
  derived_indicators: DerivedIndicators;
  risk_assessment: RiskAssessment;
  explanations: FactorExplanation[];
  created_at?: string;
}

export interface LoanApplication {
  id: number;
  application_number: string;
  user_id: number;
  applicant_name: string;
  no_of_dependents: number;
  education: "Graduate" | "Not Graduate";
  self_employed: "Yes" | "No";
  income_annum: number;
  loan_amount: number;
  loan_term: number;
  cibil_score: number;
  residential_assets_value: number;
  commercial_assets_value: number;
  luxury_assets_value: number;
  bank_asset_value: number;
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "INFO_REQUESTED";
  created_at: string;
  updated_at: string;
  latest_prediction?: PredictionResult;
}

export interface LoanApplicationListResponse {
  total: number;
  applications: LoanApplication[];
}

export interface ApiErrorResponse {
  detail: string | { msg: string; loc: string[] }[];
}
