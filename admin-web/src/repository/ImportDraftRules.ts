import { ImportMediaType, ImportJobStatus, ImportDecisionKind, ImportDatePrecision, ImportIssueSeverity, ImportDuplicateDecision, ImportJob, ImportFile, CreateImportUploadRequest, ImportUploadStatus, ImportRecognitionResult, ConfirmImportDraftRequest, ImportRuleContext, ImportDraftPreparation, ImportFieldConfirmation, ImportFieldCandidate, ImportEvidence, ImportFieldKey, CampusCapability, EntryType, ChangeType, CreateDraftRequest, ImportDraftOrigin, ContestPayload, ImportIssueResolution, ImportStageConfirmation, ContestScheduleItem } from '../models/contracts';
import { RepositoryError } from './RepositoryError';
import { campusPermission } from './CampusPermissions';
import { blankPayload, applyInput, validate, validDate } from './MockRules';
export const IMPORT_MAX_FILE_BYTES: number = 20 * 1024 * 1024;
export const IMPORT_MAX_JOB_BYTES: number = 40 * 1024 * 1024;
export const IMPORT_MAX_FILES: number = 10;
export const IMPORT_MAX_PAGES: number = 100;
const dateFields: string[] = ['regStart','regEnd','contestStart','contestEnd','publicityTime','sourcePublishedAt','lastVerifiedAt','stageDate'];
const businessFields: string[] = ['name','category','scopeType','edition','level','regStart','regEnd','contestStart','contestEnd','publicityTime','contestRequirement','reviewRules','awardSetting','material','entryMethod','contact','description','sourceTitle','sourceOrg','sourceUrl','sourcePublishedAt','lastVerifiedAt'];
function fieldValue(p: ContestPayload, key: string): string | null {
 switch (key) {
  case 'name': return p.name;
  case 'category': return p.category;
  case 'scopeType': return p.scopeType;
  case 'edition': return p.edition;
  case 'level': return p.level;
  case 'regStart': return p.regStart;
  case 'regEnd': return p.regEnd;
  case 'contestStart': return p.contestStart;
  case 'contestEnd': return p.contestEnd;
  case 'publicityTime': return p.publicityTime;
  case 'contestRequirement': return p.contestRequirement;
  case 'reviewRules': return p.reviewRules;
  case 'awardSetting': return p.awardSetting;
  case 'material': return p.material;
  case 'entryMethod': return p.entryMethod;
  case 'contact': return p.contact;
  case 'description': return p.description;
  case 'sourceTitle': return p.sourceTitle;
  case 'sourceOrg': return p.sourceOrg;
  case 'sourceUrl': return p.sourceUrl;
  case 'sourcePublishedAt': return p.sourcePublishedAt;
  case 'lastVerifiedAt': return p.lastVerifiedAt;
  default: return null;
 }
}
function fail(code: number, message: string): never { throw new RepositoryError(code, message); }
function hasText(value: string | null | undefined): boolean { return typeof value === 'string' && value.trim().length > 0; }
function checkKey(key: string): void { if (!/^[A-Za-z0-9_-]{16,100}$/.test(key)) fail(422,'幂等键需16—100位字母、数字、下划线或短横线'); }
function fresh(now: string, expiresAt: string): void { if (!validDate(now) || !now.includes('T') || !validDate(expiresAt) || !expiresAt.includes('T') || Date.parse(now) >= Date.parse(expiresAt)) fail(409,'任务或文件已过期，需重新上传识别'); }
export function requireImportPermission(context: ImportRuleContext, schoolId: string, contestId: string | null): void {
 if (!campusPermission(context.permissions,context.actor,CampusCapability.Value5,{schoolId:schoolId,collegeId:null,contestId:contestId}).allowed) fail(403,'没有此高校或赛事的文件导入权限');
}
export function validateImportUpload(input: CreateImportUploadRequest, context: ImportRuleContext): void {
 requireImportPermission(context,input.schoolId,input.targetContestId);checkKey(input.idempotencyKey);
 if (!hasText(input.originalName) || input.originalName.length > 255 || /[\\/\x00-\x1f]/.test(input.originalName)) fail(422,'文件名无效');
 const types: ImportMediaType[] = [ImportMediaType.Value0,ImportMediaType.Value1,ImportMediaType.Value2,ImportMediaType.Value3,ImportMediaType.Value4];
 if (!types.includes(input.declaredMediaType)) fail(422,'首期只支持PDF、DOCX、JPEG、PNG和WebP');
 if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > IMPORT_MAX_FILE_BYTES) fail(422,'单文件须为1字节至20MiB');
 if (!/^[a-f0-9]{64}$/.test(input.sha256)) fail(422,'需要小写SHA-256摘要；服务端仍须重新计算并检查真实文件类型');
}
export function validateImportJobFiles(job: ImportJob, files: ImportFile[], context: ImportRuleContext): void {
 requireImportPermission(context,job.schoolId,job.targetContestId);fresh(context.now,job.expiresAt);
 if (job.createdBy !== context.actor.userId && !campusPermission(context.permissions,context.actor,CampusCapability.Value7,{schoolId:job.schoolId,collegeId:null,contestId:null}).allowed) fail(403,'不能读取其他负责人的识别任务');
 if (!job.fileIds.length || job.fileIds.length > IMPORT_MAX_FILES || new Set(job.fileIds).size !== job.fileIds.length || files.length !== job.fileIds.length) fail(422,'材料需1—10个不同文件');
 let bytes: number = 0; let pages: number = 0; let documents: number = 0;
 for (const file of files) {
  if (!job.fileIds.includes(file.fileId) || files.filter((f: ImportFile) => f.fileId === file.fileId).length !== 1 || file.schoolId !== job.schoolId || file.uploadedBy !== job.createdBy || file.targetContestId !== job.targetContestId) fail(403,'材料归属或目标赛事不一致');
  if (file.status !== ImportUploadStatus.Value1 || file.detectedMediaType === null || !Number.isInteger(file.pageCount) || (file.pageCount || 0) < 1 || !Number.isInteger(file.byteSize) || file.byteSize < 1 || file.byteSize > IMPORT_MAX_FILE_BYTES || !/^[a-f0-9]{64}$/.test(file.sha256)) fail(422,'文件须通过服务端接收、类型及完整性校验后识别');
  fresh(context.now,file.expiresAt);bytes += file.byteSize;pages += file.pageCount || 0;
  if (file.detectedMediaType === ImportMediaType.Value0 || file.detectedMediaType === ImportMediaType.Value1) documents += 1;
 }
 if (bytes > IMPORT_MAX_JOB_BYTES || pages > IMPORT_MAX_PAGES) fail(422,'每任务最多40MiB、100页');
 if (documents && files.length !== 1) fail(422,'每任务限一份PDF或DOCX，或最多10张图片；文档中多个赛事须分成独立任务确认');
}
export function assertImportTransition(from: ImportJobStatus, to: ImportJobStatus): void {
 const allowed: boolean = (from === ImportJobStatus.Value0 && [ImportJobStatus.Value1,ImportJobStatus.Value5,ImportJobStatus.Value6].includes(to)) ||
  (from === ImportJobStatus.Value1 && [ImportJobStatus.Value2,ImportJobStatus.Value4,ImportJobStatus.Value5,ImportJobStatus.Value6].includes(to)) ||
  (from === ImportJobStatus.Value2 && [ImportJobStatus.Value3,ImportJobStatus.Value5,ImportJobStatus.Value6].includes(to)) ||
  (from === ImportJobStatus.Value4 && [ImportJobStatus.Value0,ImportJobStatus.Value5,ImportJobStatus.Value6].includes(to));
 if (!allowed) fail(409,'不允许的识别任务状态变化');
}
function evidenceFor(result: ImportRecognitionResult, ids: string[], files: ImportFile[]): ImportEvidence[] {
 const selected: ImportEvidence[] = [];
 if (new Set(ids).size !== ids.length) fail(422,'证据ID重复');
 for (const id of ids) {
  const e: ImportEvidence | undefined = result.evidence.find((v: ImportEvidence) => v.evidenceId === id);
  const file: ImportFile | undefined = files.find((f: ImportFile) => f.fileId === e?.fileId);
  if (!e || !file || e.jobId !== result.jobId || !Number.isInteger(e.pageNumber) || e.pageNumber < 1 || e.pageNumber > (file.pageCount || 0) || !hasText(e.snippet) || e.snippet.length > 1000) fail(422,'证据缺失、越页或不属于当前任务');
  selected.push(e);
 }
 return selected;
}
function candidateConfirmation(choice: ImportFieldConfirmation, result: ImportRecognitionResult, files: ImportFile[]): void {
 const proofs: ImportEvidence[] = evidenceFor(result,choice.evidenceIds,files);
 if (choice.decision === ImportDecisionKind.Value2) {
  if (choice.value !== null || choice.candidateId !== null || choice.evidenceIds.length) fail(422,'未知字段必须为空，不得携带候选值');return;
 }
 if (choice.decision === ImportDecisionKind.Value1) {
  if (choice.candidateId !== null || !hasText(choice.note) || !hasText(choice.value)) fail(422,'人工填写需给出值和核对说明');return;
 }
 if (choice.decision !== ImportDecisionKind.Value0) fail(422,'字段确认方式无效');
 const candidate: ImportFieldCandidate | undefined = result.candidates.find((c: ImportFieldCandidate) => c.candidateId === choice.candidateId && c.field === choice.field);
 if (!candidate || candidate.value !== choice.value || !hasText(choice.value) || !proofs.length || candidate.evidenceIds.length !== choice.evidenceIds.length || !candidate.evidenceIds.every((id: string) => choice.evidenceIds.includes(id))) fail(422,'采用识别值必须逐字对应候选及其原文证据');
 if (candidate.confidence !== null && (!Number.isFinite(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 1)) fail(422,'置信度须为0—1或未知');
 if ((candidate.confidence === null || candidate.confidence < 0.85) && !hasText(choice.note)) fail(422,'低置信度或未知置信度需人工核对说明');
 if (dateFields.includes(choice.field)) {
  if (candidate.datePrecision !== ImportDatePrecision.Value2 && candidate.datePrecision !== ImportDatePrecision.Value3) fail(422,'月份、缺失日期不能转换为具体日程');
  const value: string = choice.value || '';
  if ((candidate.datePrecision === ImportDatePrecision.Value3) !== value.includes('T')) fail(422,'不得增加或丢失原文时间精度');
  if (!hasText(choice.note)) fail(422,'日期需明确核对年份、阶段和时区');
  if (value.includes('T') && !hasText(candidate.sourceTimeZone)) fail(422,'原时区未知时不得采用精确时刻');
  const original: string = candidate.rawText + proofs.map((e: ImportEvidence) => e.snippet).join(' ');
  if (!/\b\d{4}\b/.test(original)) fail(422,'原文证据缺少年份，需人工填写并说明年份依据');
 }
}
/** Pure preparation only: returns an ordinary draft request and server-owned provenance.
 * Server must re-read permissions/target/task and atomically link one draft using etag + idempotency key.
 * This function neither creates database rows nor submits/reviews/publishes a contest.
 */
export function prepareImportDraft(job: ImportJob, files: ImportFile[], result: ImportRecognitionResult, request: ConfirmImportDraftRequest, context: ImportRuleContext): ImportDraftPreparation {
 validateImportJobFiles(job,files,context);checkKey(request.idempotencyKey);
 if (job.status !== ImportJobStatus.Value2 || job.draftLink !== null) fail(409,'仅待确认、尚未转草稿的任务可确认');
 if (request.expectedJobEtag !== job.etag || result.jobEtag !== job.etag || result.jobId !== job.jobId || result.schoolId !== job.schoolId) fail(409,'识别结果已变化，请重新载入');
 if (new Set(result.candidates.map((c: ImportFieldCandidate) => c.candidateId)).size !== result.candidates.length || new Set(result.evidence.map((e: ImportEvidence) => e.evidenceId)).size !== result.evidence.length) fail(422,'识别结果的候选或证据ID重复');
 for (const issue of result.issues) {
  if (issue.severity === ImportIssueSeverity.Value2) fail(422,'阻断问题未消除，不能生成草稿：' + issue.message);
  if (issue.severity === ImportIssueSeverity.Value1 && !request.issueResolutions.some((r) => r.issueId === issue.issueId && hasText(r.note))) fail(422,'需确认的问题必须逐项说明：' + issue.message);
 }
 if (request.issueResolutions.some((r) => !result.issues.some((i) => i.issueId === r.issueId)) || new Set(request.issueResolutions.map((r) => r.issueId)).size !== request.issueResolutions.length) fail(422,'问题确认记录无效或重复');
 if (request.targetContestId !== job.targetContestId) fail(409,'不能在确认时更换任务目标赛事');
 if (request.duplicateDecision === ImportDuplicateDecision.Value1) {
  const target = context.target;
  if (!target || target.contestId !== job.targetContestId || target.schoolId !== job.schoolId || target.takedown || !target.publishedVersionId || target.workingVersionId !== null || target.publishedEtag !== request.expectedPublishedEtag) fail(409,'目标赛事已变化、已下架或已有工作版本，需在原编辑流程处理');
 } else if (request.duplicateDecision === ImportDuplicateDecision.Value0) {
  if (job.targetContestId !== null || context.target !== null || request.expectedPublishedEtag !== null) fail(422,'新建任务不能携带已有赛事目标');
  if (result.duplicates.length && !hasText(request.duplicateNote)) fail(422,'疑似重复赛事必须人工说明仍需新建的原因');
 } else fail(422,'重复赛事处理方式无效');
 const values: Record<string, string | null> = {};
 // Scalars only; structured local scope and attachments are separately validated by existing services.
 const payload = blankPayload(request.draft);applyInput(payload,request.draft);
 for (const key of businessFields) {
  const value = fieldValue(payload,key);
  values[key] = value === '' || value === undefined ? null : value;
 }
 if (new Set(request.confirmations.map((c: ImportFieldConfirmation) => c.field)).size !== request.confirmations.length) fail(422,'字段确认重复');
 for (const key of businessFields) {
  const choice = request.confirmations.find((c: ImportFieldConfirmation) => c.field === key);
  if (!choice || choice.value !== values[key]) fail(422,'每个提取字段均须明确采用、人工填写或保留未知：' + key);
  candidateConfirmation(choice,result,files);
  if (dateFields.includes(key) && choice.value !== null && (!validDate(choice.value) || choice.value.includes('T') && !choice.value.endsWith('+08:00'))) fail(422,'日期必须有效；精确时刻统一为带+08:00的北京时间');
 }
 if (request.confirmations.some((c: ImportFieldConfirmation) => !businessFields.includes(c.field))) fail(422,'不支持的识别字段');
 if (!hasText(payload.name) || !hasText(payload.edition) || !request.draft.category || !request.draft.scopeType || !request.draft.level || !hasText(request.draft.reason)) fail(422,'名称、明确届次、分类、归属、层级和修改原因需人工确认');
 if (!hasText(context.organizationId) || !validDate(context.confirmedAt) || !context.confirmedAt.includes('T')) fail(422,'服务端须解析有效主办单位和确认时刻');
 if (payload.schedule?.length) fail(422,'日程需通过stageConfirmations逐项确认，不能直接在draft中注入');
 for (const candidate of result.candidates) {
  if (candidate.field === ImportFieldKey.Value22 && (!hasText(candidate.stage) || !request.stageConfirmations.some((s: ImportStageConfirmation) => s.stage === candidate.stage))) fail(422,'识别到的每个阶段均须明确采用、人工填写或保留未知');
 }
 if (request.stageConfirmations.length > 30 || new Set(request.stageConfirmations.map((s: ImportStageConfirmation) => s.stage)).size !== request.stageConfirmations.length) fail(422,'阶段名称不能重复且最多30项');
 const schedules: ContestScheduleItem[] = [];
 const privateStages: string[] = [];
 for (const stage of request.stageConfirmations) {
  if (!hasText(stage.stage) || stage.stage.length > 100) fail(422,'阶段名称必填且最多100字');
  if (stage.decision === ImportDecisionKind.Value0 && !result.candidates.some((c: ImportFieldCandidate) => c.candidateId === stage.candidateId && c.field === ImportFieldKey.Value22 && c.stage === stage.stage)) fail(422,'阶段名称不对应原候选');
  const choice: ImportFieldConfirmation = {field:ImportFieldKey.Value22,decision:stage.decision,candidateId:stage.candidateId,value:stage.value,evidenceIds:stage.evidenceIds,note:stage.note};
  candidateConfirmation(choice,result,files);
  if (stage.value !== null) {
   if (!validDate(stage.value) || stage.value.includes('T') && !stage.value.endsWith('+08:00')) fail(422,'阶段日期无效或不是北京时间');
   if (stage.sourceUrl !== null) {
    if (!/^https:\/\/[^\s]+$/.test(stage.sourceUrl)) fail(422,'公开阶段来源需HTTPS链接');
    schedules.push({stage:stage.stage,value:stage.value,sourceUrl:stage.sourceUrl});
   } else privateStages.push(stage.stage + '：' + stage.value + '（上传资料整理，尚待官方来源核对）');
  }
 }

 if (request.draft.attachmentIds?.length) fail(422,'文件附件只能由服务端绑定，不接受客户端指定附件ID');
 if (request.draft.organizationId && request.draft.organizationId !== context.organizationId) fail(403,'不能伪造主办单位');
 const draft: CreateDraftRequest = JSON.parse(JSON.stringify(request.draft)) as CreateDraftRequest;
 draft.entryType = EntryType.Value0;draft.organizationId = context.organizationId;draft.collectedAt = context.confirmedAt;
 draft.changeType = job.targetContestId ? ChangeType.Value0 : ChangeType.Value1;
 if (schedules.length) draft.schedule = schedules;
 if (privateStages.length) draft.description = (draft.description || '') + '\n【上传资料中的分阶段时间】\n' + privateStages.join('\n');
 const checked = blankPayload(draft);applyInput(checked,draft);validate(checked,false);
 const evidenceIds: string[] = [];
 for (const c of request.confirmations) for (const id of c.evidenceIds) if (!evidenceIds.includes(id)) evidenceIds.push(id);
 for (const c of request.stageConfirmations) for (const id of c.evidenceIds) if (!evidenceIds.includes(id)) evidenceIds.push(id);
 const origin: ImportDraftOrigin = {jobId:job.jobId,schoolId:job.schoolId,fileIds:job.fileIds.slice(),evidenceIds:evidenceIds,stageDecisions:JSON.parse(JSON.stringify(request.stageConfirmations)) as ImportStageConfirmation[],decisions:JSON.parse(JSON.stringify(request.confirmations)) as ImportFieldConfirmation[],issueResolutions:JSON.parse(JSON.stringify(request.issueResolutions)) as ImportIssueResolution[]};
 return {draft:draft,origin:origin};
}
