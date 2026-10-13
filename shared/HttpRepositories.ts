/** Generated from repository schema by scripts/sync-http.py. */
import { ApproveReviewRequest, ApproveReviewResult, AuditLog, ChangeType, ConcurrencyHeaders, Contest, ContestFilter, ContestPage, ContestVersion, CreateDraftRequest, CreateFavoriteRequest, CreateFeedbackRequest, CreatePublicityRequest, DeriveVersionRequest, DraftResult, Favorite, FavoritePage, Feedback, FeedbackFilter, FeedbackPage, HandleFeedbackRequest, LoginRequest, LoginResult, ManagedContest, ManagedContestPage, PageQuery, PendingReviewPage, PublicAuditLog, PublicContest, Publicity, PublicityPage, PublicityResult, ReasonRequest, RejectReasonRequest, RejectReviewRequest, RejectReviewResult, SubmitReviewResult, TakedownRequest, UpdateDraftRequest, UpdatePublicityRequest, User, VersionPage } from './contracts';
import { AuthRepository, ContestRepository, PublicityRepository, FavoriteRepository, FeedbackRepository } from './Repositories';
import { HttpTransport, queryPair, querySuffix } from './HttpProtocol';
import { authorizationValue } from './SessionService';

function contestFilterQuery(input: ContestFilter): string { return querySuffix([queryPair('keyword', input.keyword), queryPair('category', input.category), queryPair('scopeType', input.scopeType), queryPair('entryType', input.entryType), queryPair('contestStatus', input.contestStatus), queryPair('year', input.year), queryPair('month', input.month), queryPair('monthMode', input.monthMode), queryPair('page', input.page), queryPair('pageSize', input.pageSize), queryPair('sort', input.sort), queryPair('datedOnly', input.datedOnly)]); }
function feedbackFilterQuery(input: FeedbackFilter): string { return querySuffix([queryPair('status', input.status), queryPair('page', input.page), queryPair('pageSize', input.pageSize)]); }
function pageQueryQuery(input: PageQuery): string { return querySuffix([queryPair('page', input.page), queryPair('pageSize', input.pageSize)]); }
export class HttpAuthRepository implements AuthRepository {
 private transport: HttpTransport;
 private lastAuthorization: string | null = null;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async login(input: LoginRequest): Promise<LoginResult> {
  const result: LoginResult = await this.transport.request<LoginResult>('POST', '/auth/login', JSON.stringify(input), null, true);
  this.lastAuthorization = authorizationValue(result); return result;
 }
 async logout(): Promise<void> {
  const authorization: string | null = this.lastAuthorization; this.lastAuthorization = null;
  if (authorization === null) return;
  await this.transport.requestVoid('POST', '/auth/logout', null, null, false, authorization);
 }
 async getCurrentUser(): Promise<User> {
  return this.transport.request<User>('GET', '/auth/me', null, null, false);
 }
}

