import { http } from '@kit.NetworkKit';
import { HttpTransport, checkedResponse, responseData } from './HttpProtocol';
import { RepositoryError } from './RepositoryError';
interface RawResponse { status: number; json: string }
export class ArkHttpTransport implements HttpTransport {
 private base: string;
 private authorization: () => string | null;
 constructor(base: string, authorization: () => string | null) { this.base = base.replace(/\/$/, ''); this.authorization = authorization; }
 private requestMethod(method: string): http.RequestMethod {
  switch (method) {
   case 'GET': return http.RequestMethod.GET;
   case 'POST': return http.RequestMethod.POST;
   case 'PUT': return http.RequestMethod.PUT;
   case 'PATCH': return http.RequestMethod.POST;
   case 'DELETE': return http.RequestMethod.DELETE;
   default: throw new RepositoryError(400, '不支持的HTTP方法');
  }
 }
 private async raw(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous: boolean = false, override?: string | null): Promise<RawResponse> {
  const task: http.HttpRequest = http.createHttp();
  try {
   const headers: Record<string, string> = {};
   headers['Accept'] = 'application/json';
   if (bodyJson !== null && bodyJson !== undefined) headers['Content-Type'] = 'application/json';
   const authorization: string | null = override === undefined || override === null ? this.authorization() : override;
   if (!anonymous && authorization !== null) headers['Authorization'] = authorization;
   if (ifMatch !== null && ifMatch !== undefined) headers['If-Match'] = ifMatch;
   const options: http.HttpRequestOptions = { method: this.requestMethod(method), header: headers, expectDataType: http.HttpDataType.STRING, connectTimeout: 10000, readTimeout: 15000, usingCache: false };
   if (bodyJson !== null && bodyJson !== undefined) options.extraData = bodyJson;
   const response: http.HttpResponse = await task.request(this.base + path, options);
   if (typeof response.result !== 'string') throw new RepositoryError(502, '服务响应格式无效');
   const result: RawResponse = { status: response.responseCode, json: response.result };
   return result;
  } catch (error) {
   if (error instanceof RepositoryError) { const known: RepositoryError = error as RepositoryError; throw (known as Error); }
   throw new RepositoryError(503, '无法连接服务器，请检查地址、网络和服务状态');
  } finally { task.destroy(); }
 }
 async request<T>(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous: boolean = false): Promise<T> {
  const result: RawResponse = await this.raw(method, path, bodyJson, ifMatch, anonymous); return responseData<T>(result.status, result.json);
 }
 async requestVoid(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous: boolean = false, override?: string | null): Promise<void> {
  const result: RawResponse = await this.raw(method, path, bodyJson, ifMatch, anonymous, override); checkedResponse<null>(result.status, result.json);
 }
}
