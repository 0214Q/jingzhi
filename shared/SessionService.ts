import { LoginRequest, LoginResult, User, Role } from './contracts';
import { AuthRepository } from './Repositories';
import { RepositoryError } from './RepositoryError';
export interface SessionSnapshot {
    authenticated: boolean;
    user: User | null;
    expiresAt: string | null;
}
function cloneUser(u: User): User { return { id: u.id, role: u.role, schoolId: u.schoolId, openid: u.openid, subscribes: u.subscribes.slice(), devices: u.devices.slice() }; }
export function authorizationValue(result: LoginResult): string {
    if (!result.token || /\s/.test(result.token) || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(result.tokenType))
        throw new RepositoryError(422, '登录响应中的Token格式无效');
    return result.tokenType + ' ' + result.token;
}
// Tokens stay in memory for this demo. Passwords are never retained in this service or snapshots.
export class SessionService {
    private repository: AuthRepository;
    private allowedRoles: Role[];
    private clock: () => number;
    private session: LoginResult | null = null;
    private generation: number = 0;
    private loginPending: boolean = false;
    constructor(repository: AuthRepository, allowedRoles: Role[], clock: () => number = () => Date.now()) { this.repository = repository; this.allowedRoles = allowedRoles; this.clock = clock; }
    invalidate(): void { this.generation += 1; this.session = null; }
    snapshot(): SessionSnapshot {
        const session = this.current();
        return { authenticated: session !== null, user: session ? cloneUser(session.user) : null, expiresAt: session ? session.expiresAt : null };
    }
    private current(): LoginResult | null {
        const value = this.session;
        if (value && Date.parse(value.expiresAt) <= this.clock()) {
            this.invalidate();
            return null;
        }
        return value;
    }
    authorizationHeader(): string | null { const result = this.current(); return result ? authorizationValue(result) : null; }
    async login(input: LoginRequest): Promise<User> {
        if (this.loginPending)
            throw new RepositoryError(409, '登录正在进行，请稍候');
        const accountMode = typeof input.account === 'string' && input.account.trim().length > 0 && typeof input.password === 'string' && input.password.length > 0 && !input.agcToken;
        const tokenMode = typeof input.agcToken === 'string' && input.agcToken.length > 0 && !input.account && !input.password;
        if (!accountMode && !tokenMode)
            throw new RepositoryError(422, '请填写账号和密码');
        this.loginPending = true;
        this.invalidate();
        const version = this.generation;
        try {
            const result = await this.repository.login(input);
            if (version !== this.generation)
                throw new RepositoryError(409, '本次登录已取消');
            authorizationValue(result);
            if (!Number.isFinite(Date.parse(result.expiresAt)) || Date.parse(result.expiresAt) <= this.clock())
                throw new RepositoryError(401, '登录响应已过期，请重试');
            if (!this.allowedRoles.includes(result.user.role))
                throw new RepositoryError(403, this.allowedRoles.includes(Role.Value0) ? '此账号请使用管理后台登录' : '仅管理员可登录审核工作台');
            this.session = { token: result.token, tokenType: result.tokenType, expiresAt: result.expiresAt, user: cloneUser(result.user) };
            return cloneUser(result.user);
        }
        catch (error) {
            this.session = null;
            try {
                await this.repository.logout();
            }
            catch { }
            if (error instanceof Error)
                throw error as Error;
            throw new RepositoryError(500, '登录失败，请稍后重试');
        }
        finally {
            this.loginPending = false;
        }
    }
    async check(): Promise<boolean> {
        const session = this.current();
        if (!session)
            return false;
        const version = this.generation;
        try {
            const user = await this.repository.getCurrentUser();
            if (version !== this.generation || !this.current())
                return false;
            if (!this.allowedRoles.includes(user.role) || user.id !== session.user.id || user.schoolId !== session.user.schoolId) {
                this.invalidate();
                return false;
            }
            const current = this.current();
            if (!current)
                return false;
            current.user = cloneUser(user);
            return true;
        }
        catch {
            if (version === this.generation)
                this.invalidate();
            return false;
        }
    }
    async logout(): Promise<void> { this.invalidate(); await this.repository.logout(); }
}
export interface LoginState {
    submitting: boolean;
    error: string;
}
export class LoginController {
    private session: SessionService;
    private onChange: (state: LoginState) => void;
    private state: LoginState = { submitting: false, error: '' };
    private requestId: number = 0;
    constructor(session: SessionService, onChange: (state: LoginState) => void) { this.session = session; this.onChange = onChange; }
    snapshot(): LoginState { return { submitting: this.state.submitting, error: this.state.error }; }
    dispose(): void { this.requestId += 1; if (this.state.submitting)
        this.session.invalidate(); }
    async submit(account: string, password: string): Promise<boolean> {
        if (this.state.submitting)
            return false;
        const id = ++this.requestId;
        this.state = { submitting: true, error: '' };
        this.onChange(this.snapshot());
        try {
            await this.session.login({ account: account.trim(), password: password });
            return id === this.requestId;
        }
        catch (error) {
            if (id === this.requestId)
                this.state.error = error instanceof RepositoryError ? error.message : '登录失败，请稍后重试';
            return false;
        }
        finally {
            if (id === this.requestId) {
                this.state.submitting = false;
                this.onChange(this.snapshot());
            }
        }
    }
}
