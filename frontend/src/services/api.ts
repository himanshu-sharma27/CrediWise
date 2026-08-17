import { AuthResponse, LoginPayload, RegisterPayload, User } from "../types/auth";
import {
  AdminAnalyticsResponse,
  AdminDashboardResponse,
  AdminMonitoringResponse,
  AdminUsersResponse,
  EligibilityRulesResponse,
  HealthCheckResponse,
  LoanApplication,
  LoanApplicationListResponse,
  PredictionResult,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const BACKEND_UNAVAILABLE_MESSAGE =
  "Backend service unavailable. Please ensure the CrediWise API is running and try again.";

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("crediwise_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        // If expired or invalid token on a protected endpoint, notify app
        if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
          localStorage.removeItem("crediwise_token");
          localStorage.removeItem("crediwise_user");
          window.dispatchEvent(new Event("crediwise_unauthorized"));
        }
      }

      if (!response.ok) {
        // HTTP 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(BACKEND_UNAVAILABLE_MESSAGE);
        }

        let errorDetail: any = null;
        let rawBodyText = "";
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail;
          } catch {
            // non-json or malformed
          }
        } else {
          try {
            rawBodyText = await response.text();
          } catch {
            // ignore
          }
        }

        // Check if HTTP 500 is actually an upstream proxy / connection failure (e.g. Vite proxy ECONNREFUSED)
        if (response.status === 500) {
          const lowerRaw = rawBodyText.toLowerCase();
          if (
            !contentType.includes("application/json") ||
            lowerRaw.includes("econnrefused") ||
            lowerRaw.includes("etimedout") ||
            lowerRaw.includes("enotfound") ||
            lowerRaw.includes("econnreset") ||
            lowerRaw.includes("http-proxy") ||
            lowerRaw.includes("proxy error")
          ) {
            throw new Error(BACKEND_UNAVAILABLE_MESSAGE);
          }
        }

        // Determine user-facing error message
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

        if (typeof errorDetail === "string" && errorDetail.trim()) {
          // Guard against exposing internal Python stack traces, SQL errors, or secrets
          if (
            errorDetail.includes("Traceback (most recent call last)") ||
            errorDetail.includes("sqlalchemy.exc") ||
            errorDetail.includes("psycopg2") ||
            errorDetail.includes("sqlite3.OperationalError") ||
            errorDetail.includes("SECRET_KEY")
          ) {
            errorMessage =
              response.status >= 500
                ? "An internal server error occurred on the CrediWise API. Please try again later."
                : "A database error occurred while processing your request.";
          } else {
            errorMessage = errorDetail;
          }
        } else if (Array.isArray(errorDetail)) {
          // Pydantic 422 validation errors
          errorMessage =
            errorDetail
              .map((err: { msg?: string }) => err.msg || "")
              .filter(Boolean)
              .join(", ") || errorMessage;
        } else if (response.status === 500) {
          // Genuine 500 with no custom detail
          errorMessage =
            "An internal server error occurred on the CrediWise API. Please try again later.";
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message === BACKEND_UNAVAILABLE_MESSAGE) {
        throw error;
      }

      // Catch browser fetch network errors (TypeError: Failed to fetch, NetworkError, etc.)
      if (
        error.name === "TypeError" ||
        error.name === "AbortError" ||
        (error.message && (
          error.message.includes("fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("Load failed") ||
          error.message.includes("Network request failed") ||
          error.message.includes("ECONNREFUSED")
        ))
      ) {
        throw new Error(BACKEND_UNAVAILABLE_MESSAGE);
      }
      throw error;
    }
  }

  // Authentication Endpoints
  public auth = {
    login: (payload: LoginPayload): Promise<AuthResponse> =>
      this.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    register: (payload: RegisterPayload): Promise<AuthResponse> =>
      this.request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getMe: (): Promise<User> =>
      this.request<User>("/auth/me", {
        method: "GET",
      }),
  };

  // Eligibility & System
  public eligibility = {
    getRules: (): Promise<EligibilityRulesResponse> =>
      this.request<EligibilityRulesResponse>("/eligibility/rules", {
        method: "GET",
      }),
  };

  public system = {
    getHealth: (): Promise<HealthCheckResponse> =>
      this.request<HealthCheckResponse>("/health", {
        method: "GET",
      }),
  };

  // Applications
  public applications = {
    getMyApplications: (): Promise<LoanApplicationListResponse> =>
      this.request<LoanApplicationListResponse>("/applications/me", {
        method: "GET",
      }),

    getApplicationById: (appId: number): Promise<LoanApplication> =>
      this.request<LoanApplication>(`/applications/${appId}`, {
        method: "GET",
      }),

    createApplication: (payload: Record<string, any>): Promise<LoanApplication> =>
      this.request<LoanApplication>("/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getAllApplicationsAdmin: (): Promise<LoanApplicationListResponse> =>
      this.request<LoanApplicationListResponse>("/applications", {
        method: "GET",
      }),
  };

  // Predictions & Simulator
  public predictions = {
    generatePrediction: (appId: number): Promise<PredictionResult> =>
      this.request<PredictionResult>(`/predictions/applications/${appId}`, {
        method: "POST",
      }),

    getPredictionForApp: (appId: number): Promise<PredictionResult> =>
      this.request<PredictionResult>(`/predictions/applications/${appId}`, {
        method: "GET",
      }),

    downloadAssessmentReport: async (appId: number): Promise<Blob> => {
      const url = `${API_BASE_URL}/predictions/applications/${appId}/assessment-report`;
      const token = this.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) {
        let errorMsg = `Failed to download assessment report (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }
      return await response.blob();
    },

    simulate: (payload: Record<string, any>): Promise<PredictionResult> =>
      this.request<PredictionResult>("/predictions/simulator", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  // Administrator & Analytics
  public admin = {
    getDashboard: (): Promise<AdminDashboardResponse> =>
      this.request<AdminDashboardResponse>("/admin/dashboard", {
        method: "GET",
      }),

    getUsers: (): Promise<AdminUsersResponse> =>
      this.request<AdminUsersResponse>("/admin/users", {
        method: "GET",
      }),

    getAnalytics: (): Promise<AdminAnalyticsResponse> =>
      this.request<AdminAnalyticsResponse>("/admin/analytics", {
        method: "GET",
      }),

    getMonitoring: (): Promise<AdminMonitoringResponse> =>
      this.request<AdminMonitoringResponse>("/admin/monitoring", {
        method: "GET",
      }),
  };
}

export const api = new ApiClient();
export default api;

