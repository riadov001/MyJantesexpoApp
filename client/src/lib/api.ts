import { AuthService } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...AuthService.getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || "Une erreur est survenue");
  }

  return response;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiRequest(url);
  return response.json();
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  const response = await apiRequest(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

export async function apiPut<T>(url: string, data?: any): Promise<T> {
  const response = await apiRequest(url, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiRequest(url, {
    method: "DELETE",
  });
  return response.json();
}
