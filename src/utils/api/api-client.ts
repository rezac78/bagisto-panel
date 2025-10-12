type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClientOptions = {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  getAccessToken?: () => Promise<string | null> | string | null;
  setAccessToken?: (token: string | null) => Promise<void> | void;
  refreshTokenFn?: () => Promise<boolean>;
  onError?: (err: unknown, ctx?: { url: string; method: HttpMethod; status?: number }) => void;
};

export type RequestOptions = {
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  rawBody?: BodyInit;
  timeoutMs?: number;
  signal?: AbortSignal;
  retries?: number | null;
};

function buildQuery(q?: Record<string, string | number | undefined | null>) {
  if (!q) return "";
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v != null) params.append(k, String(v));
  });
  return params.toString() ? `?${params.toString()}` : "";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function createApiClient(opts: ApiClientOptions = {}) {
  const {
    baseUrl = "",
    defaultHeaders = { "Content-Type": "application/json" },
    timeoutMs = 30_000,
    maxRetries = 1,
    retryDelayMs = 500,
    getAccessToken,
    refreshTokenFn,
    onError,
  } = opts;

  let refreshingPromise: Promise<boolean> | null = null;

  async function tryRefreshOnce() {
    if (!refreshTokenFn) return false;
    if (refreshingPromise) return refreshingPromise;
    refreshingPromise = (async () => {
      try {
        return !!(await refreshTokenFn());
      } catch {
        return false;
      } finally {
        refreshingPromise = null;
      }
    })();
    return refreshingPromise;
  }

  async function buildHeaders(extra?: Record<string, string>) {
    const headers = { ...defaultHeaders, ...(extra ?? {}) };
    if (getAccessToken) {
      const token = await Promise.resolve(getAccessToken());
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async function parseResponse<T>(res: Response): Promise<{ data?: T; error?: unknown }> {
    const type = res.headers.get("content-type") ?? "";
    if (res.status === 204) return { data: undefined };
    try {
      if (type.includes("application/json")) {
        const json = await res.json();
        return res.ok ? { data: json } : { error: json };
      }
      const text = await res.text();
      return res.ok ? { data: text as unknown as T } : { error: text };
    } catch (e) {
      return res.ok ? { data: undefined } : { error: e };
    }
  }

  async function handle401<T>(url: string, method: HttpMethod, options: RequestOptions, fetchOpts: RequestInit) {
    const refreshed = await tryRefreshOnce();
    if (!refreshed) throw new Error("Unauthorized");

    const newHeaders = await buildHeaders(options.headers);
    const retryRes = await fetch(url, { ...fetchOpts, headers: newHeaders });
    const parsed = await parseResponse<T>(retryRes);
    if (!retryRes.ok) {
      onError?.(parsed.error ?? new Error(`HTTP ${retryRes.status}`), { url, method, status: retryRes.status });
      throw parsed.error ?? new Error(`HTTP ${retryRes.status}`);
    }
    return { status: retryRes.status, data: parsed.data, headers: retryRes.headers };
  }

  async function handleResponse<T>(
    res: Response,
    url: string,
    method: HttpMethod,
    fetchOpts: RequestInit,
    retries: number,
    attempt: number,
  ) {
    if (res.status === 401) return handle401<T>(url, method, {}, fetchOpts);

    const parsed = await parseResponse<T>(res);
    if (res.ok) return { status: res.status, data: parsed.data, headers: res.headers };

    if (res.status >= 500 && attempt <= retries) {
      await delay(retryDelayMs * 2 ** (attempt - 1));
      return null; // retry signal
    }

    const error = parsed.error ?? new Error(`HTTP ${res.status}`);
    onError?.(error, { url, method, status: res.status });
    throw error;
  }

  async function handleNetworkError<T>(
    err: any,
    attempt: number,
    retries: number,
    url: string,
    method: HttpMethod,
  ): Promise<"retry" | never> {
    if (err.name === "AbortError") {
      const e = new Error("Request timeout or aborted");
      onError?.(e, { url, method });
      throw e;
    }
    if (attempt <= retries) {
      await delay(retryDelayMs * 2 ** (attempt - 1));
      return "retry";
    }
    onError?.(err, { url, method });
    throw err;
  }

  async function executeFetch<T>(
    url: string,
    method: HttpMethod,
    fetchOpts: RequestInit,
    retries: number,
  ): Promise<{ status: number; data?: T; headers: Headers }> {
    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const res = await fetch(url, fetchOpts);
        const handled = await handleResponse<T>(res, url, method, fetchOpts, retries, attempt);
        if (handled) return handled;
      } catch (err) {
        const result = await handleNetworkError<T>(err, attempt, retries, url, method);
        if (result === "retry") continue;
      }
    }
  }

  async function rawRequest<T>(method: HttpMethod, path: string, options: RequestOptions = {}) {
    const url = `${baseUrl}${path}${buildQuery(options.query)}`;
    const controller = new AbortController();
    const signal = options.signal ?? controller.signal;
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? timeoutMs);
    const headers = await buildHeaders(options.headers);
    const body = options.rawBody ?? (options.body ? JSON.stringify(options.body) : undefined);
    const fetchOpts: RequestInit = { method, headers, body, signal };

    try {
      return await executeFetch<T>(url, method, fetchOpts, options.retries ?? maxRetries);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    request: <T>(method: HttpMethod, path: string, options?: RequestOptions) =>
      rawRequest<T>(method, path, options).then((r) => r.data),
    get: <T>(path: string, options?: RequestOptions) => rawRequest<T>("GET", path, options).then((r) => r.data),
    post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      rawRequest<T>("POST", path, { ...options, body: data }).then((r) => r.data),
    put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      rawRequest<T>("PUT", path, { ...options, body: data }).then((r) => r.data),
    patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
      rawRequest<T>("PATCH", path, { ...options, body: data }).then((r) => r.data),
    delete: <T>(path: string, options?: RequestOptions) => rawRequest<T>("DELETE", path, options).then((r) => r.data),
    refreshAuth: tryRefreshOnce,
  } as const;
}
