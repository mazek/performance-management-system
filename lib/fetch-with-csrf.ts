// Client-side fetch wrapper that includes CSRF token
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  // Get CSRF token from cookie or meta tag
  const csrfToken = getCSRFTokenFromCookie() || getCSRFTokenFromMeta();
  
  // Add CSRF token to headers for state-changing requests
  if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
    options.headers = {
      ...options.headers,
      'x-csrf-token': csrfToken || '',
    };
  }
  
  return fetch(url, options);
}

function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function getCSRFTokenFromMeta(): string | null {
  if (typeof document === 'undefined') return null;
  
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || null;
}

// Hook for React components
export function useCSRFToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getCSRFTokenFromCookie() || getCSRFTokenFromMeta();
}