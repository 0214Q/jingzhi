import { ContestPayload, CreateDraftRequest, Category, ScopeType, EntryType, Completeness, CreditApplicable, ContestStatus, ContestLevel, Role, User, Contest, ContestVersion, Organization } from './contracts';
import { MockStore, MockContext, copy } from './MockStore';
import { RepositoryError } from './RepositoryError';
export function actor(context: MockContext): User {
  if (!context.user || context.expiresAt <= Date.now()) throw new RepositoryError(401, '请先登录演示账号');
  return context.user;
}
export function admin(context: MockContext): User {
  const user = actor(context);
  if (user.role !== Role.Value3) throw new RepositoryError(403, '仅管理员可以审核');
  return user;
}
export function root(store: MockStore, context: MockContext, id: string): Contest {
  const user = actor(context);
  const item = store.contests.find((c: Contest) => c.contestId === id && c.schoolId === user.schoolId);
  if (!item) throw new RepositoryError(403, '无权访问该资源');
  return item;
}
export function owned(store: MockStore, context: MockContext, id: string): Contest {
  const user = actor(context); const c = root(store, context, id);
  const first = store.versions.find((v: ContestVersion) => v.contestId === id);
  const org = store.organizations.find((o: Organization) => o.id === first?.payload.organizationId && o.schoolId === user.schoolId);
  if (user.role === Role.Value3 || (user.role === Role.Value1 && c.createdBy === user.id && first?.entryType === EntryType.Value0) || (user.role === Role.Value2 && org?.owners.includes(user.id))) return c;
  throw new RepositoryError(403, '无权访问该资源');
}
export function canWrite(store: MockStore, context: MockContext, p: ContestPayload): void {
  const user = actor(context);
  if (user.role === Role.Value0) throw new RepositoryError(403, '学生不能写入赛事');
  if (user.role === Role.Value1 && p.entryType !== EntryType.Value0) throw new RepositoryError(403, '整理人员只能团队整理');
  if (user.role === Role.Value2 && p.entryType !== EntryType.Value1) throw new RepositoryError(403, '主办方只能主动填报');
  if (p.organizationId) {
    const org = store.organizations.find((o: Organization) => o.id === p.organizationId && o.schoolId === user.schoolId);
    if (!org || (user.role === Role.Value2 && !org.owners.includes(user.id))) throw new RepositoryError(403, '无权使用该组织');
  }
}
export function blankPayload(input: CreateDraftRequest): ContestPayload {
  return { name: '', category: Category.Value4, scopeType: ScopeType.Value0, edition: null, level: null,
    applicableScope: { colleges: [], majors: [], grades: [], degrees: [], campuses: [], applicableNote: '以原通知为准' },
    entryType: EntryType.Value0, sourceTitle: null, sourceOrg: null, sourceUrl: null, sourcePublishedAt: null, collectedAt: '', lastVerifiedAt: '', completeness: Completeness.Value1,
    regStart: null, regEnd: null, contestStart: null, contestEnd: null, publicityTime: null, contestRequirement: null, reviewRules: null, awardSetting: null, material: null, entryMethod: '', contact: null, description: null,
    creditApplicable: CreditApplicable.Value2, creditBasis: null, creditNote: null, organizationId: '', attachmentIds: [] };
}
export function missing(p: ContestPayload): string[] {
  const result: string[] = [];
  if (!p.regStart) result.push('regStart'); if (!p.regEnd) result.push('regEnd');
  if (!p.contestStart) result.push('contestStart'); if (!p.contestEnd) result.push('contestEnd');
  if (!p.contestRequirement) result.push('contestRequirement');
  if (!p.reviewRules) result.push('reviewRules'); if (!p.awardSetting) result.push('awardSetting');
  if (p.creditApplicable !== CreditApplicable.Value1 && !p.creditBasis) result.push('creditBasis');
  return result;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2}))?$/.test(value)) return false;
  if(value.includes('T') && (Number(value.slice(11,13))>23 || Number(value.slice(14,16))>59 || Number(value.slice(17,19))>59)) return false;
  const parts = value.slice(0, 10).split('-');
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  if (d.toISOString().slice(0, 10) !== value.slice(0, 10)) return false;
  return !value.includes('T') || Number.isFinite(Date.parse(value));
}
export function validate(p: ContestPayload, submit: boolean): void {
  const errors: Record<string, string> = {};
  if (p.level!==null && ![ContestLevel.Value0,ContestLevel.Value1,ContestLevel.Value2,ContestLevel.Value3].includes(p.level)) errors['level']='无效层级';
  if(p.reviewRules && p.reviewRules.length>4000) errors['reviewRules']='最多4000字符';
  if(p.awardSetting && p.awardSetting.length>3000) errors['awardSetting']='最多3000字符';
  if(p.contestRequirement && p.contestRequirement.length>2000) errors['contestRequirement']='最多2000字符';
  if (p.name.length > 100) errors['name'] = '最多100字符';
  if (![Category.Value0,Category.Value1,Category.Value2,Category.Value3,Category.Value4].includes(p.category)) errors['category'] = '无效分类';
  if (![ScopeType.Value0,ScopeType.Value1,ScopeType.Value2].includes(p.scopeType)) errors['scopeType'] = '无效归属';
  if (![EntryType.Value0,EntryType.Value1].includes(p.entryType)) errors['entryType'] = '无效录入主体';
  if (![CreditApplicable.Value0,CreditApplicable.Value1,CreditApplicable.Value2].includes(p.creditApplicable)) errors['creditApplicable'] = '无效第二课堂状态';
  if (p.schedule) {
    if (p.schedule.length > 30) errors['schedule'] = '日程最多30项';
    p.schedule.forEach((s) => {
      if (!s.stage.trim() || s.stage.length > 100 || !validDate(s.value) || !/^https:\/\/[^\s]+$/.test(s.sourceUrl)) errors['schedule'] = '阶段、具体日期和原通知 HTTPS 链接必填';
    });
  }
  const dates: (string | null)[] = [p.regStart,p.regEnd,p.contestStart,p.contestEnd,p.publicityTime,p.sourcePublishedAt,p.lastVerifiedAt || null,p.collectedAt || null];
  const names: string[] = ['regStart','regEnd','contestStart','contestEnd','publicityTime','sourcePublishedAt','lastVerifiedAt','collectedAt'];
  dates.forEach((v: string | null,i: number) => { if (v && !validDate(v)) errors[names[i]] = '无效日期'; });
  if (p.regStart && p.regEnd && (p.regStart.includes('T') && p.regEnd.includes('T') ? Date.parse(p.regStart)>Date.parse(p.regEnd) : p.regStart.slice(0,10)>p.regEnd.slice(0,10))) errors['regEnd'] = '截止不得早于开始';
  if (p.contestStart && p.contestEnd && p.contestStart.slice(0,10) > p.contestEnd.slice(0,10)) errors['contestEnd'] = '结束不得早于开始';
  if (p.sourceUrl && !/^https?:\/\/[^\s]+$/.test(p.sourceUrl)) errors['sourceUrl'] = '需要原通知 HTTP(S) 链接';
  if (submit) {
    if (!p.name.trim()) errors['name'] = '必填'; if (!p.organizationId) errors['organizationId'] = '必填';
    if (!p.entryMethod.trim()) errors['entryMethod'] = '必填';
    if (!p.collectedAt || !p.collectedAt.includes('T')) errors['collectedAt'] = '必填带时区时刻';
    if (!p.lastVerifiedAt) errors['lastVerifiedAt'] = '必填';
    if (p.entryType === EntryType.Value0) {
      if (!p.sourceTitle?.trim()) errors['sourceTitle'] = '团队整理必填';
      if (!p.sourceOrg?.trim()) errors['sourceOrg'] = '团队整理必填';
      if (!p.sourceUrl) errors['sourceUrl'] = '团队整理必填';
    } else {
      if (!p.regStart) errors['regStart'] = '主办方必填'; if (!p.regEnd) errors['regEnd'] = '主办方必填';
      if (!p.contestRequirement?.trim()) errors['contestRequirement'] = '主办方必填';
      if (!p.reviewRules?.trim()) errors['reviewRules'] = '主办方必填'; if (!p.awardSetting?.trim()) errors['awardSetting'] = '主办方必填';
    }
    if (p.creditApplicable === CreditApplicable.Value0 && !p.creditBasis?.trim()) errors['creditBasis'] = '适用第二课堂须有依据';
    if (p.creditApplicable === CreditApplicable.Value2 && !p.creditNote?.trim()) errors['creditNote'] = '待确认必须说明';
  }
  if (Object.keys(errors).length > 0) throw new RepositoryError(422, '字段校验失败', { fieldErrors: errors });
}
export function statusAt(p: ContestPayload, prior: ContestStatus, now: string): ContestStatus {
  // 评审和公示状态只接受明确种子/管理确认，不根据日期推测。
  if (prior === ContestStatus.Value4 || prior === ContestStatus.Value5 || prior === ContestStatus.Value6) return prior;
  const today = new Date(Date.parse(now)+8*3600000).toISOString().slice(0,10);
  const started = (value: string): boolean => value.includes('T') ? Date.parse(now)>=Date.parse(value) : today>=value;
  const ended = (value: string): boolean => value.includes('T') ? Date.parse(now)>Date.parse(value) : today>value;
  if (p.contestEnd && ended(p.contestEnd)) return ContestStatus.Value6;
  if (p.contestStart && p.contestEnd && started(p.contestStart) && !ended(p.contestEnd)) return ContestStatus.Value3;
  if (p.regEnd && ended(p.regEnd)) return ContestStatus.Value2;
  if (p.regStart && p.regEnd && started(p.regStart)) return ContestStatus.Value1;
  return ContestStatus.Value0;
}

