// API configuration
export const API_URL = 'https://crosscare-backend.onrender.com';

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
