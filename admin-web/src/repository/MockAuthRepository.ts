import { LoginRequest, LoginResult, User } from '../models/contracts';
import { AuthRepository } from './Repositories';
import { RepositoryError } from './RepositoryError';
import { MockStore, MockContext, copy } from './MockStore';
export class MockAuthRepository implements AuthRepository {
    private store: MockStore;
    private context: MockContext;
    constructor(store: MockStore, context: MockContext) { this.store = store; this.context = context; }
    async login(input: LoginRequest): Promise<LoginResult> {
        if (!input.account || input.password !== 'demo123' || input.agcToken)
            throw new RepositoryError(401, '演示账号或密码错误');
        const user = this.store.users.find((item: User) => item.id === input.account);
        if (!user)
            throw new RepositoryError(401, '演示账号或密码错误');
        this.context.user = copy(user);
        this.context.expiresAt = Date.now() + 3600000;
        return { token: 'mock-token-' + user.id, tokenType: 'Bearer', expiresAt: new Date(this.context.expiresAt).toISOString(), user: copy(user) };
    }
    async logout(): Promise<void> { this.context.user = null; }
    async getCurrentUser(): Promise<User> {
        if (!this.context.user || this.context.expiresAt <= Date.now())
            throw new RepositoryError(401, '请先登录演示账号');
        return copy(this.context.user);
    }
}
