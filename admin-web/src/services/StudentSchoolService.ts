import { StudentSchool, StudentSchoolContext, StudentSchoolPage, StudentSchoolQuery, ScopeType } from '../models/contracts';
import { StudentSchoolRepository } from '../repository/StudentSchoolRepository';
import { RepositoryError } from '../repository/RepositoryError';
function schoolCopy(school: StudentSchool | null): StudentSchool | null { if (school === null) return null; return { id: school.id, name: school.name, code: school.code, status: school.status }; }
function contextCopy(context: StudentSchoolContext): StudentSchoolContext { return { homeSchoolId: context.homeSchoolId, homeSchool: schoolCopy(context.homeSchool), selectedSchoolId: context.selectedSchoolId, selectedSchool: schoolCopy(context.selectedSchool), state: context.state, etag: context.etag }; }
export function studentCatalogNotice(name: string): string { return (name || '当前高校') + '参赛目录 · 具体安排以当年官方通知为准'; }
export function studentScopeText(scope: ScopeType): string { return scope === ScopeType.Value2 ? '校外赛事（适用范围见详情）' : scope; }
export function schoolErrorText(error: Error): string { return error instanceof RepositoryError ? error.message : '高校信息读取失败，请检查网络后重试'; }
/** Account-bound browsing context. Never changes SessionService's User.schoolId. */
export class StudentSchoolService {
 private repository: StudentSchoolRepository;
 private userId: string | null = null;
 private context: StudentSchoolContext | null = null;
 private revision: number = 0;
 private requestId: number = 0;
 private selecting: boolean = false;
 constructor(repository: StudentSchoolRepository) { this.repository = repository; }
 bind(userId: string): void { if (this.userId !== userId) { this.invalidate(); this.userId = userId; } }
 reset(): void { this.invalidate(); this.userId = null; }
 invalidate(): void { this.context = null; this.revision += 1; this.requestId += 1; this.selecting = false; }
 snapshot(): StudentSchoolContext | null { return this.context === null ? null : contextCopy(this.context); }
 switchPending(): boolean { return this.selecting; }
 scopeKey(): string { return (this.userId || '') + ':' + this.revision.toString(); }
 schoolHeader(): string | null { return this.context?.selectedSchool?.id || null; }
 private requireAccount(): void { if (this.userId === null) throw new RepositoryError(401, '请先登录学生账号'); }
 private apply(context: StudentSchoolContext): StudentSchoolContext { const previous: StudentSchoolContext | null = this.context; if (previous === null || previous.etag !== context.etag || previous.selectedSchoolId !== context.selectedSchoolId || previous.selectedSchool?.name !== context.selectedSchool?.name || previous.selectedSchool?.status !== context.selectedSchool?.status) this.revision += 1; this.context = contextCopy(context); return contextCopy(context); }
 async refresh(): Promise<StudentSchoolContext> {
  this.requireAccount(); if (this.selecting) throw new RepositoryError(409, '正在切换高校，请稍候');
  const id: number = ++this.requestId;
  const context: StudentSchoolContext = await this.repository.getContext();
  if (id !== this.requestId) throw new RepositoryError(409, '高校读取已取消');
  return this.apply(context);
 }
 async listSchools(query: StudentSchoolQuery): Promise<StudentSchoolPage> { this.requireAccount(); return this.repository.listSchools(query); }
 async selectSchool(schoolId: string): Promise<StudentSchoolContext> {
  this.requireAccount(); if (this.selecting) throw new RepositoryError(409, '正在切换高校，请勿重复提交');
  if (this.context === null) throw new RepositoryError(409, '请先重新读取高校信息');
  const etag: string = this.context.etag; const id: number = ++this.requestId; this.selecting = true;
  try { const context: StudentSchoolContext = await this.repository.selectSchool({ schoolId: schoolId, expectedEtag: etag }); if (id !== this.requestId) throw new RepositoryError(409, '高校切换已取消'); return this.apply(context); }
  finally { if (id === this.requestId) this.selecting = false; }
 }
}
export class StudentSchoolProvider {
 private service: StudentSchoolService | null = null;
 configure(service: StudentSchoolService): void { this.service?.reset(); this.service = service; }
 get(): StudentSchoolService { if (this.service === null) throw new Error('高校数据源尚未配置'); return this.service; }
}
export const studentSchoolProvider: StudentSchoolProvider = new StudentSchoolProvider();
