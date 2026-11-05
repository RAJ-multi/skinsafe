import {
  MolecularAnalysisResult,
  HealthStatus,
  ApiErrorDetail,
  CompareCompoundItem,
  CompareCompoundsResponse,
  AssistantChatResponse,
} from "./types";

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  detail: ApiErrorDetail;
  statusCode: number;

  constructor(detail: ApiErrorDetail, statusCode: number) {
    super(detail.message || "An unexpected API error occurred.");
    this.name = "ApiError";
    this.detail = detail;
    this.statusCode = statusCode;
  }
}

export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { status: "degraded", version: "unknown", engine_ready: false };
    }
    return await res.json();
  } catch (err) {
    return { status: "offline", version: "unknown", engine_ready: false };
  }
}

export async function analyzeSmiles(smiles: string): Promise<MolecularAnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles }),
  });

  if (!res.ok) {
    let errorDetail: ApiErrorDetail;
    try {
      const data = await res.json();
      errorDetail = data.detail || {
        error_type: "NetworkError",
        message: data.message || `API error (${res.status})`,
      };
    } catch {
      errorDetail = {
        error_type: "HttpError",
        message: `HTTP error status ${res.status}: ${res.statusText}`,
      };
    }
    throw new ApiError(errorDetail, res.status);
  }

  return await res.json();
}

export async function compareCompounds(
  compounds: CompareCompoundItem[]
): Promise<CompareCompoundsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compounds }),
  });

  if (!res.ok) {
    let errorDetail: ApiErrorDetail;
    try {
      const data = await res.json();
      errorDetail = data.detail || {
        error_type: "NetworkError",
        message: data.message || `API error (${res.status})`,
      };
    } catch {
      errorDetail = {
        error_type: "HttpError",
        message: `HTTP error status ${res.status}: ${res.statusText}`,
      };
    }
    throw new ApiError(errorDetail, res.status);
  }

  return await res.json();
}

export async function assistantChat(
  message: string,
  context?: Record<string, unknown> | null
): Promise<AssistantChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context: context ?? null }),
  });

  if (!res.ok) {
    let errorDetail: ApiErrorDetail;
    try {
      const data = await res.json();
      errorDetail = data.detail || {
        error_type: "AssistantError",
        message: data.message || `API error (${res.status})`,
      };
    } catch {
      errorDetail = {
        error_type: "HttpError",
        message: `HTTP error status ${res.status}: ${res.statusText}`,
      };
    }
    throw new ApiError(errorDetail, res.status);
  }

  return await res.json();
}
