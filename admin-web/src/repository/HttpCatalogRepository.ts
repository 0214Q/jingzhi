import type { CatalogRepository, CatalogFilter, CatalogPage, CatalogItem, CatalogSaveRequest } from './CatalogRepository';
import type { DeriveVersionRequest, ConcurrencyHeaders, DraftResult, ApproveReviewRequest, SubmitReviewResult } from '../models/contracts';
import { type HttpTransport, queryPair, querySuffix } from './HttpProtocol';
export class HttpCatalogRepository implements CatalogRepository {
 constructor(private transport:HttpTransport) {}
 list(f:CatalogFilter):Promise<CatalogPage>{return this.transport.request('GET','/manage/catalog'+querySuffix([queryPair('keyword',f.keyword),queryPair('level',f.level),queryPair('state',f.state),queryPair('page',f.page),queryPair('pageSize',f.pageSize)]));}
 get(id:string):Promise<CatalogItem>{return this.transport.request('GET','/manage/catalog/'+encodeURIComponent(id));}
 derive(id:string,input:DeriveVersionRequest,lock:ConcurrencyHeaders):Promise<DraftResult>{return this.transport.request('POST','/manage/catalog/'+encodeURIComponent(id)+'/derive',JSON.stringify(input),lock.ifMatch);}
 save(id:string,vid:string,input:CatalogSaveRequest,lock:ConcurrencyHeaders):Promise<DraftResult>{return this.transport.request('PUT','/manage/catalog/'+encodeURIComponent(id)+'/versions/'+encodeURIComponent(vid),JSON.stringify(input),lock.ifMatch);}
 submit(id:string,input:ApproveReviewRequest):Promise<SubmitReviewResult>{return this.transport.request('POST','/manage/catalog/'+encodeURIComponent(id)+'/submit',JSON.stringify(input));}
}
