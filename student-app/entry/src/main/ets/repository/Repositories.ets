/** 自动生成：只修改 shared/repositories.schema.json。 */
import { ApproveReviewRequest, ApproveReviewResult, Attachment, AuditLog, ChangeType, ConcurrencyHeaders, Contest, ContestFilter, ContestPage, ContestVersion, CreateDraftRequest, CreateFavoriteRequest, CreateFeedbackRequest, CreatePublicityRequest, DeriveVersionRequest, DraftResult, Favorite, FavoritePage, Feedback, FeedbackFilter, FeedbackPage, FileResource, HandleFeedbackRequest, ImportPreviewResult, ImportReport, ImportSubmitResult, ImportUploadResult, LoginRequest, LoginResult, ManagedContest, ManagedContestPage, NotificationFilter, NotificationPage, NotificationSetting, PageQuery, PendingReviewPage, PublicAuditLog, PublicContest, Publicity, PublicityPage, PublicityResult, ReasonRequest, RegisterDeviceRequest, RejectReasonRequest, RejectReviewRequest, RejectReviewResult, SubmitReviewResult, TakedownRequest, UpdateDraftRequest, UpdateNotificationSettings, UpdatePublicityRequest, UploadFile, User, VersionPage } from '../models/Contracts';

export interface AuthRepository {
  /** POST /auth/login */
  login(input: LoginRequest): Promise<LoginResult>;
  /** POST /auth/logout */
  logout(): Promise<void>;
  /** GET /auth/me */
  getCurrentUser(): Promise<User>;
}

export interface ContestRepository {
  /** GET /contests */
  listPublished(filter: ContestFilter): Promise<ContestPage>;
  /** GET /contests/:id */
  getPublicVersion(contestId: string): Promise<PublicContest>;
  /** GET /contests/:id/audit-logs */
  getPublicAuditLog(contestId: string, changeType?: ChangeType): Promise<PublicAuditLog[]>;
  /** GET /contests/:id/publicity */
  getPublicity(contestId: string): Promise<PublicityResult>;
  /** GET /contests/months */
  getMonths(filter: ContestFilter): Promise<string[]>;
  /** GET /manage/contests */
  listManaged(filter: ContestFilter): Promise<ManagedContestPage>;
  /** GET /manage/contests/:id */
  getManaged(contestId: string): Promise<ManagedContest>;
  /** POST /manage/contests */
  createDraft(input: CreateDraftRequest): Promise<DraftResult>;
  /** PUT /manage/contests/:id/versions/:vid */
  updateDraft(contestId: string, versionId: string, input: UpdateDraftRequest, lock: ConcurrencyHeaders): Promise<DraftResult>;
  /** POST /manage/contests/:id/versions */
  deriveVersion(contestId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders): Promise<DraftResult>;
  /** POST /manage/contests/:id/versions/:vid/submit */
  submitReview(contestId: string, versionId: string, lock: ConcurrencyHeaders): Promise<SubmitReviewResult>;
  /** POST /manage/review/:id/approve */
  reviewApprove(contestId: string, input: ApproveReviewRequest): Promise<ApproveReviewResult>;
  /** POST /manage/review/:id/reject */
  reviewReject(contestId: string, input: RejectReviewRequest): Promise<RejectReviewResult>;
  /** GET /manage/review/pending */
  listPending(filter: ContestFilter): Promise<PendingReviewPage>;
  /** GET /manage/contests/:id/versions */
  listVersions(contestId: string, page: PageQuery): Promise<VersionPage>;
  /** GET /manage/contests/:id/versions/:vid */
  getVersion(contestId: string, versionId: string): Promise<ContestVersion>;
  /** GET /manage/contests/:id/audit-logs */
  getInternalAuditLog(contestId: string, changeType?: ChangeType): Promise<AuditLog[]>;
  /** POST /manage/contests/:id/versions/:vid/restore */
  restoreVersion(contestId: string, versionId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders): Promise<DraftResult>;
  /** POST /manage/contests/:id/takedown */
  takedown(contestId: string, input: TakedownRequest): Promise<Contest>;
  /** POST /manage/contests/:id/restore */
  restorePublication(contestId: string): Promise<Contest>;
}

export interface PublicityRepository {
  /** POST /manage/publicity */
  create(input: CreatePublicityRequest): Promise<Publicity>;
  /** PUT /manage/publicity/:id */
  update(publicityId: string, input: UpdatePublicityRequest, lock: ConcurrencyHeaders): Promise<Publicity>;
  /** POST /manage/publicity/:id/submit */
  submitReview(publicityId: string, lock: ConcurrencyHeaders): Promise<Publicity>;
  /** POST /manage/review/publicity/:id/approve */
  reviewApprove(publicityId: string, lock: ConcurrencyHeaders): Promise<Publicity>;
  /** POST /manage/review/publicity/:id/reject */
  reviewReject(publicityId: string, input: RejectReasonRequest, lock: ConcurrencyHeaders): Promise<Publicity>;
  /** DELETE /manage/publicity/:id */
  withdraw(publicityId: string, input: ReasonRequest, lock: ConcurrencyHeaders): Promise<void>;
  /** GET /manage/review/publicity/pending */
  listPending(page: PageQuery): Promise<PublicityPage>;
}

export interface FavoriteRepository {
  /** GET /favorites */
  listMine(page: PageQuery): Promise<FavoritePage>;
  /** POST /favorites */
  add(input: CreateFavoriteRequest): Promise<Favorite>;
  /** DELETE /favorites/:contestId */
  remove(contestId: string): Promise<void>;
}

export interface FeedbackRepository {
  /** POST /feedback */
  create(input: CreateFeedbackRequest): Promise<Feedback>;
  /** GET /feedback/mine */
  listMine(page: PageQuery): Promise<FeedbackPage>;
  /** GET /manage/feedback */
  listManaged(filter: FeedbackFilter): Promise<FeedbackPage>;
  /** PATCH /manage/feedback/:id/handle */
  handle(feedbackId: string, input: HandleFeedbackRequest): Promise<Feedback>;
}

export interface NotificationRepository {
  /** GET /notifications */
  listMine(filter: NotificationFilter): Promise<NotificationPage>;
  /** PATCH /notifications/:id/read */
  markRead(notificationId: string): Promise<void>;
  /** GET /user/notification-settings */
  getSettings(): Promise<NotificationSetting>;
  /** PATCH /user/notification-settings */
  updateSettings(input: UpdateNotificationSettings): Promise<NotificationSetting>;
  /** POST /user/devices */
  registerDevice(input: RegisterDeviceRequest): Promise<void>;
  /** POST /notifications/push-test (dev/test only) */
  pushTest(): Promise<void>;
}

export interface ImportRepository {
  /** GET /manage/import/template */
  downloadTemplate(): Promise<FileResource>;
  /** POST /manage/import/upload */
  upload(input: UploadFile): Promise<ImportUploadResult>;
  /** POST /manage/import/preview?taskId */
  preview(taskId: string): Promise<ImportPreviewResult>;
  /** POST /manage/import/submit?taskId */
  submit(taskId: string): Promise<ImportSubmitResult>;
  /** GET /manage/import/:taskId/report */
  getReport(taskId: string): Promise<ImportReport>;
}

export interface AttachmentRepository {
  /** POST /manage/attachments */
  upload(contestId: string | null, type: string, input: UploadFile): Promise<Attachment>;
  /** GET /manage/attachments/:id */
  get(attachmentId: string): Promise<Attachment>;
  /** DELETE /manage/attachments/:id */
  remove(attachmentId: string): Promise<void>;
}
