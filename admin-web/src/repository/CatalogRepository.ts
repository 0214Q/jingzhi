import { ContestLevel, VersionStatus, ManagedContest, PageQuery, UpdateDraftRequest, DeriveVersionRequest, DraftResult, SubmitReviewResult, ConcurrencyHeaders, ApproveReviewRequest } from '../models/contracts';
export interface CatalogFilter extends PageQuery { keyword?:string; level?:ContestLevel; state?:VersionStatus }
export interface CatalogSourceRow { sheet:string; excelRow:number; serial:string; raw:Record<string,string> }
export interface CatalogItem extends ManagedContest { organizationName:string; sourceRows?:CatalogSourceRow[] }
export interface CatalogPage { list:CatalogItem[]; total:number; page:number; pageSize:number }
export interface CatalogSaveRequest { draft:UpdateDraftRequest; organizerName:string }
export interface CatalogRepository {
 list(filter:CatalogFilter):Promise<CatalogPage>;
 get(contestId:string):Promise<CatalogItem>;
 derive(contestId:string,input:DeriveVersionRequest,lock:ConcurrencyHeaders):Promise<DraftResult>;
 save(contestId:string,versionId:string,input:CatalogSaveRequest,lock:ConcurrencyHeaders):Promise<DraftResult>;
 submit(contestId:string,input:ApproveReviewRequest):Promise<SubmitReviewResult>;
}
