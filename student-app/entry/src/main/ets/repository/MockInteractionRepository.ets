import { FavoriteRepository, FeedbackRepository } from './Repositories';
import { Favorite, FavoritePage, Feedback, FeedbackPage, PageQuery, CreateFavoriteRequest, CreateFeedbackRequest, FeedbackFilter, HandleFeedbackRequest, FeedbackStatus, Role } from '../models/Contracts';
import { MockStore, MockContext, copy } from './MockStore';
import { actor, admin, root } from './MockRules';
import { RepositoryError } from './RepositoryError';
interface NormalizedPage {
    page: number;
    pageSize: number;
}
function pagination(q: PageQuery): NormalizedPage { const page = q.page === undefined ? 1 : q.page; const pageSize = q.pageSize === undefined ? 20 : q.pageSize; if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
    throw new RepositoryError(422, '无效分页参数'); return { page, pageSize }; }
function student(context: MockContext): string { const user = actor(context); if (user.role !== Role.Value0)
    throw new RepositoryError(403, '仅学生可以使用此功能'); return user.id; }
function feedbackSchool(store: MockStore, f: Feedback): string | undefined { if (f.schoolId !== undefined) return f.schoolId; if (f.contestId !== null) return store.contests.find(c => c.contestId === f.contestId)?.schoolId; return store.users.find(u => u.id === f.userId)?.schoolId; }
export class MockFavoriteRepository implements FavoriteRepository {
    private store: MockStore;
    private context: MockContext;
    constructor(store: MockStore, context: MockContext) { this.store = store; this.context = context; }
    async listMine(q: PageQuery): Promise<FavoritePage> { const userId = student(this.context); const p = pagination(q); const rows = this.store.favorites.filter(f => f.userId === userId && this.store.contests.some(c => c.contestId === f.contestId && c.schoolId === actor(this.context).schoolId)).map(f => { const c = this.store.contests.find(c => c.contestId === f.contestId && c.schoolId === actor(this.context).schoolId); const favorite: Favorite = { userId: f.userId, contestId: f.contestId, createdAt: f.createdAt, available: !!c?.publishedVersionId && !c?.takedown }; return favorite; }).reverse(); const result: FavoritePage = { list: rows.slice((p.page - 1) * p.pageSize, p.page * p.pageSize), total: rows.length, page: p.page, pageSize: p.pageSize }; return copy<FavoritePage>(result); }
    async add(input: CreateFavoriteRequest): Promise<Favorite> { const userId = student(this.context); const c = root(this.store, this.context, input.contestId); if (!c.publishedVersionId || c.takedown)
        throw new RepositoryError(409, '该赛事暂不可收藏'); const old = this.store.favorites.find(f => f.userId === userId && f.contestId === input.contestId); if (old)
        return copy(old); const f: Favorite = { userId, contestId: input.contestId, createdAt: this.store.now(), available: true }; this.store.favorites.push(f); return copy(f); }
    async remove(contestId: string): Promise<void> { const userId = student(this.context); this.store.favorites = this.store.favorites.filter(f => !(f.userId === userId && f.contestId === contestId)); }
}
export class MockFeedbackRepository implements FeedbackRepository {
    private store: MockStore;
    private context: MockContext;
    constructor(store: MockStore, context: MockContext) { this.store = store; this.context = context; }
    async create(input: CreateFeedbackRequest): Promise<Feedback> { const userId = student(this.context); if (input.contestId !== null) {
        const c = root(this.store, this.context, input.contestId);
        if (!c.publishedVersionId)
            throw new RepositoryError(403, '仅可反馈公开赛事');
    } if (!input.type.trim() || input.type.length > 40 || !input.desc.trim() || input.desc.length > 2000)
        throw new RepositoryError(422, '反馈类型必填（最多40字），说明必填（最多2000字）'); const f: Feedback = { schoolId: actor(this.context).schoolId, id: this.store.id('feedback'), userId, contestId: input.contestId, type: input.type.trim(), desc: input.desc.trim(), status: FeedbackStatus.Value0, handler: null, note: null, time: this.store.now() }; this.store.feedback.push(f); return copy(f); }
    async listMine(q: PageQuery): Promise<FeedbackPage> { const userId = student(this.context); return this.page(this.store.feedback.filter(f => f.userId === userId && feedbackSchool(this.store, f) === actor(this.context).schoolId), q); }
    async listManaged(q: FeedbackFilter): Promise<FeedbackPage> { const user = admin(this.context); if (q.status && ![FeedbackStatus.Value0, FeedbackStatus.Value1, FeedbackStatus.Value2, FeedbackStatus.Value3].includes(q.status))
        throw new RepositoryError(422, '无效反馈状态'); return this.page(this.store.feedback.filter(f => feedbackSchool(this.store, f) === user.schoolId && (!q.status || f.status === q.status)), q); }
    private page(rows: Feedback[], q: PageQuery): FeedbackPage { const p = pagination(q); rows = rows.slice().reverse(); const result: FeedbackPage = { list: rows.slice((p.page - 1) * p.pageSize, p.page * p.pageSize), total: rows.length, page: p.page, pageSize: p.pageSize }; return copy<FeedbackPage>(result); }
    async handle(id: string, input: HandleFeedbackRequest): Promise<Feedback> { const user = admin(this.context); const f = this.store.feedback.find(f => f.id === id && feedbackSchool(this.store, f) === user.schoolId); if (!f)
        throw new RepositoryError(403, '无权访问该反馈'); if (![FeedbackStatus.Value1, FeedbackStatus.Value2, FeedbackStatus.Value3].includes(input.status) || !input.note.trim() || input.note.length > 2000)
        throw new RepositoryError(422, '请选择处理结果并填写说明（最多2000字）'); if (f.status === FeedbackStatus.Value2 || f.status === FeedbackStatus.Value3)
        throw new RepositoryError(409, '该反馈已结束处理，请刷新列表'); f.status = input.status; f.note = input.note.trim(); f.handler = user.id; return copy(f); }
}
