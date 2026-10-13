/** 自动生成。仅编辑 shared/contracts.schema.json，然后运行同步脚本。 */
export enum Role {
  Value0 = "学生",
  Value1 = "信息整理人员",
  Value2 = "主办方",
  Value3 = "管理员",
}

export enum VersionStatus {
  Value0 = "草稿",
  Value1 = "待审核",
  Value2 = "已发布",
  Value3 = "驳回",
}

export enum ContestStatus {
  Value0 = "未开始",
  Value1 = "报名中",
  Value2 = "报名截止",
  Value3 = "比赛中",
  Value4 = "评审中",
  Value5 = "公示中",
  Value6 = "已结束",
}

export enum ChangeType {
  Value0 = "原通知变更",
  Value1 = "平台纠错",
}

export enum Category {
  Value0 = "学科竞赛",
  Value1 = "创新创业",
  Value2 = "文体活动",
  Value3 = "技能竞赛",
  Value4 = "综合",
}

export enum ScopeType {
  Value0 = "校内赛事",
  Value1 = "校内选拔赛",
  Value2 = "面向河大学生的校外赛事",
}

export enum EntryType {
  Value0 = "团队整理",
  Value1 = "主办方填报",
}

export enum Completeness {
  Value0 = "完整",
  Value1 = "待补充",
}

export enum ContestLevel {
  Value0 = "校赛",
  Value1 = "省赛",
  Value2 = "国赛",
  Value3 = "国际赛",
}

export enum CreditApplicable {
  Value0 = "是",
  Value1 = "否",
  Value2 = "待确认",
}

export enum Visibility {
  Value0 = "public",
  Value1 = "internal",
}

export enum FeedbackStatus {
  Value0 = "待处理",
  Value1 = "处理中",
  Value2 = "已处理",
  Value3 = "已驳回",
}

export enum PublicityType {
  Value0 = "获奖名单",
  Value1 = "评审办法",
  Value2 = "评分标准",
}

export enum NotificationType {
  Value0 = "新发布",
  Value1 = "即将截止",
  Value2 = "公示",
  Value3 = "反馈处理",
}

export enum MonthMode {
  Value0 = "reg",
  Value1 = "contest",
}

export enum ReviewResult {
  Value0 = "通过",
  Value1 = "驳回",
}

export enum ImportState {
  Value0 = "已上传",
  Value1 = "已校验",
  Value2 = "已预览",
  Value3 = "已提交",
  Value4 = "失败",
}

export enum PublicVisibility {
  Value0 = "public",
}

export enum TakedownScope {
  Value0 = "全部",
  Value1 = "仅公示",
}

export enum CampusRole {
  Value0 = "平台管理员",
  Value1 = "校级管理员",
  Value2 = "学院负责人",
}

export enum CampusStatus {
  Value0 = "启用",
  Value1 = "停用",
}

export enum CampusCapability {
  Value0 = "管理高校",
  Value1 = "管理学院",
  Value2 = "管理负责人",
  Value3 = "分配赛事",
  Value4 = "查看维护赛事",
  Value5 = "编辑赛事草稿",
  Value6 = "提交赛事审核",
  Value7 = "审核赛事",
  Value8 = "下架赛事",
  Value9 = "处理赛事反馈",
  Value10 = "管理校级管理员",
  Value11 = "管理平台管理员",
}

export enum CampusAuditAction {
  Value0 = "创建高校",
  Value1 = "修改高校",
  Value2 = "创建学院",
  Value3 = "修改学院",
  Value4 = "授权成员",
  Value5 = "修改成员",
  Value6 = "分配赛事",
}

export enum StudentSchoolState {
  Value0 = "默认所属高校",
  Value1 = "已选择高校",
  Value2 = "需重新选择",
}

export interface ApplicableScope {
  colleges: string[];
  majors: string[];
  grades: string[];
  degrees: string[];
  campuses: string[];
  applicableNote: string;
}

