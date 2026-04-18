// API configuration
const DEFAULT_API_URL = "https://crosscare-backend.onrender.com";
const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_URL = (envApiUrl || DEFAULT_API_URL).replace(/\/+$/, "");

const LOCAL_DEV_BASES = ["http://localhost:5001", "http://127.0.0.1:5001"];

const dedupe = (urls: string[]) => Array.from(new Set(urls.map((url) => url.replace(/\/+$/, ""))));

export const getApiBaseCandidates = (): string[] => {
  if (__DEV__) {
    if (envApiUrl) {
      // If developer explicitly set EXPO_PUBLIC_API_URL, prioritize it.
      return dedupe([API_URL, ...LOCAL_DEV_BASES]);
    }
    // In dev, prefer local backend first to avoid mixing local API calls with remote JWT tokens.
    return dedupe([...LOCAL_DEV_BASES, API_URL]);
  }
  return dedupe([API_URL]);
};

export const buildApiCandidates = (path: string): string[] => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return getApiBaseCandidates().map((base) => `${base}${normalizedPath}`);
};

// Helper function for API calls with proper error handling
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Check response status BEFORE parsing JSON
  if (!response.ok) {
    let errorMessage = 'Request failed';
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // JSON parsing failed, use default message
      }
    } else {
      errorMessage = `Server error: ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