export function applyInput(p: ContestPayload, input: CreateDraftRequest): void {
  if (input.schedule !== undefined) p.schedule = copy(input.schedule);
  if (input.name !== undefined) p.name = copy(input.name);
  if (input.category !== undefined) p.category = copy(input.category);
  if (input.scopeType !== undefined) p.scopeType = copy(input.scopeType);
  if (input.edition !== undefined) p.edition = copy(input.edition);
  if (input.level !== undefined) p.level = copy(input.level);
  if (input.applicableScope !== undefined) p.applicableScope = copy(input.applicableScope);
  if (input.entryType !== undefined) p.entryType = copy(input.entryType);
  if (input.sourceTitle !== undefined) p.sourceTitle = copy(input.sourceTitle);
  if (input.sourceOrg !== undefined) p.sourceOrg = copy(input.sourceOrg);
  if (input.sourceUrl !== undefined) p.sourceUrl = copy(input.sourceUrl);
  if (input.sourcePublishedAt !== undefined) p.sourcePublishedAt = copy(input.sourcePublishedAt);
  if (input.collectedAt !== undefined) p.collectedAt = copy(input.collectedAt);
  if (input.lastVerifiedAt !== undefined) p.lastVerifiedAt = copy(input.lastVerifiedAt);
  if (input.completeness !== undefined) p.completeness = copy(input.completeness);
  if (input.regStart !== undefined) p.regStart = copy(input.regStart);
  if (input.regEnd !== undefined) p.regEnd = copy(input.regEnd);
  if (input.contestStart !== undefined) p.contestStart = copy(input.contestStart);
  if (input.contestEnd !== undefined) p.contestEnd = copy(input.contestEnd);
  if (input.publicityTime !== undefined) p.publicityTime = copy(input.publicityTime);
  if (input.contestRequirement !== undefined) p.contestRequirement = copy(input.contestRequirement);
  if (input.reviewRules !== undefined) p.reviewRules = copy(input.reviewRules);
  if (input.awardSetting !== undefined) p.awardSetting = copy(input.awardSetting);
  if (input.material !== undefined) p.material = copy(input.material);
  if (input.entryMethod !== undefined) p.entryMethod = copy(input.entryMethod);
  if (input.contact !== undefined) p.contact = copy(input.contact);
  if (input.description !== undefined) p.description = copy(input.description);
  if (input.creditApplicable !== undefined) p.creditApplicable = copy(input.creditApplicable);
  if (input.creditBasis !== undefined) p.creditBasis = copy(input.creditBasis);
  if (input.creditNote !== undefined) p.creditNote = copy(input.creditNote);
  if (input.organizationId !== undefined) p.organizationId = copy(input.organizationId);
  if (input.attachmentIds !== undefined) p.attachmentIds = copy(input.attachmentIds);
}

export function unselected(input: CreateDraftRequest): string[] {
  const result: string[]=[];
  if(input.category===undefined) result.push('category');
  if(input.scopeType===undefined) result.push('scopeType');
  if(input.entryType===undefined) result.push('entryType');
  return result;
}
