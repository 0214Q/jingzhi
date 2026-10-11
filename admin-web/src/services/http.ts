let authorizationProvider: (() => string | null) | null = null;
export function configureAuthorization(provider: () => string | null): void { authorizationProvider = provider; }
export class HttpError extends Error {
  constructor(public readonly status: number) { super(`HTTP ${status}`); }
}
// 暂不由页面调用。下一阶段仅允许 HttpRepository 使用该封装。
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new Error('尚未配置 API 地址');
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (authorizationProvider) {
    const value = authorizationProvider();
    if (value) headers.set('Authorization', value);
    else headers.delete('Authorization');
  }
  const response = await fetch(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, { ...init, headers });
  if (!response.ok) throw new HttpError(response.status);
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
