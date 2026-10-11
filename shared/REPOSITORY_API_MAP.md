# Repository 方法与接口映射

| 分组 | 方法 | 返回类型 | HTTP 接口 |
|---|---|---|---|
| AuthRepository | `login(input: LoginRequest)` | `LoginResult` | `POST /auth/login` |
| AuthRepository | `logout()` | `void` | `POST /auth/logout` |
| AuthRepository | `getCurrentUser()` | `User` | `GET /auth/me` |
| ContestRepository | `listPublished(filter: ContestFilter)` | `ContestPage` | `GET /contests` |
| ContestRepository | `getPublicVersion(contestId: string)` | `PublicContest` | `GET /contests/:id` |
| ContestRepository | `getPublicAuditLog(contestId: string, changeType?: ChangeType)` | `PublicAuditLog[]` | `GET /contests/:id/audit-logs` |
| ContestRepository | `getPublicity(contestId: string)` | `PublicityResult` | `GET /contests/:id/publicity` |
| ContestRepository | `getMonths(filter: ContestFilter)` | `string[]` | `GET /contests/months` |
| ContestRepository | `listManaged(filter: ContestFilter)` | `ManagedContestPage` | `GET /manage/contests` |
| ContestRepository | `getManaged(contestId: string)` | `ManagedContest` | `GET /manage/contests/:id` |
| ContestRepository | `createDraft(input: CreateDraftRequest)` | `DraftResult` | `POST /manage/contests` |
| ContestRepository | `updateDraft(contestId: string, versionId: string, input: UpdateDraftRequest, lock: ConcurrencyHeaders)` | `DraftResult` | `PUT /manage/contests/:id/versions/:vid` |
| ContestRepository | `deriveVersion(contestId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders)` | `DraftResult` | `POST /manage/contests/:id/versions` |
| ContestRepository | `submitReview(contestId: string, versionId: string, lock: ConcurrencyHeaders)` | `SubmitReviewResult` | `POST /manage/contests/:id/versions/:vid/submit` |
| ContestRepository | `reviewApprove(contestId: string, input: ApproveReviewRequest)` | `ApproveReviewResult` | `POST /manage/review/:id/approve` |
| ContestRepository | `reviewReject(contestId: string, input: RejectReviewRequest)` | `RejectReviewResult` | `POST /manage/review/:id/reject` |
| ContestRepository | `listPending(filter: ContestFilter)` | `PendingReviewPage` | `GET /manage/review/pending` |
| ContestRepository | `listVersions(contestId: string, page: PageQuery)` | `VersionPage` | `GET /manage/contests/:id/versions` |
| ContestRepository | `getVersion(contestId: string, versionId: string)` | `ContestVersion` | `GET /manage/contests/:id/versions/:vid` |
| ContestRepository | `getInternalAuditLog(contestId: string, changeType?: ChangeType)` | `AuditLog[]` | `GET /manage/contests/:id/audit-logs` |
| ContestRepository | `restoreVersion(contestId: string, versionId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders)` | `DraftResult` | `POST /manage/contests/:id/versions/:vid/restore` |
| ContestRepository | `takedown(contestId: string, input: TakedownRequest)` | `Contest` | `POST /manage/contests/:id/takedown` |
| ContestRepository | `restorePublication(contestId: string)` | `Contest` | `POST /manage/contests/:id/restore` |
| PublicityRepository | `create(input: CreatePublicityRequest)` | `Publicity` | `POST /manage/publicity` |
| PublicityRepository | `update(publicityId: string, input: UpdatePublicityRequest, lock: ConcurrencyHeaders)` | `Publicity` | `PUT /manage/publicity/:id` |
| PublicityRepository | `submitReview(publicityId: string, lock: ConcurrencyHeaders)` | `Publicity` | `POST /manage/publicity/:id/submit` |
| PublicityRepository | `reviewApprove(publicityId: string, lock: ConcurrencyHeaders)` | `Publicity` | `POST /manage/review/publicity/:id/approve` |
| PublicityRepository | `reviewReject(publicityId: string, input: RejectReasonRequest, lock: ConcurrencyHeaders)` | `Publicity` | `POST /manage/review/publicity/:id/reject` |
| PublicityRepository | `withdraw(publicityId: string, input: ReasonRequest, lock: ConcurrencyHeaders)` | `void` | `DELETE /manage/publicity/:id` |
| FavoriteRepository | `listMine(page: PageQuery)` | `FavoritePage` | `GET /favorites` |
| FavoriteRepository | `add(input: CreateFavoriteRequest)` | `Favorite` | `POST /favorites` |
| FavoriteRepository | `remove(contestId: string)` | `void` | `DELETE /favorites/:contestId` |
| FeedbackRepository | `create(input: CreateFeedbackRequest)` | `Feedback` | `POST /feedback` |
| FeedbackRepository | `listMine(page: PageQuery)` | `FeedbackPage` | `GET /feedback/mine` |
| FeedbackRepository | `listManaged(filter: FeedbackFilter)` | `FeedbackPage` | `GET /manage/feedback` |
| FeedbackRepository | `handle(feedbackId: string, input: HandleFeedbackRequest)` | `Feedback` | `PATCH /manage/feedback/:id/handle` |
| NotificationRepository | `listMine(filter: NotificationFilter)` | `NotificationPage` | `GET /notifications` |
| NotificationRepository | `markRead(notificationId: string)` | `void` | `PATCH /notifications/:id/read` |
| NotificationRepository | `getSettings()` | `NotificationSetting` | `GET /user/notification-settings` |
| NotificationRepository | `updateSettings(input: UpdateNotificationSettings)` | `NotificationSetting` | `PATCH /user/notification-settings` |
| NotificationRepository | `registerDevice(input: RegisterDeviceRequest)` | `void` | `POST /user/devices` |
| NotificationRepository | `pushTest()` | `void` | `POST /notifications/push-test (dev/test only)` |
| ImportRepository | `downloadTemplate()` | `FileResource` | `GET /manage/import/template` |
| ImportRepository | `upload(input: UploadFile)` | `ImportUploadResult` | `POST /manage/import/upload` |
| ImportRepository | `preview(taskId: string)` | `ImportPreviewResult` | `POST /manage/import/preview?taskId` |
| ImportRepository | `submit(taskId: string)` | `ImportSubmitResult` | `POST /manage/import/submit?taskId` |
| ImportRepository | `getReport(taskId: string)` | `ImportReport` | `GET /manage/import/:taskId/report` |
| AttachmentRepository | `upload(contestId: string | null, type: string, input: UploadFile)` | `Attachment` | `POST /manage/attachments` |
| AttachmentRepository | `get(attachmentId: string)` | `Attachment` | `GET /manage/attachments/:id` |
| AttachmentRepository | `remove(attachmentId: string)` | `void` | `DELETE /manage/attachments/:id` |

本次接口扩展：PublicityRepository.listPending(page: PageQuery) → PublicityPage，对应 GET /manage/review/publicity/pending；仅管理员读取本校待审公示。详见INTERACTION_REVIEW_GUIDE.md。
