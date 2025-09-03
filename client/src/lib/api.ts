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

  // Si le token a expiré (403), déconnecter l'utilisateur
  if (response.status === 403) {
    const errorText = await response.text();
    if (errorText.includes('jwt expired')) {
      AuthService.logout();
      window.location.href = '/login';
      return response;
    }
  }

  if (!response.ok) {
    // Essayer de parser le JSON seulement si le content-type est JSON
    const contentType = response.headers.get("content-type");
    let errorMessage = "Une erreur est survenue";
    
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } else {
      // Pour les réponses non-JSON (comme les PDFs), lire le texte
      const errorText = await response.text().catch(() => "");
      if (errorText) errorMessage = errorText;
    }
    
    throw new ApiError(response.status, errorMessage);
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

// Fonction pour télécharger un fichier avec authentification
export async function downloadFile(url: string, filename?: string): Promise<void> {
  const response = await apiRequest(url);
  const blob = await response.blob();
  
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
