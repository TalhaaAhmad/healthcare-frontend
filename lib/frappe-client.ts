  import axios, { AxiosInstance, AxiosError } from 'axios';

let _apiKeyClient: AxiosInstance | null = null;
let _cookieClient: AxiosInstance | null = null;

function getEnvVars() {
  const FRAPPE_BASE_URL = process.env.FRAPPE_BASE_URL;
  const FRAPPE_API_KEY = process.env.FRAPPE_API_KEY;
  const FRAPPE_API_SECRET = process.env.FRAPPE_API_SECRET;

  if (!FRAPPE_BASE_URL) {
    throw new Error('FRAPPE_BASE_URL is not configured');
  }

  return { FRAPPE_BASE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET };
}

function createApiKeyClient(): AxiosInstance {
  const { FRAPPE_BASE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET } = getEnvVars();

  if (!FRAPPE_API_KEY || !FRAPPE_API_SECRET) {
    throw new Error('Frappe API Key/Secret are not configured');
  }

  const client: AxiosInstance = axios.create({
    baseURL: `${FRAPPE_BASE_URL}/api`,
    headers: {
      'Authorization': `token ${FRAPPE_API_KEY}:${FRAPPE_API_SECRET}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  });

  client.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Frappe API Key] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as any;
        switch (status) {
          case 401: console.error('Frappe API Key authentication failed'); break;
          case 403: console.error('Permission denied:', data?.message); break;
          case 404: console.error('DocType or document not found'); break;
          case 417: console.error('Validation error:', data?.message); break;
          case 500: console.error('Frappe server error:', data?.exception); break;
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

function createCookieClient(): AxiosInstance {
  const { FRAPPE_BASE_URL } = getEnvVars();

  const client: AxiosInstance = axios.create({
    baseURL: `${FRAPPE_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
    withCredentials: true,
  });

  client.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Frappe Cookie] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
}

/**
 * Server-side Frappe client with API Key authentication.
 * Use for data operations (DocType CRUD) where no user session exists.
 */
export function getFrappeServerClient(): AxiosInstance {
  if (!_apiKeyClient) {
    _apiKeyClient = createApiKeyClient();
  }
  return _apiKeyClient;
}

/**
 * Cookie-based Frappe client (NO API Key).
 * Use for auth endpoints (login, logout, get_logged_user) where
 * the caller provides cookies that must be forwarded to Frappe.
 */
export function getFrappeCookieClient(): AxiosInstance {
  if (!_cookieClient) {
    _cookieClient = createCookieClient();
  }
  return _cookieClient;
}

/**
 * Client-side helper (calls Next.js proxy, NOT Frappe directly)
 * Includes credentials so session cookies are forwarded to Frappe.
 */
export const frappeClient = {
  async get(endpoint: string, params?: Record<string, any>) {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).map(([k, v]) => {
            // Only stringify objects/arrays; pass strings/numbers as-is
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
              return [k, String(v)];
            }
            return [k, JSON.stringify(v)];
          })
        )
      : '';

    const res = await fetch(`/api/frappe${endpoint}${queryString}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async post(endpoint: string, data: any) {
    const res = await fetch(`/api/frappe${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async put(endpoint: string, data: any) {
    const res = await fetch(`/api/frappe${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async delete(endpoint: string) {
    const res = await fetch(`/api/frappe${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  },
};
