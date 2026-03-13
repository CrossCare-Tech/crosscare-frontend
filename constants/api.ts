import axios from "axios";

// API configuration
export const API_URL = "http://localhost:5001";

let clientsConfigured = false;

export function configureApiClients() {
  if (clientsConfigured) {
    return;
  }

  axios.defaults.baseURL = API_URL;

  const originalFetch = global.fetch.bind(global);
  global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      return originalFetch(`${API_URL}${input}`, init);
    }

    return originalFetch(input, init);
  }) as typeof global.fetch;

  clientsConfigured = true;
}

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
