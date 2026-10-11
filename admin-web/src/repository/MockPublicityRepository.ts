import { PublicityRepository } from './Repositories';
import { MockStore, MockContext, copy } from './MockStore';
import { actor, admin, owned } from './MockRules';
import { RepositoryError } from './RepositoryError';
import { Publicity, CreatePublicityRequest, UpdatePublicityRequest, ConcurrencyHeaders, RejectReasonRequest, ReasonRequest, VersionStatus, PublicityType, PublicityPage, PageQuery } from '../models/contracts';
export class MockPublicityRepository implements PublicityRepository {
    private store: MockStore;
    private context: MockContext;
    constructor(store: MockStore, context: MockContext) { this.store = store; this.context = context; }
    async listPending(q: PageQuery): Promise<PublicityPage> {
        const user = admin(this.context);
        const page = q.page === undefined ? 1 : q.page;
        const pageSize = q.pageSize === undefined ? 20 : q.pageSize;
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
            throw new RepositoryError(422, '无效分页参数');
        const rows = this.store.publicity.filter(p => p.reviewStatus === VersionStatus.Value1 && this.store.contests.some(c => c.contestId === p.contestId && c.schoolId === user.schoolId));
        const result: PublicityPage = { list: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize };
        return copy<PublicityPage>(result);
    }
    private item(id: string, lock: ConcurrencyHeaders): Publicity {
        const p = this.store.publicity.find((v: Publicity) => v.id === id);
        if (!p)
            throw new RepositoryError(404, '公示不存在');
        owned(this.store, this.context, p.contestId);
        if (lock.ifMatch !== p.etag)
            throw new RepositoryError(409, '公示已被修改', { currentEtag: p.etag });
        return p;
    }
    private record(p: Publicity, action: string, reason: string): void {
        this.store.publicityActions.push({ action: action, id: this.store.id('action'), publicityId: p.id, operator: actor(this.context).id, reason: reason, time: this.store.now() });
    }
    private stamp(p: Publicity): void { p.etag = this.store.id('etag'); }
    async create(input: CreatePublicityRequest): Promise<Publicity> {
        owned(this.store, this.context, input.contestId);
        if (![PublicityType.Value0, PublicityType.Value1, PublicityType.Value2].includes(input.type))
            throw new RepositoryError(422, '无效公示类型');
        if (!input.reason.trim())
            throw new RepositoryError(422, '原因必填');
        const items = this.store.publicity.filter((p: Publicity) => p.contestId === input.contestId && p.type === input.type);
        if (items.some((p: Publicity) => p.reviewStatus !== VersionStatus.Value2))
            throw new RepositoryError(409, '已有工作公示');
        let max = 0;
        items.forEach((p: Publicity) => { if (p.versionNo > max)
            max = p.versionNo; });
        const p: Publicity = { id: this.store.id('pub'), contestId: input.contestId, type: input.type, reviewStatus: VersionStatus.Value0, versionNo: max + 1, content: copy(input.content), operator: actor(this.context).id, etag: this.store.id('etag'), reason: input.reason, reviewNote: null, publishedAt: null };
        this.store.publicity.push(p);
        this.record(p, "create", p.reason);
        return copy(p);
    }
    async update(id: string, input: UpdatePublicityRequest, lock: ConcurrencyHeaders): Promise<Publicity> {
        const p = this.item(id, lock);
        if (p.reviewStatus !== VersionStatus.Value0 && p.reviewStatus !== VersionStatus.Value3)
            throw new RepositoryError(409, '只可编辑草稿/驳回公示');
        if (!input.reason.trim())
            throw new RepositoryError(422, '原因必填');
        p.content = copy(input.content);
        p.reason = input.reason;
        p.operator = actor(this.context).id;
        this.stamp(p);
        this.record(p, "update", p.reason);
        return copy(p);
    }
    async submitReview(id: string, lock: ConcurrencyHeaders): Promise<Publicity> {
        const p = this.item(id, lock);
        if (p.reviewStatus !== VersionStatus.Value0 && p.reviewStatus !== VersionStatus.Value3)
            throw new RepositoryError(409, '当前公示不可提交');
        if (typeof p.content === 'string' ? !p.content.trim() : !p.content.text?.trim() && p.content.winners.length === 0)
            throw new RepositoryError(422, '公示内容必填');
        if (p.type === PublicityType.Value0 && typeof p.content === 'string')
            throw new RepositoryError(422, '演示获奖名单请使用结构化 winners');
        p.reviewStatus = VersionStatus.Value1;
        this.stamp(p);
        this.record(p, "submit", p.reason);
        return copy(p);
    }
    async reviewApprove(id: string, lock: ConcurrencyHeaders): Promise<Publicity> {
        admin(this.context);
        const p = this.item(id, lock);
        if (p.reviewStatus !== VersionStatus.Value1)
            throw new RepositoryError(409, '仅待审公示可通过');
        this.store.withdrawnTypes = this.store.withdrawnTypes.filter((key: string) => key !== p.contestId + ':' + p.type);
        p.reviewStatus = VersionStatus.Value2;
        p.publishedAt = this.store.now();
        p.reviewNote = null;
        this.stamp(p);
        this.record(p, "approve", p.reason);
        return copy(p);
    }
    async reviewReject(id: string, input: RejectReasonRequest, lock: ConcurrencyHeaders): Promise<Publicity> {
        admin(this.context);
        const p = this.item(id, lock);
        if (p.reviewStatus !== VersionStatus.Value1)
            throw new RepositoryError(409, '仅待审公示可驳回');
        if (!input.rejectReason.trim())
            throw new RepositoryError(422, '驳回原因必填');
        p.reviewStatus = VersionStatus.Value3;
        p.reviewNote = input.rejectReason;
        this.stamp(p);
        this.record(p, "reject", input.rejectReason);
        return copy(p);
    }
    async withdraw(id: string, input: ReasonRequest, lock: ConcurrencyHeaders): Promise<void> {
        admin(this.context);
        const p = this.item(id, lock);
        if (!input.reason.trim())
            throw new RepositoryError(422, '撤回原因必填');
        // V2 has no withdrawn enum. Hide the whole publication type using a store-only flag; never fall back to an older edition.
        if (p.reviewStatus !== VersionStatus.Value2)
            throw new RepositoryError(409, '仅已发布公示可撤回');
        this.store.withdrawnTypes.push(p.contestId + ':' + p.type);
        this.record(p, "withdraw", input.reason);
        this.stamp(p);
    }
}
