// Standardized fetch wrapper with auto token refresh
export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let res = await fetch(url, options);

  // If 401, try refreshing token
  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
    if (refreshRes.ok) {
      res = await fetch(url, options);
    } else {
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('인증이 만료되었습니다');
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `요청 실패 (${res.status})`);
  }

  return res.json();
}

// GET shorthand
export function apiGet<T = any>(url: string): Promise<T> {
  return apiFetch<T>(url);
}

// POST shorthand
export function apiPost<T = any>(url: string, body?: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// PUT shorthand
export function apiPut<T = any>(url: string, body?: any): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}
