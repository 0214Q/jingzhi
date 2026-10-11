import { Completeness, Role, VersionStatus, ContestStatus, ChangeType, Category, ScopeType, EntryType, CreditApplicable } from './contracts';
import type { CreateDraftRequest, ApproveReviewRequest, ContestSummary, ApiResponse, LoginResult } from './contracts';
const draft: CreateDraftRequest = { name: '演示赛事（非真实通知）', changeType: ChangeType.Value1, reason: '首录', entryType: EntryType.Value0 };
const review: ApproveReviewRequest = { versionId: 'v2', etag: 'e2' };
const summary: ContestSummary = { contestId: 'DEMO', name: '演示', category: Category.Value0, scopeType: ScopeType.Value0, contestStatus: ContestStatus.Value1, regEnd: '2026-10-20', regEndHasTime: false, organizationName: '演示单位', applicableScope: { colleges: [], majors: [], grades: [], degrees: [], campuses: [], applicableNote: '以原通知为准' }, completeness: Completeness.Value1, level: null };
const response: ApiResponse<LoginResult> = { code: 401, message: '未登录' };
// @ts-expect-error 客户端草稿不得注入学校
const invalidSchool: CreateDraftRequest = { schoolId: 'OTHER', reason: 'x', changeType: ChangeType.Value1 };
// @ts-expect-error 不得把审核状态放到赛事状态
const invalidStatus: ContestStatus = VersionStatus.Value1;
// @ts-expect-error 未知角色不可加入
const invalidRole: Role = '超级管理员';
// @ts-expect-error 第二课堂状态必须统一枚举
const invalidCredit: CreditApplicable = '保证加分';
void [draft, review, summary, response, invalidSchool, invalidStatus, invalidRole, invalidCredit];
