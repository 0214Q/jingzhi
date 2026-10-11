import { ApiResponse, ApiErrorData } from './contracts';
import { RepositoryError } from './RepositoryError';
export interface HttpTransport {
 request<T>(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous?: boolean): Promise<T>;
 requestVoid(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous?: boolean, authorizationOverride?: string | null): Promise<void>;
}
export function checkedResponse<T>(status: number, json: string): ApiResponse<T> {
 let response: ApiResponse<T>;
 try { response = JSON.parse(json) as ApiResponse<T>; } catch { throw new RepositoryError(502, '服务返回了无效JSON'); }
 if (!response || typeof response !== 'object' || typeof response.code !== 'number' || !Number.isInteger(response.code)) throw new RepositoryError(502, '服务响应格式无效');
 if (status < 200 || status >= 300 || response.code < 200 || response.code >= 300) {
  const failure: ApiResponse<ApiErrorData> = JSON.parse(json) as ApiResponse<ApiErrorData>;
  const code: number = status >= 400 ? status : response.code >= 400 ? response.code : 502;
  throw new RepositoryError(code, response.message || '请求失败，请重试', failure.data || null, response.traceId || null);
 }
 if (response.code !== status) throw new RepositoryError(502, '服务响应状态不一致');
 return response;
}
export function responseData<T>(status: number, json: string): T {
 const response: ApiResponse<T> = checkedResponse<T>(status, json);
 if (response.data === null || response.data === undefined) throw new RepositoryError(502, '服务响应缺少数据');
 return response.data;
}
export function queryPair(key: string, value: string | number | undefined): string {
 return value === undefined ? '' : encodeURIComponent(key) + '=' + encodeURIComponent(value.toString());
}
export function querySuffix(parts: string[]): string { const active: string[] = parts.filter((part: string) => part !== ''); return active.length ? '?' + active.join('&') : ''; }