export class HttpContestRepository implements ContestRepository {
 private transport: HttpTransport;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async listPublished(filter: ContestFilter): Promise<ContestPage> {
  return this.transport.request<ContestPage>('GET', '/contests' + contestFilterQuery(filter), null, null, false);
 }
 async getPublicVersion(contestId: string): Promise<PublicContest> {
  return this.transport.request<PublicContest>('GET', '/contests/' + encodeURIComponent(contestId) + '', null, null, false);
 }
 async getPublicAuditLog(contestId: string, changeType?: ChangeType): Promise<PublicAuditLog[]> {
  return this.transport.request<PublicAuditLog[]>('GET', '/contests/' + encodeURIComponent(contestId) + '/audit-logs' + querySuffix([queryPair('changeType', changeType)]), null, null, false);
 }
 async getPublicity(contestId: string): Promise<PublicityResult> {
  return this.transport.request<PublicityResult>('GET', '/contests/' + encodeURIComponent(contestId) + '/publicity', null, null, false);
 }
 async getMonths(filter: ContestFilter): Promise<string[]> {
  return this.transport.request<string[]>('GET', '/contests/months' + contestFilterQuery(filter), null, null, false);
 }
 async listManaged(filter: ContestFilter): Promise<ManagedContestPage> {
  return this.transport.request<ManagedContestPage>('GET', '/manage/contests' + contestFilterQuery(filter), null, null, false);
 }
 async getManaged(contestId: string): Promise<ManagedContest> {
  return this.transport.request<ManagedContest>('GET', '/manage/contests/' + encodeURIComponent(contestId) + '', null, null, false);
 }
 async createDraft(input: CreateDraftRequest): Promise<DraftResult> {
  return this.transport.request<DraftResult>('POST', '/manage/contests', JSON.stringify(input), null, false);
 }
 async updateDraft(contestId: string, versionId: string, input: UpdateDraftRequest, lock: ConcurrencyHeaders): Promise<DraftResult> {
  return this.transport.request<DraftResult>('PUT', '/manage/contests/' + encodeURIComponent(contestId) + '/versions/' + encodeURIComponent(versionId) + '', JSON.stringify(input), lock.ifMatch, false);
 }
 async deriveVersion(contestId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders): Promise<DraftResult> {
  return this.transport.request<DraftResult>('POST', '/manage/contests/' + encodeURIComponent(contestId) + '/versions', JSON.stringify(input), lock.ifMatch, false);
 }
 async submitReview(contestId: string, versionId: string, lock: ConcurrencyHeaders): Promise<SubmitReviewResult> {
  return this.transport.request<SubmitReviewResult>('POST', '/manage/contests/' + encodeURIComponent(contestId) + '/versions/' + encodeURIComponent(versionId) + '/submit', null, lock.ifMatch, false);
 }
 async reviewApprove(contestId: string, input: ApproveReviewRequest): Promise<ApproveReviewResult> {
  return this.transport.request<ApproveReviewResult>('POST', '/manage/review/' + encodeURIComponent(contestId) + '/approve', JSON.stringify(input), null, false);
 }
 async reviewReject(contestId: string, input: RejectReviewRequest): Promise<RejectReviewResult> {
  return this.transport.request<RejectReviewResult>('POST', '/manage/review/' + encodeURIComponent(contestId) + '/reject', JSON.stringify(input), null, false);
 }
 async listPending(filter: ContestFilter): Promise<PendingReviewPage> {
  return this.transport.request<PendingReviewPage>('GET', '/manage/review/pending' + contestFilterQuery(filter), null, null, false);
 }
 async listVersions(contestId: string, page: PageQuery): Promise<VersionPage> {
  return this.transport.request<VersionPage>('GET', '/manage/contests/' + encodeURIComponent(contestId) + '/versions' + pageQueryQuery(page), null, null, false);
 }
 async getVersion(contestId: string, versionId: string): Promise<ContestVersion> {
  return this.transport.request<ContestVersion>('GET', '/manage/contests/' + encodeURIComponent(contestId) + '/versions/' + encodeURIComponent(versionId) + '', null, null, false);
 }
 async getInternalAuditLog(contestId: string, changeType?: ChangeType): Promise<AuditLog[]> {
  return this.transport.request<AuditLog[]>('GET', '/manage/contests/' + encodeURIComponent(contestId) + '/audit-logs' + querySuffix([queryPair('changeType', changeType)]), null, null, false);
 }
 async restoreVersion(contestId: string, versionId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders): Promise<DraftResult> {
  return this.transport.request<DraftResult>('POST', '/manage/contests/' + encodeURIComponent(contestId) + '/versions/' + encodeURIComponent(versionId) + '/restore', JSON.stringify(input), lock.ifMatch, false);
 }
 async takedown(contestId: string, input: TakedownRequest): Promise<Contest> {
  return this.transport.request<Contest>('POST', '/manage/contests/' + encodeURIComponent(contestId) + '/takedown', JSON.stringify(input), null, false);
 }
 async restorePublication(contestId: string): Promise<Contest> {
  return this.transport.request<Contest>('POST', '/manage/contests/' + encodeURIComponent(contestId) + '/restore', null, null, false);
 }
}