export interface ContestPayload {
  name: string;
  category: Category;
  scopeType: ScopeType;
  edition: string | null;
  level: ContestLevel | null;
  applicableScope: ApplicableScope;
  entryType: EntryType;
  sourceTitle: string | null;
  sourceOrg: string | null;
  sourceUrl: string | null;
  sourcePublishedAt: string | null;
  collectedAt: string;
  lastVerifiedAt: string;
  completeness: Completeness;
  regStart: string | null;
  regEnd: string | null;
  contestStart: string | null;
  contestEnd: string | null;
  publicityTime: string | null;
  contestRequirement: string | null;
  reviewRules: string | null;
  awardSetting: string | null;
  material: string | null;
  entryMethod: string;
  contact: string | null;
  description: string | null;
  creditApplicable: CreditApplicable;
  creditBasis: string | null;
  creditNote: string | null;
  organizationId: string;
  attachmentIds: string[];
  schedule?: ContestScheduleItem[];
}

export interface Takedown {
  reason: string;
  at: string;
  by: string;
}

export interface Contest {
  contestId: string;
  schoolId: string;
  publishedVersionId: string | null;
  contestStatus: ContestStatus;
  takedown: Takedown | null;
  createdBy: string;
  updatedAt: string;
}

export interface ContestVersion {
  versionId: string;
  contestId: string;
  versionNo: number;
  status: VersionStatus;
  etag: string;
  isCurrent: boolean;
  payload: ContestPayload;
  operator: string;
  operatorRole: Role;
  entryType: EntryType;
  changeType: ChangeType | null;
  reason: string;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  contestId: string;
  versionId: string;
  operator: string;
  time: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  changeType: ChangeType;
  visibility: Visibility;
}

export interface Publicity {
  id: string;
  contestId: string;
  type: PublicityType;
  reviewStatus: VersionStatus;
  versionNo: number;
  content: string | PublicityContent;
  operator: string;
  etag: string;
  reason: string;
  reviewNote: string | null;
  publishedAt: string | null;
}

export interface Attachment {
  id: string;
  contestId: string;
  type: string;
  name: string;
  url: string;
  uploader: string;
  time: string;
}

export interface Favorite {
  userId: string;
  contestId: string;
  createdAt: string;
  available: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  link: string;
  createdAt: string;
}

export interface NotificationSetting {
  userId: string;
  subscribedCategories: Category[];
  enabledTypes: NotificationType[];
  pushEnabled: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  contestId: string | null;
  type: string;
  desc: string;
  status: FeedbackStatus;
  handler: string | null;
  note: string | null;
  time: string;
  schoolId?: string;
}

export interface User {
  id: string;
  role: Role;
  schoolId: string;
  openid: string | null;
  subscribes: Category[];
  devices: string[];
}

export interface Organization {
  id: string;
  schoolId: string;
  name: string;
  type: string;
  contact: string | null;
  intro: string | null;
  owners: string[];
}

export interface School {
  id: string;
  name: string;
  config: SchoolConfig;
}

export interface ImportError {
  row: number;
  field: string;
  msg: string;
}

export interface ReviewRecord {
  id: string;
  contestId: string;
  versionId: string;
  reviewer: string;
  time: string;
  result: ReviewResult;
  rejectReason: string | null;
}

export interface SchoolConfig {
  title: string;
  primaryColor: string;
  defaultApplicableNote: string;
}

export interface SourceBlock {
  sourceTitle: string | null;
  sourceOrg: string | null;
  sourceUrl: string | null;
  sourcePublishedAt: string | null;
  collectedAt: string;
  lastVerifiedAt: string;
}

export interface Winner {
  name: string;
  award: string;
  workTitle: string | null;
  organizationName: string | null;
}

export interface PublicityContent {
  text: string | null;
  winners: Winner[];
}

export interface PublishedPublicity {
  id: string;
  contestId: string;
  type: PublicityType;
  versionNo: number;
  content: string | PublicityContent;
  publishedAt: string;
}

export interface CurrentPublicity {
  winners: Winner[];
  rule: string | null;
  standard: string | null;
}

