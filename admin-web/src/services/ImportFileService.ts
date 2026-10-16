import type { ImportFile } from '../models/contracts';
import type { ImportRepository } from '../repository/ImportRepository';
import { RepositoryError } from '../repository/RepositoryError';
import { checkedResponse } from '../repository/HttpProtocol';
export class ImportFileService {
 private base: string;
 constructor(base:string, private authorization:()=>string|null, private school:()=>string|null, private repository:ImportRepository, private fetcher:typeof fetch=fetch) {
  const url=new URL(base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('API地址无效');this.base=base.replace(/\/$/,'');
 }
 private capture(schoolId:string):string {const auth=this.authorization();if(!auth)throw new RepositoryError(401,'请先登录');if(this.school()!==schoolId)throw new RepositoryError(409,'当前工作高校已变化，请重新打开导入页');return auth;}
 private same(schoolId:string,authorization:string,signal?:AbortSignal):void {if(signal?.aborted)throw new RepositoryError(409,'操作已取消');if(this.authorization()!==authorization||this.school()!==schoolId)throw new RepositoryError(409,'工作高校或账号已变化，旧请求结果已丢弃');}
 async upload(file:File,schoolId:string,targetContestId:string|null,signal:AbortSignal,onTicket:(id:string)=>void=()=>{}):Promise<ImportFile> {
  const auth=this.capture(schoolId);this.same(schoolId,auth,signal);
  if(file.size<1||file.size>20*1024*1024)throw new RepositoryError(422,'单文件需为1字节至20MiB');
  if(!globalThis.crypto?.subtle)throw new RepositoryError(422,'请用 localhost 或 HTTPS 打开管理端，以安全校验文件摘要');
  const types:Record<string,string>={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
  const type=types[file.name.split('.').at(-1)?.toLowerCase()||''];if(!type)throw new RepositoryError(422,'请选择PDF、DOCX、JPEG、PNG或WebP');
  const bytes=await file.arrayBuffer();this.same(schoolId,auth,signal);const digest=await crypto.subtle.digest('SHA-256',bytes);const sha256=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');this.same(schoolId,auth,signal);
  const ticket=await this.repository.createUpload({schoolId,targetContestId,originalName:file.name,declaredMediaType:type as ImportFile['detectedMediaType']&string,byteSize:file.size,sha256,idempotencyKey:crypto.randomUUID()});
  this.same(schoolId,auth,signal);if(!/^\/manage\/import-files\/if-[a-f0-9-]{36}\/content$/.test(ticket.uploadPath))throw new RepositoryError(502,'上传地址格式无效');onTicket(ticket.fileId);
  const timer=AbortSignal.timeout(60000),combined=AbortSignal.any([signal,timer]);
  try {
   const response=await this.fetcher.call(globalThis,this.base+ticket.uploadPath,{method:'PUT',headers:{Authorization:auth,'Content-Type':'application/octet-stream'},body:bytes,signal:combined,credentials:'omit',cache:'no-store',redirect:'error'});
   checkedResponse(response.status,await response.text());this.same(schoolId,auth,signal);
   const accepted=await this.repository.completeUpload(ticket.fileId,{expectedSha256:sha256,expectedByteSize:file.size});this.same(schoolId,auth,signal);return accepted;
  }catch(e){if(e instanceof RepositoryError)throw e;throw new RepositoryError(combined.aborted?408:503,signal.aborted?'上传已取消':timer.aborted?'上传超时，请重试':'无法上传文件，请检查网络后重试');}
 }
 async download(file:ImportFile,schoolId:string,signal:AbortSignal):Promise<Blob> {
  const auth=this.capture(schoolId);this.same(schoolId,auth,signal);if(file.schoolId!==schoolId||!/^if-[a-f0-9-]{36}$/.test(file.fileId))throw new RepositoryError(403,'文件与当前高校不一致');
  const timeout=AbortSignal.timeout(30000),combined=AbortSignal.any([signal,timeout]);
  try{const response=await this.fetcher.call(globalThis,this.base+'/manage/import-files/'+encodeURIComponent(file.fileId)+'/content',{headers:{Authorization:auth},signal:combined,credentials:'omit',cache:'no-store',redirect:'error'});if(!response.ok){checkedResponse(response.status,await response.text());throw new RepositoryError(502,'下载失败');}const blob=await response.blob();this.same(schoolId,auth,signal);if(blob.size>20*1024*1024||blob.size!==file.byteSize)throw new RepositoryError(502,'原文件大小不匹配');return new Blob([blob],{type:file.detectedMediaType||'application/octet-stream'});}catch(e){if(e instanceof RepositoryError)throw e;throw new RepositoryError(combined.aborted?408:503,signal.aborted?'下载已取消':'原文件下载失败，请重试');}
 }
}