export class HttpPublicityRepository implements PublicityRepository {
 private transport: HttpTransport;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async create(input: CreatePublicityRequest): Promise<Publicity> {
  return this.transport.request<Publicity>('POST', '/manage/publicity', JSON.stringify(input), null, false);
 }
 async update(publicityId: string, input: UpdatePublicityRequest, lock: ConcurrencyHeaders): Promise<Publicity> {
  return this.transport.request<Publicity>('PUT', '/manage/publicity/' + encodeURIComponent(publicityId) + '', JSON.stringify(input), lock.ifMatch, false);
 }
 async submitReview(publicityId: string, lock: ConcurrencyHeaders): Promise<Publicity> {
  return this.transport.request<Publicity>('POST', '/manage/publicity/' + encodeURIComponent(publicityId) + '/submit', null, lock.ifMatch, false);
 }
 async reviewApprove(publicityId: string, lock: ConcurrencyHeaders): Promise<Publicity> {
  return this.transport.request<Publicity>('POST', '/manage/review/publicity/' + encodeURIComponent(publicityId) + '/approve', null, lock.ifMatch, false);
 }
 async reviewReject(publicityId: string, input: RejectReasonRequest, lock: ConcurrencyHeaders): Promise<Publicity> {
  return this.transport.request<Publicity>('POST', '/manage/review/publicity/' + encodeURIComponent(publicityId) + '/reject', JSON.stringify(input), lock.ifMatch, false);
 }
 async withdraw(publicityId: string, input: ReasonRequest, lock: ConcurrencyHeaders): Promise<void> {
  await this.transport.requestVoid('DELETE', '/manage/publicity/' + encodeURIComponent(publicityId) + '', JSON.stringify(input), lock.ifMatch, false);
 }
 async listPending(page: PageQuery): Promise<PublicityPage> {
  return this.transport.request<PublicityPage>('GET', '/manage/review/publicity/pending' + pageQueryQuery(page), null, null, false);
 }
}

export class HttpFavoriteRepository implements FavoriteRepository {
 private transport: HttpTransport;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async listMine(page: PageQuery): Promise<FavoritePage> {
  return this.transport.request<FavoritePage>('GET', '/favorites' + pageQueryQuery(page), null, null, false);
 }
 async add(input: CreateFavoriteRequest): Promise<Favorite> {
  return this.transport.request<Favorite>('POST', '/favorites', JSON.stringify(input), null, false);
 }
 async remove(contestId: string): Promise<void> {
  await this.transport.requestVoid('DELETE', '/favorites/' + encodeURIComponent(contestId) + '', null, null, false);
 }
}

export class HttpFeedbackRepository implements FeedbackRepository {
 private transport: HttpTransport;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async create(input: CreateFeedbackRequest): Promise<Feedback> {
  return this.transport.request<Feedback>('POST', '/feedback', JSON.stringify(input), null, false);
 }
 async listMine(page: PageQuery): Promise<FeedbackPage> {
  return this.transport.request<FeedbackPage>('GET', '/feedback/mine' + pageQueryQuery(page), null, null, false);
 }
 async listManaged(filter: FeedbackFilter): Promise<FeedbackPage> {
  return this.transport.request<FeedbackPage>('GET', '/manage/feedback' + feedbackFilterQuery(filter), null, null, false);
 }
 async handle(feedbackId: string, input: HandleFeedbackRequest): Promise<Feedback> {
  return this.transport.request<Feedback>('PATCH', '/manage/feedback/' + encodeURIComponent(feedbackId) + '/handle', JSON.stringify(input), null, false);
 }
}
