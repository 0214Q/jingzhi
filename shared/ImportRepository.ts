import { CreateImportUploadRequest, ImportUploadTicket, CompleteImportUploadRequest, ImportFile, CreateImportJobRequest, ImportJob, ImportJobQuery, ImportJobPage, ImportRecognitionResult, ConfirmImportDraftRequest, ImportDraftLink, ImportJobLock, ImportCapabilities, ImportFilePage, ImportDraftReview } from './contracts';
/** Server identity, permissions and file content are authoritative. */
export interface ImportRepository {
 getDraftReview(versionId: string): Promise<ImportDraftReview | null>;
 getFile(fileId: string): Promise<ImportFile>;
 getPages(fileId: string): Promise<ImportFilePage[]>;
 getCapabilities(schoolId: string): Promise<ImportCapabilities>;
 createUpload(input: CreateImportUploadRequest): Promise<ImportUploadTicket>;
 completeUpload(fileId: string, input: CompleteImportUploadRequest): Promise<ImportFile>;
 createJob(input: CreateImportJobRequest): Promise<ImportJob>;
 listJobs(query: ImportJobQuery): Promise<ImportJobPage>;
 getJob(jobId: string): Promise<ImportJob>;
 getResult(jobId: string): Promise<ImportRecognitionResult>;
 confirmDraft(jobId: string, input: ConfirmImportDraftRequest): Promise<ImportDraftLink>;
 retryJob(jobId: string, input: ImportJobLock): Promise<ImportJob>;
 cancelJob(jobId: string, input: ImportJobLock): Promise<ImportJob>;
 deleteFile(fileId: string): Promise<void>;
}
