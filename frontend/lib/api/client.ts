export class ApiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T, B>(path: string, body?: B): Promise<T>;
  patch<T, B>(path: string, body?: B): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
};

const getHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('montara_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('montara_access_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    throw new ApiError('Unauthorized', 401);
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = (data && typeof data === 'object' && data.message)
      ? (Array.isArray(data.message) ? data.message.join(', ') : data.message)
      : (typeof data === 'string' && data ? data : response.statusText);
    throw new ApiError(errorMessage || `Request failed with status ${response.status}`, response.status);
  }

  return data as T;
}

export const apiClient: ApiClient = {
  async get<T>(path: string): Promise<T> {
    const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T, B>(path: string, body?: B): Promise<T> {
    const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = getHeaders() as Record<string, string>;
    const options: RequestInit = {
      method: 'POST',
      headers,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    return handleResponse<T>(response);
  },

  async patch<T, B>(path: string, body?: B): Promise<T> {
    const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = getHeaders() as Record<string, string>;
    const options: RequestInit = {
      method: 'PATCH',
      headers,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },
};

export const apiPaths = {
  students: '/students',
  classrooms: '/classrooms',
  attendance: '/attendance',
  observations: '/observations',
  assessments: '/assessments',
  finance: '/finance',
  dashboard: '/dashboard',
  auth: '/auth',
} as const;

export type ServiceMethod<T> = {
  list: () => Promise<T[]>;
  get: (id: string) => Promise<T>;
};
