const DEFAULT_API_URL = 'http://127.0.0.1:8000';

export function getApiUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const base = getApiUrl().replace(/\/+$/, '');
  const primaryUrl = `${base}${path}`;

  const tryFetch = async (url: string) => {
    const res = await fetch(url, { ...init });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  };

  try {
    return await tryFetch(primaryUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isNetworkError =
      msg.toLowerCase().includes('failed to fetch') ||
      msg.toLowerCase().includes('network request failed');
    const fallbackBase = base.includes('127.0.0.1')
      ? base.replace('127.0.0.1', 'localhost')
      : base.includes('localhost')
        ? base.replace('localhost', '127.0.0.1')
        : '';
    if (!isNetworkError || !fallbackBase || fallbackBase === base) {
      throw e;
    }
    return await tryFetch(`${fallbackBase}${path}`);
  }
}

export async function getJsonAuth<T>(path: string, token: string): Promise<T> {
  return requestJson<T>(path, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}

export async function postJsonAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  return requestJson<T>(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function putJsonAuth<T>(path: string, body: unknown, token: string): Promise<T> {
  return requestJson<T>(path, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}