export interface PublicityResult {
  current: CurrentPublicity | null;
  history: PublishedPublicity[];
}

export interface PublicAuditLog {
  id: string;
  contestId: string;
  versionId: string;
  operator: string;
  time: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  changeType: ChangeType;
  visibility: PublicVisibility;
}

export interface ContestSummary {
  contestId: string;
  name: string;
  category: Category;
  scopeType: ScopeType;
  contestStatus: ContestStatus;
  regEnd: string | null;
  regEndHasTime: boolean;
  organizationName: string;
  applicableScope: ApplicableScope;
  completeness: Completeness;
  level: ContestLevel | null;
  edition?: string | null;
  scheduleCaption?: string | null;
}

export interface PublicContest {
  contestId: string;
  schoolId: string;
  publishedVersionId: string;
  contestStatus: ContestStatus;
  takedown: Takedown | null;
  data: ContestPayload;
  source: SourceBlock;
  publicity: PublicityResult;
  auditLogs: PublicAuditLog[];
  completeness: Completeness;
  incompleteFields: string[];
  regEndHasTime: boolean;
  organizationName: string;
  updatedAt: string;
}

export interface ManagedContest {
  contest: Contest;
  workingVersion: ContestVersion | null;
  publishedVersion: ContestVersion | null;
}

export interface ContestFilter extends PageQuery {
  keyword?: string;
  category?: Category;
  scopeType?: ScopeType;
  entryType?: EntryType;
  contestStatus?: ContestStatus;
  year?: number;
  month?: string;
  monthMode?: MonthMode;
  page?: number;
  pageSize?: number;
  sort?: string;
  datedOnly?: boolean;
}

export interface LoginRequest {
  account?: string;
  password?: string;
  agcToken?: string;
}

