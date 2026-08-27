interface ApiOptions {
  method?: string;
  body?: unknown;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiCall<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const fetchOpts: RequestInit = {
    method: options.method || 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (options.body !== undefined) {
    fetchOpts.body = JSON.stringify(options.body);
  }
  const res = await fetch(path, fetchOpts);
  let data: unknown = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error || 'Ocurrió un error inesperado.';
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => apiCall<T>(path, { method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown) => apiCall<T>(path, { method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown) => apiCall<T>(path, { method: 'PUT', body }),
  delete: <T = unknown>(path: string) => apiCall<T>(path, { method: 'DELETE' }),
};
