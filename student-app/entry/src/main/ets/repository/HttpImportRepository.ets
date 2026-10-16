import { CreateImportUploadRequest, ImportUploadTicket, CompleteImportUploadRequest, ImportFile, CreateImportJobRequest, ImportJob, ImportJobQuery, ImportJobPage, ImportRecognitionResult, ConfirmImportDraftRequest, ImportDraftLink, ImportJobLock, ImportCapabilities, ImportFilePage, ImportDraftReview } from '../models/Contracts';
import { RepositoryError } from './RepositoryError';
import { ImportRepository } from './ImportRepository';
import { HttpTransport, queryPair, querySuffix } from './HttpProtocol';
/** JSON API only. PUT uploadPath sends raw bytes separately with authenticated octet-stream. */
export class HttpImportRepository implements ImportRepository {
 private transport: HttpTransport;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async getDraftReview(versionId: string): Promise<ImportDraftReview | null> { try { return await this.transport.request<ImportDraftReview>('GET','/manage/import-drafts/'+encodeURIComponent(versionId)+'/origin'); } catch (error) { if(error instanceof RepositoryError && error.code===404) return null; if(error instanceof Error) { const known: Error = error as Error; throw (known as Error); } throw new RepositoryError(500,'读取文件来源失败'); } }
 getFile(fileId: string): Promise<ImportFile> { return this.transport.request<ImportFile>('GET','/manage/import-files/'+encodeURIComponent(fileId)); }
 getPages(fileId: string): Promise<ImportFilePage[]> { return this.transport.request<ImportFilePage[]>('GET','/manage/import-files/'+encodeURIComponent(fileId)+'/pages'); }
 getCapabilities(schoolId: string): Promise<ImportCapabilities> { return this.transport.request<ImportCapabilities>('GET','/manage/import-capabilities'+querySuffix([queryPair('schoolId',schoolId)])); }
 createUpload(input: CreateImportUploadRequest): Promise<ImportUploadTicket> { return this.transport.request<ImportUploadTicket>('POST','/manage/import-files',JSON.stringify(input)); }
 completeUpload(fileId: string, input: CompleteImportUploadRequest): Promise<ImportFile> { return this.transport.request<ImportFile>('POST','/manage/import-files/'+encodeURIComponent(fileId)+'/complete',JSON.stringify(input)); }
 createJob(input: CreateImportJobRequest): Promise<ImportJob> { return this.transport.request<ImportJob>('POST','/manage/import-jobs',JSON.stringify(input)); }
 listJobs(query: ImportJobQuery): Promise<ImportJobPage> { return this.transport.request<ImportJobPage>('GET','/manage/import-jobs'+querySuffix([queryPair('schoolId',query.schoolId),queryPair('page',query.page),queryPair('pageSize',query.pageSize),queryPair('status',query.status)])); }
 getJob(jobId: string): Promise<ImportJob> { return this.transport.request<ImportJob>('GET','/manage/import-jobs/'+encodeURIComponent(jobId)); }
 getResult(jobId: string): Promise<ImportRecognitionResult> { return this.transport.request<ImportRecognitionResult>('GET','/manage/import-jobs/'+encodeURIComponent(jobId)+'/result'); }
 confirmDraft(jobId: string, input: ConfirmImportDraftRequest): Promise<ImportDraftLink> { return this.transport.request<ImportDraftLink>('POST','/manage/import-jobs/'+encodeURIComponent(jobId)+'/confirm',JSON.stringify(input)); }
 retryJob(jobId: string, input: ImportJobLock): Promise<ImportJob> { return this.transport.request<ImportJob>('POST','/manage/import-jobs/'+encodeURIComponent(jobId)+'/retry',JSON.stringify(input)); }
 cancelJob(jobId: string, input: ImportJobLock): Promise<ImportJob> { return this.transport.request<ImportJob>('POST','/manage/import-jobs/'+encodeURIComponent(jobId)+'/cancel',JSON.stringify(input)); }
 deleteFile(fileId: string): Promise<void> { return this.transport.requestVoid('DELETE','/manage/import-files/'+encodeURIComponent(fileId)); }
}