export interface LoginResult {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

export interface CreateDraftRequest {
  name?: string;
  category?: Category;
  scopeType?: ScopeType;
  edition?: string | null;
  level?: ContestLevel | null;
  applicableScope?: ApplicableScope;
  entryType?: EntryType;
  sourceTitle?: string | null;
  sourceOrg?: string | null;
  sourceUrl?: string | null;
  sourcePublishedAt?: string | null;
  collectedAt?: string;
  lastVerifiedAt?: string;
  completeness?: Completeness;
  regStart?: string | null;
  regEnd?: string | null;
  contestStart?: string | null;
  contestEnd?: string | null;
  publicityTime?: string | null;
  contestRequirement?: string | null;
  reviewRules?: string | null;
  awardSetting?: string | null;
  material?: string | null;
  entryMethod?: string;
  contact?: string | null;
  description?: string | null;
  creditApplicable?: CreditApplicable;
  creditBasis?: string | null;
  creditNote?: string | null;
  organizationId?: string;
  attachmentIds?: string[];
  changeType: ChangeType;
  reason: string;
  schedule?: ContestScheduleItem[];
}

export interface UpdateDraftRequest extends CreateDraftRequest {
  name?: string;
  category?: Category;
  scopeType?: ScopeType;
  edition?: string | null;
  level?: ContestLevel | null;
  applicableScope?: ApplicableScope;
  entryType?: EntryType;
  sourceTitle?: string | null;
  sourceOrg?: string | null;
  sourceUrl?: string | null;
  sourcePublishedAt?: string | null;
  collectedAt?: string;
  lastVerifiedAt?: string;
  completeness?: Completeness;
  regStart?: string | null;
  regEnd?: string | null;
  contestStart?: string | null;
  contestEnd?: string | null;
  publicityTime?: string | null;
  contestRequirement?: string | null;
  reviewRules?: string | null;
  awardSetting?: string | null;
  material?: string | null;
  entryMethod?: string;
  contact?: string | null;
  description?: string | null;
  creditApplicable?: CreditApplicable;
  creditBasis?: string | null;
  creditNote?: string | null;
  organizationId?: string;
  attachmentIds?: string[];
  changeType: ChangeType;
  reason: string;
  schedule?: ContestScheduleItem[];
}

export interface DraftResult {
  contestId: string;
  versionId: string;
  versionNo: number;
  status: VersionStatus;
  etag: string;
}

export interface SubmitReviewResult {
  versionId: string;
  status: VersionStatus;
}

export interface DeriveVersionRequest {
  changeType: ChangeType;
  reason: string;
}

export interface ApproveReviewRequest {
  versionId: string;
  etag: string;
}

export interface RejectReviewRequest {
  versionId: string;
  etag: string;
  rejectReason: string;
}

export interface ApproveReviewResult {
  publishedVersionId: string;
  contestStatus: ContestStatus;
  previousVersionId: string | null;
  previousIsCurrent: boolean;
}

export interface RejectReviewResult {
  versionId: string;
  status: VersionStatus;
  publishedVersionId: string | null;
}

export interface ConcurrencyHeaders {
  ifMatch: string;
}

export interface CreatePublicityRequest {
  contestId: string;
  type: PublicityType;
  content: string | PublicityContent;
  reason: string;
}

export interface CreateFeedbackRequest {
  contestId: string | null;
  type: string;
  desc: string;
}

export interface CreateFavoriteRequest {
  contestId: string;
}

export interface RegisterDeviceRequest {
  deviceToken: string;
  platform: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface FieldDifference {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface ImportDuplicate {
  row: number;
  contestId: string;
  name: string;
  differences: FieldDifference[];
}

export interface ImportTask {
  taskId: string;
  ownerId: string;
  schoolId: string;
  state: ImportState;
  rowCount: number;
  contentFrozen: boolean;
  errors: ImportError[];
  createdAt: string;
  submittedAt: string | null;
}

export interface ImportUploadResult {
  taskId: string;
  rows: number;
  errors: ImportError[];
}

export interface ImportPreviewResult {
  taskId: string;
  add: number;
  skip: number;
  duplicates: ImportDuplicate[];
}

export interface ImportSubmitResult {
  taskId: string;
  imported: number;
}

export interface ImportReportRow {
  row: number;
  contestId: string | null;
  success: boolean;
  message: string;
}

export interface ImportReport {
  taskId: string;
  rows: ImportReportRow[];
}

export interface ApiErrorData {
  fieldErrors?: Record<string, string>;
  currentEtag?: string;
  differences?: FieldDifference[];
}

export interface ContestPage {
  list: ContestSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VersionPage {
  list: ContestVersion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FeedbackPage {
  list: Feedback[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationPage {
  list: Notification[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface ManagedContestPage {
  list: ManagedContest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PendingReviewItem {
  contestId: string;
  name: string;
  organizationName: string;
  versionId: string;
  etag: string;
  submittedAt: string;
  incompleteFields: string[];
}

export interface PendingReviewPage {
  list: PendingReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReasonRequest {
  reason: string;
}

export interface RejectReasonRequest {
  rejectReason: string;
}

export interface UpdatePublicityRequest {
  content: string | PublicityContent;
  reason: string;
}

export interface FavoritePage {
  list: Favorite[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FeedbackFilter extends PageQuery {
  status?: FeedbackStatus;
  page?: number;
  pageSize?: number;
}

export interface HandleFeedbackRequest {
  status: FeedbackStatus;
  note: string;
}

export interface NotificationFilter {
  type?: NotificationType;
  page?: number;
  pageSize?: number;
}

export interface UpdateNotificationSettings {
  subscribedCategories: Category[];
  enabledTypes: NotificationType[];
  pushEnabled: boolean;
}

export interface UploadFile {
  name: string;
  mimeType: string;
  bytes: ArrayBuffer;
}

export interface FileResource {
  name: string;
  mimeType: string;
  bytes: ArrayBuffer;
}

export interface TakedownRequest {
  reason: string;
  scope: TakedownScope;
}

export interface PublicityPage {
  list: Publicity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampusSchool {
  id: string;
  name: string;
  code: string;
  status: CampusStatus;
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampusCollege {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  status: CampusStatus;
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampusMember {
  id: string;
  userId: string;
  schoolId: string | null;
  collegeId: string | null;
  role: CampusRole;
  displayName: string;
  duty: string | null;
  status: CampusStatus;
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContestMaintenance {
  contestId: string;
  schoolId: string;
  collegeId: string;
  responsibleMemberId: string;
  etag: string;
  assignedBy: string;
  assignedAt: string;
}

export interface CampusActor {
  userId: string;
  accountSchoolId: string;
}

export interface CampusPermissionTarget {
  schoolId: string | null;
  collegeId: string | null;
  contestId: string | null;
}

export interface CampusPermissionDecision {
  allowed: boolean;
  reason: string;
}

export interface CampusPermissionSnapshot {
  schools: CampusSchool[];
  colleges: CampusCollege[];
  members: CampusMember[];
  maintenance: ContestMaintenance[];
}

export interface CampusFilter {
  schoolId?: string;
  collegeId?: string;
  keyword?: string;
  status?: CampusStatus;
  page?: number;
  pageSize?: number;
}

export interface CampusSchoolPage {
  list: CampusSchool[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampusCollegePage {
  list: CampusCollege[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampusMemberPage {
  list: CampusMember[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCampusSchoolRequest {
  name: string;
  code: string;
}

export interface UpdateCampusSchoolRequest {
  name: string;
  code: string;
  status: CampusStatus;
}

export interface CreateCampusCollegeRequest {
  schoolId: string;
  name: string;
  code: string;
}

export interface UpdateCampusCollegeRequest {
  name: string;
  code: string;
  status: CampusStatus;
}

export interface CreateCampusMemberRequest {
  userId: string;
  schoolId: string | null;
  collegeId: string | null;
  role: CampusRole;
  displayName: string;
  duty: string | null;
}

export interface UpdateCampusMemberRequest {
  displayName: string;
  duty: string | null;
  status: CampusStatus;
}

export interface AssignContestMaintenanceRequest {
  schoolId: string;
  collegeId: string;
  responsibleMemberId: string;
}

export interface CampusSchoolTree {
  school: CampusSchool;
  colleges: CampusCollegeTree[];
}

export interface CampusCollegeTree {
  college: CampusCollege;
  responsibleMembers: CampusMember[];
}

export interface CampusAssignmentLock {
  expectedEtag: string | null;
}

export interface CampusAuditLog {
  id: string;
  actorUserId: string;
  schoolId: string | null;
  collegeId: string | null;
  entityId: string;
  action: CampusAuditAction;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
}

export interface CampusSession {
  userId: string;
  schoolId: string;
  members: CampusMember[];
  schools: CampusSchool[];
}

export interface CampusAccountSummary {
  id: string;
  schoolId: string;
}

export interface CampusAccountPage {
  list: CampusAccountSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCampusAccountRequest {
  account: string;
  password: string;
  schoolId: string;
}

export interface CampusMaintenanceItem {
  contestId: string;
  schoolId: string;
  name: string;
  publishedVersionId: string | null;
  takedown: boolean;
  maintenance: ContestMaintenance | null;
}

export interface CampusMaintenancePage {
  list: CampusMaintenanceItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampusMaintenanceResult {
  maintenance: ContestMaintenance | null;
}

export interface StudentSchool {
  id: string;
  name: string;
  code: string;
  status: CampusStatus;
}

export interface StudentSchoolQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentSchoolPage {
  list: StudentSchool[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StudentSchoolContext {
  homeSchoolId: string;
  homeSchool: StudentSchool | null;
  selectedSchoolId: string | null;
  selectedSchool: StudentSchool | null;
  state: StudentSchoolState;
  etag: string;
}

export interface SelectStudentSchoolRequest {
  schoolId: string;
  expectedEtag: string;
}

export interface ContestScheduleItem {
  stage: string;
  value: string;
  sourceUrl: string;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T | null;
  traceId?: string;
}
