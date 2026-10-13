import { HttpTransport, checkedResponse, responseData } from '../repository/HttpProtocol';
import { RepositoryError } from '../repository/RepositoryError';
interface RawResponse { status:number; json:string }
export class FetchTransport implements HttpTransport {
 private base:string; private authorization:()=>string|null; private managementSchool:()=>string|null;
 constructor(base:string, authorization:()=>string|null, managementSchool:()=>string|null=()=>null) {
  const url=new URL(base); if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('API地址无效');
  this.base=base.replace(/\/$/,''); this.authorization=authorization; this.managementSchool=managementSchool;
 }
 private async raw(method:string,path:string,bodyJson?:string|null,ifMatch?:string|null,anonymous=false,override?:string|null):Promise<RawResponse> {
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
  try {
   const headers:Record<string,string>={Accept:'application/json'};
   if(bodyJson!=null) headers['Content-Type']='application/json';
   const authorization=override ?? this.authorization(); if(!anonymous && authorization) headers.Authorization=authorization;
   if(ifMatch) headers['If-Match']=ifMatch;
   if(path.startsWith('/manage/')&&!path.startsWith('/manage/campus/')){const school=this.managementSchool();if(school)headers['X-Campus-School']=school;}
   const result=await fetch(this.base+path,{method,headers,body:bodyJson??undefined,signal:controller.signal,credentials:'omit',cache:'no-store'});
   return {status:result.status,json:await result.text()};
  } catch(error) { if(error instanceof RepositoryError) throw error; throw new RepositoryError(controller.signal.aborted?408:503,controller.signal.aborted?'请求超时，请重试':'无法连接服务器，请检查地址和网络'); }
  finally {clearTimeout(timer);}
 }
 async request<T>(method:string,path:string,bodyJson?:string|null,ifMatch?:string|null,anonymous=false):Promise<T> {const result=await this.raw(method,path,bodyJson,ifMatch,anonymous); return responseData<T>(result.status,result.json);}
 async requestVoid(method:string,path:string,bodyJson?:string|null,ifMatch?:string|null,anonymous=false,override?:string|null):Promise<void> {const result=await this.raw(method,path,bodyJson,ifMatch,anonymous,override); checkedResponse<null>(result.status,result.json);}
}
