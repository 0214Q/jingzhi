import { HttpTransport } from './HttpProtocol';
import { RepositoryError } from './RepositoryError';
import { StudentSchoolService } from '../services/StudentSchoolService';
export function isStudentDataPath(path: string): boolean { const p: string = path.split('?')[0]; return p === '/contests' || p.startsWith('/contests/') || p === '/favorites' || p.startsWith('/favorites/') || p === '/feedback' || p === '/feedback/mine'; }
/** Rejects late replies from a prior school/account without changing management/auth calls. */
export class SchoolScopedTransport implements HttpTransport {
 private transport: HttpTransport;
 private school: () => StudentSchoolService;
 private onRequired: () => void;
 constructor(transport: HttpTransport, school: () => StudentSchoolService, onRequired: () => void = () => {}) { this.transport = transport; this.school = school; this.onRequired = onRequired; }
 private capture(path: string): string | null { if (!isStudentDataPath(path)) return null; const school: StudentSchoolService = this.school(); if (school.switchPending()) throw new RepositoryError(409, '正在切换高校，请稍候'); if (school.schoolHeader() === null) { this.onRequired(); throw new RepositoryError(409, '请先选择浏览高校'); } return school.scopeKey(); }
 private verify(key: string | null): void { if (key !== null && key !== this.school().scopeKey()) throw new RepositoryError(409, '高校已切换，旧请求结果已丢弃'); }
 private mismatch(error: Error, key: string | null): void { if (key !== null && key === this.school().scopeKey() && !this.school().switchPending() && error instanceof RepositoryError && error.code === 409 && error.message.includes('高校')) { this.school().invalidate(); this.onRequired(); } }
 async request<T>(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous: boolean = false): Promise<T> {
  const key: string | null = this.capture(path);
  try { const result: T = await this.transport.request<T>(method, path, bodyJson, ifMatch, anonymous); this.verify(key); return result; }
  catch (error) { if (error instanceof Error) { const known: Error = error as Error; this.mismatch(known, key); throw (known as Error); } throw new RepositoryError(500, '请求失败，请重试'); }
 }
 async requestVoid(method: string, path: string, bodyJson?: string | null, ifMatch?: string | null, anonymous: boolean = false, authorizationOverride?: string | null): Promise<void> {
  const key: string | null = this.capture(path);
  try { await this.transport.requestVoid(method, path, bodyJson, ifMatch, anonymous, authorizationOverride); this.verify(key); }
  catch (error) { if (error instanceof Error) { const known: Error = error as Error; this.mismatch(known, key); throw (known as Error); } throw new RepositoryError(500, '请求失败，请重试'); }
 }
}
