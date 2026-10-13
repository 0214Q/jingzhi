import { ContestRepository } from './Repositories';
import { RepositoryError } from './RepositoryError';
import { MockStore, MockContext, copy } from './MockStore';
import { actor, admin, root, owned, canWrite, blankPayload, applyInput, validate, missing, statusAt, unselected } from './MockRules';
import { Contest, ContestVersion, ContestPayload, ContestFilter, ContestSummary, ContestPage, PublicContest, PublicAuditLog, AuditLog, ChangeType, Visibility, PublicVisibility, VersionStatus, Completeness, ContestStatus, CreateDraftRequest, UpdateDraftRequest, DraftResult, DeriveVersionRequest, ConcurrencyHeaders, SubmitReviewResult, ApproveReviewRequest, ApproveReviewResult, RejectReviewRequest, RejectReviewResult, ManagedContest, ManagedContestPage, PendingReviewPage, PendingReviewItem, PageQuery, VersionPage, PublicityResult, CurrentPublicity, Publicity, PublishedPublicity, PublicityType, TakedownRequest, TakedownScope, ReviewResult } from '../models/Contracts';
export class MockContestRepository implements ContestRepository {
    private store: MockStore;
    private context: MockContext;
    constructor(store: MockStore, context: MockContext) { this.store = store; this.context = context; }
    private version(cid: string, vid: string, lock: ConcurrencyHeaders): ContestVersion {
        owned(this.store, this.context, cid);
        const v = this.store.versions.find((item: ContestVersion) => item.contestId === cid && item.versionId === vid);
        if (!v)
            throw new RepositoryError(404, '版本不存在');
        if (!lock.ifMatch || lock.ifMatch !== v.etag)
            throw new RepositoryError(409, '版本已被他人修改', { currentEtag: v.etag });
        return v;
    }
    private stamp(v: ContestVersion): void { v.etag = this.store.id('etag'); v.updatedAt = this.store.now(); }
    private log(v: ContestVersion, field: string, before: string | null, after: string | null, publicLog: boolean): void {
        this.store.logs.push({ id: this.store.id('log'), contestId: v.contestId, versionId: v.versionId, operator: publicLog ? v.operator : actor(this.context).id, time: this.store.now(), field: field, oldValue: before, newValue: after, reason: v.reason, changeType: v.changeType === null ? ChangeType.Value1 : v.changeType, visibility: publicLog ? Visibility.Value0 : Visibility.Value1 });
    }
    private result(v: ContestVersion): DraftResult { return { contestId: v.contestId, versionId: v.versionId, versionNo: v.versionNo, status: v.status, etag: v.etag }; }
    private page(input: PageQuery): PageQuery {
        const page = input.page === undefined ? 1 : input.page;
        const size = input.pageSize === undefined ? 20 : input.pageSize;
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100)
            throw new RepositoryError(422, '无效分页参数');
        return { page: page, pageSize: size };
    }
    private matches(p: ContestPayload, phase: ContestStatus, f: ContestFilter): boolean {
        if (f.datedOnly && !(p.edition && p.sourceUrl && p.sourceOrg && p.lastVerifiedAt && (p.regStart || p.regEnd || p.contestStart || p.contestEnd || p.schedule?.length))) return false;
        const org = this.store.organizations.find((o) => o.id === p.organizationId);
        if (f.keyword && !(p.name + ' ' + (org?.name || '')).toLowerCase().includes(f.keyword.toLowerCase()))
            return false;
        if (f.category && p.category !== f.category)
            return false;
        if (f.scopeType && p.scopeType !== f.scopeType)
            return false;
        if (f.entryType && p.entryType !== f.entryType)
            return false;
        if (f.contestStatus && phase !== f.contestStatus)
            return false;
        const start = f.monthMode === 'contest' ? p.contestStart : p.regStart;
        const end = f.monthMode === 'contest' ? p.contestEnd : p.regEnd;
        if (f.month) {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(f.month))
                throw new RepositoryError(422, '月份必须为 YYYY-MM');
            if (start && end ? (start.slice(0, 7) > f.month || end.slice(0, 7) < f.month) : !((start || end)?.startsWith(f.month) || (f.monthMode === 'contest' && p.schedule?.some(s => s.value.startsWith(f.month || '')))))
                return false;
        }
        if (f.year && !(start?.startsWith(f.year.toString()) || end?.startsWith(f.year.toString()) || (f.monthMode === 'contest' && p.schedule?.some(s => s.value.startsWith(f.year?.toString() || '')))))
            return false;
        return true;
    }
    async listPublished(filter: ContestFilter): Promise<ContestPage> {
        actor(this.context);
        const page = this.page(filter);
        const rows: ContestSummary[] = [];
        for (const c of this.store.contests) {
            if (c.schoolId !== actor(this.context).schoolId || !c.publishedVersionId || c.takedown)
                continue;
            const detail = await this.getPublicVersion(c.contestId);
            const p = detail.data;
            if (!this.matches(p, detail.contestStatus, filter))
                continue;
            rows.push({ contestId: c.contestId, name: p.name, category: p.category, scopeType: p.scopeType, contestStatus: detail.contestStatus, regEnd: p.regEnd, regEndHasTime: detail.regEndHasTime, organizationName: detail.organizationName, applicableScope: detail.data.applicableScope, completeness: detail.completeness, level: p.level, edition: p.edition, scheduleCaption: p.regEnd ? '报名截止：' + p.regEnd : p.schedule?.length ? p.schedule[0].stage + '：' + p.schedule[0].value : p.contestStart ? '比赛开始：' + p.contestStart : p.regStart ? '报名开始：' + p.regStart : null });
        }
        const sort = filter.sort || 'regEnd';
        if (!['regEnd', '-regEnd', 'reg_end', '-reg_end', 'name', '-name', 'updatedAt', '-updatedAt'].includes(sort))
            throw new RepositoryError(422, '不支持的排序');
        rows.sort((a: ContestSummary, b: ContestSummary) => {
            const ap = this.store.versions.find((v: ContestVersion) => v.contestId === a.contestId && v.isCurrent);
            const bp = this.store.versions.find((v: ContestVersion) => v.contestId === b.contestId && v.isCurrent);
            const av = sort.includes('updatedAt') ? (ap?.updatedAt || '') : sort.includes('name') ? a.name : (a.regEnd || '9999');
            const bv = sort.includes('updatedAt') ? (bp?.updatedAt || '') : sort.includes('name') ? b.name : (b.regEnd || '9999');
            return av.localeCompare(bv) * (sort.startsWith('-') ? -1 : 1);
        });
        const pn = page.page || 1;
        const size = page.pageSize || 20;
        const result: ContestPage = { list: rows.slice((pn - 1) * size, pn * size), total: rows.length, page: pn, pageSize: size };
        return copy<ContestPage>(result);
    }
    async getPublicVersion(contestId: string): Promise<PublicContest> {
        const c = root(this.store, this.context, contestId);
        const v = this.store.versions.find((item: ContestVersion) => item.contestId === contestId && item.versionId === c.publishedVersionId && item.status === VersionStatus.Value2);
        if (!v)
            throw new RepositoryError(404, '赛事未发布');
        const p = v.payload;
        const org = this.store.organizations.find((item) => item.id === p.organizationId);
        const result: PublicContest = { contestId: c.contestId, schoolId: c.schoolId, publishedVersionId: v.versionId, contestStatus: statusAt(p, c.contestStatus, this.store.now()), takedown: c.takedown, data: p,
            source: { sourceTitle: p.sourceTitle, sourceOrg: p.sourceOrg, sourceUrl: p.sourceUrl, sourcePublishedAt: p.sourcePublishedAt, collectedAt: p.collectedAt, lastVerifiedAt: p.lastVerifiedAt },
            publicity: await this.getPublicity(contestId), auditLogs: await this.getPublicAuditLog(contestId), completeness: p.completeness, incompleteFields: missing(p), regEndHasTime: p.regEnd !== null && p.regEnd.includes('T'), organizationName: org ? org.name : '原通知未公布', updatedAt: v.updatedAt };
        return copy<PublicContest>(result);
    }
    async getPublicAuditLog(contestId: string, changeType?: ChangeType): Promise<PublicAuditLog[]> {
        const c = root(this.store, this.context, contestId);
        if (!c.publishedVersionId)
            throw new RepositoryError(404, '赛事未发布');
        const ids = this.store.versions.filter((v: ContestVersion) => v.contestId === contestId && v.status === VersionStatus.Value2).map((v: ContestVersion) => v.versionId);
        const result: PublicAuditLog[] = [];
        for (const log of this.store.logs)
            if (log.contestId === contestId && log.visibility === Visibility.Value0 && ids.includes(log.versionId) && (!changeType || log.changeType === changeType)) {
                result.push({ id: log.id, contestId: log.contestId, versionId: log.versionId, operator: log.operator, time: log.time, field: log.field, oldValue: log.oldValue, newValue: log.newValue, reason: log.reason, changeType: log.changeType, visibility: PublicVisibility.Value0 });
            }
        return copy(result);
    }
    async getPublicity(contestId: string): Promise<PublicityResult> {
        const c = root(this.store, this.context, contestId);
        if (!c.publishedVersionId)
            throw new RepositoryError(404, '赛事未发布');
        const published = this.store.publicity.filter((p: Publicity) => p.contestId === contestId && p.reviewStatus === VersionStatus.Value2 && !this.store.withdrawnTypes.includes(p.contestId + ':' + p.type));
        const current: CurrentPublicity = { winners: [], rule: null, standard: null };
        const history: PublishedPublicity[] = [];
        for (const p of published) {
            const newer = published.some((other: Publicity) => other.type === p.type && other.versionNo > p.versionNo);
            if (newer)
                history.push({ id: p.id, contestId: p.contestId, type: p.type, versionNo: p.versionNo, content: p.content, publishedAt: p.publishedAt || '' });
            else if (p.type === PublicityType.Value0) {
                if (typeof p.content !== 'string')
                    current.winners = copy(p.content.winners);
            }
            else if (p.type === PublicityType.Value1)
                current.rule = typeof p.content === 'string' ? p.content : p.content.text;
            else
                current.standard = typeof p.content === 'string' ? p.content : p.content.text;
        }
        const result: PublicityResult = { current: published.length > 0 ? current : null, history: history };
        return copy<PublicityResult>(result);
    }
    async getMonths(filter: ContestFilter): Promise<string[]> {
        actor(this.context);
        const months: string[] = [];
        for (const c of this.store.contests) {
            if (c.schoolId !== actor(this.context).schoolId || !c.publishedVersionId || c.takedown)
                continue;
            const d = await this.getPublicVersion(c.contestId);
            if (!this.matches(d.data, d.contestStatus, filter))
                continue;
            const start = filter.monthMode === 'contest' ? d.data.contestStart : d.data.regStart;
            const end = filter.monthMode === 'contest' ? d.data.contestEnd : d.data.regEnd;
            if (filter.monthMode === 'contest') {
                for (const stage of d.data.schedule || []) {
                    const m: string = stage.value.slice(0, 7);
                    if (!months.includes(m)) months.push(m);
                }
            }
            if (!start || !end) {
                const endpoint: string | null = start || end;
                if (endpoint && !months.includes(endpoint.slice(0, 7))) months.push(endpoint.slice(0, 7));
                continue;
            }
            const date = new Date(start.slice(0, 7) + '-01T00:00:00Z');
            const last = end.slice(0, 7);
            for (let i = 0; i < 1200 && date.toISOString().slice(0, 7) <= last; i += 1) {
                const m = date.toISOString().slice(0, 7);
                if (!months.includes(m))
                    months.push(m);
                date.setUTCMonth(date.getUTCMonth() + 1);
            }
        }
        return months.sort();
    }
    async getManaged(contestId: string): Promise<ManagedContest> {
        const c = owned(this.store, this.context, contestId);
        const rows = this.store.versions.filter((v: ContestVersion) => v.contestId === contestId);
        const result: ManagedContest = { contest: c, workingVersion: rows.find((v: ContestVersion) => v.status !== VersionStatus.Value2) || null, publishedVersion: rows.find((v: ContestVersion) => v.versionId === c.publishedVersionId) || null };
        return copy<ManagedContest>(result);
    }
    async listManaged(filter: ContestFilter): Promise<ManagedContestPage> {
        if (actor(this.context).role === '学生')
            throw new RepositoryError(403, '学生不能查看管理数据');
        const rows: ManagedContest[] = [];
        const page = this.page(filter);
        for (const c of this.store.contests) {
            if (c.schoolId !== actor(this.context).schoolId)
                continue;
            try {
                const item = await this.getManaged(c.contestId);
                const v = item.workingVersion || item.publishedVersion;
                if (v && this.matches(v.payload, c.contestStatus, filter))
                    rows.push(item);
            }
            catch (error) {
                if (error instanceof RepositoryError) {
                    if (error.code !== 403)
                        throw error as Error;
                }
                else if (error instanceof Error) {
                    throw error as Error;
                }
                else {
                    throw new RepositoryError(500, '读取管理赛事失败');
                }
            }
        }
        const pn = page.page || 1;
        const size = page.pageSize || 20;
        const result: ManagedContestPage = { list: rows.slice((pn - 1) * size, pn * size), total: rows.length, page: pn, pageSize: size };
        return copy<ManagedContestPage>(result);
    }
    async createDraft(input: CreateDraftRequest): Promise<DraftResult> {
        const p = blankPayload(input);
        applyInput(p, input);
        canWrite(this.store, this.context, p);
        validate(p, false);
        if (![ChangeType.Value0, ChangeType.Value1].includes(input.changeType))
            throw new RepositoryError(422, '无效变更类型');
        if (!input.reason.trim())
            throw new RepositoryError(422, '变更原因必填');
        const user = actor(this.context);
        const id = this.store.id('DEMO');
        const v: ContestVersion = { versionId: this.store.id('v'), contestId: id, versionNo: 1, status: VersionStatus.Value0, etag: this.store.id('etag'), isCurrent: false, payload: copy(p), operator: user.id, operatorRole: user.role, entryType: p.entryType, changeType: input.changeType, reason: input.reason, createdAt: this.store.now(), submittedAt: null, reviewedAt: null, reviewNote: null, updatedAt: this.store.now() };
        this.store.contests.push({ contestId: id, schoolId: user.schoolId, publishedVersionId: null, contestStatus: ContestStatus.Value0, takedown: null, createdBy: user.id, updatedAt: this.store.now() });
        this.store.versions.push(v);
        this.store.unselectedDraftFields[v.versionId] = unselected(input);
        this.log(v, 'created', null, p.name, false);
        return copy(this.result(v));
    }
    async updateDraft(contestId: string, versionId: string, input: UpdateDraftRequest, lock: ConcurrencyHeaders): Promise<DraftResult> {
        const v = this.version(contestId, versionId, lock);
        if (v.status !== VersionStatus.Value0 && v.status !== VersionStatus.Value3)
            throw new RepositoryError(409, '仅草稿或驳回版本可编辑');
        if (![ChangeType.Value0, ChangeType.Value1].includes(input.changeType))
            throw new RepositoryError(422, '无效变更类型');
        if (!input.reason.trim())
            throw new RepositoryError(422, '变更原因必填');
        // Whole save: omitted fields revert to blank/null. Page must submit current complete form.
        const p = blankPayload(input);
        applyInput(p, input);
        canWrite(this.store, this.context, p);
        validate(p, false);
        v.reason = input.reason;
        v.changeType = input.changeType;
        this.diff(v, v.payload, p, false);
        this.store.unselectedDraftFields[v.versionId] = unselected(input);
        v.payload = copy(p);
        v.entryType = p.entryType;
        v.operator = actor(this.context).id;
        v.operatorRole = actor(this.context).role;
        this.stamp(v);
        return copy(this.result(v));
    }
    private derive(c: Contest, base: ContestVersion, input: DeriveVersionRequest): DraftResult {
        if (![ChangeType.Value0, ChangeType.Value1].includes(input.changeType))
            throw new RepositoryError(422, '无效变更类型');
        if (!input.reason.trim())
            throw new RepositoryError(422, '变更原因必填');
        if (this.store.versions.some((v: ContestVersion) => v.contestId === c.contestId && v.status !== VersionStatus.Value2))
            throw new RepositoryError(409, '已有工作版本，请先处理');
        const v = copy(base);
        v.versionId = this.store.id('v');
        let max = 0;
        this.store.versions.forEach((item: ContestVersion) => { if (item.contestId === c.contestId && item.versionNo > max)
            max = item.versionNo; });
        v.versionNo = max + 1;
        v.status = VersionStatus.Value0;
        v.isCurrent = false;
        v.changeType = input.changeType;
        v.reason = input.reason;
        v.createdAt = this.store.now();
        v.submittedAt = null;
        v.reviewedAt = null;
        v.reviewNote = null;
        v.operator = actor(this.context).id;
        v.operatorRole = actor(this.context).role;
        this.stamp(v);
        this.store.versions.push(v);
        this.log(v, 'derived', base.versionId, v.versionId, false);
        return copy(this.result(v));
    }
    async deriveVersion(contestId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders): Promise<DraftResult> {
        const c = owned(this.store, this.context, contestId);
        if (!c.publishedVersionId)
            throw new RepositoryError(404, '没有公开版本');
        return this.derive(c, this.version(contestId, c.publishedVersionId, lock), input);
    }
    async restoreVersion(contestId: string, versionId: string, input: DeriveVersionRequest, lock: ConcurrencyHeaders): Promise<DraftResult> {
        admin(this.context);
        const c = owned(this.store, this.context, contestId);
        const v = this.version(contestId, versionId, lock);
        if (v.status !== VersionStatus.Value2)
            throw new RepositoryError(409, '只能恢复已发布历史版本');
        return this.derive(c, v, input);
    }
    async submitReview(contestId: string, versionId: string, lock: ConcurrencyHeaders): Promise<SubmitReviewResult> {
        const v = this.version(contestId, versionId, lock);
        if (v.status !== VersionStatus.Value0 && v.status !== VersionStatus.Value3)
            throw new RepositoryError(409, '当前状态不能提交');
        const required = this.store.unselectedDraftFields[v.versionId] || [];
        if (required.length > 0)
            throw new RepositoryError(422, '请选择分类、归属和录入主体');
        canWrite(this.store, this.context, v.payload);
        validate(v.payload, true);
        v.payload.completeness = missing(v.payload).length > 0 ? Completeness.Value1 : Completeness.Value0;
        const old = v.status;
        v.status = VersionStatus.Value1;
        v.submittedAt = this.store.now();
        this.stamp(v);
        this.log(v, 'status', old, v.status, false);
        return { versionId: v.versionId, status: v.status };
    }
    async reviewApprove(contestId: string, input: ApproveReviewRequest): Promise<ApproveReviewResult> {
        admin(this.context);
        const c = root(this.store, this.context, contestId);
        const v = this.version(contestId, input.versionId, { ifMatch: input.etag });
        if (v.status !== VersionStatus.Value1)
            throw new RepositoryError(409, '仅待审核版本可通过');
        validate(v.payload, true);
        const oldId = c.publishedVersionId;
        const prior = this.store.versions.find((item: ContestVersion) => item.versionId === oldId && item.contestId === contestId);
        if (prior)
            this.diff(v, prior.payload, v.payload, true);
        else
            this.log(v, 'created', null, v.payload.name, true);
        if (prior)
            prior.isCurrent = false;
        v.status = VersionStatus.Value2;
        v.isCurrent = true;
        v.reviewedAt = this.store.now();
        v.reviewNote = null;
        this.stamp(v);
        c.publishedVersionId = v.versionId;
        c.updatedAt = this.store.now();
        c.contestStatus = statusAt(v.payload, c.contestStatus, this.store.now());
        this.store.reviews.push({ id: this.store.id('review'), contestId: contestId, versionId: v.versionId, reviewer: actor(this.context).id, time: this.store.now(), result: ReviewResult.Value0, rejectReason: null });
        this.log(v, 'review', VersionStatus.Value1, VersionStatus.Value2, false);
        return { publishedVersionId: v.versionId, contestStatus: c.contestStatus, previousVersionId: oldId, previousIsCurrent: false };
    }
    async reviewReject(contestId: string, input: RejectReviewRequest): Promise<RejectReviewResult> {
        admin(this.context);
        const c = root(this.store, this.context, contestId);
        const v = this.version(contestId, input.versionId, { ifMatch: input.etag });
        if (v.status !== VersionStatus.Value1)
            throw new RepositoryError(409, '仅待审核版本可驳回');
        if (!input.rejectReason.trim())
            throw new RepositoryError(422, '驳回原因必填');
        v.status = VersionStatus.Value3;
        v.reviewNote = input.rejectReason;
        v.reviewedAt = this.store.now();
        this.stamp(v);
        this.store.reviews.push({ id: this.store.id('review'), contestId: contestId, versionId: v.versionId, reviewer: actor(this.context).id, time: this.store.now(), result: ReviewResult.Value1, rejectReason: input.rejectReason });
        this.log(v, 'review', VersionStatus.Value1, VersionStatus.Value3, false);
        return { versionId: v.versionId, status: v.status, publishedVersionId: c.publishedVersionId };
    }
    async listPending(filter: ContestFilter): Promise<PendingReviewPage> {
        admin(this.context);
        const page = this.page(filter);
        const rows: PendingReviewItem[] = [];
        for (const v of this.store.versions) {
            const c = this.store.contests.find((item: Contest) => item.contestId === v.contestId && item.schoolId === actor(this.context).schoolId);
            if (c && v.status === VersionStatus.Value1 && this.matches(v.payload, c.contestStatus, filter)) {
                const org = this.store.organizations.find((o) => o.id === v.payload.organizationId);
                rows.push({ contestId: c.contestId, name: v.payload.name, organizationName: org ? org.name : '原通知未公布', versionId: v.versionId, etag: v.etag, submittedAt: v.submittedAt || '', incompleteFields: missing(v.payload) });
            }
        }
        const pn = page.page || 1;
        const size = page.pageSize || 20;
        const result: PendingReviewPage = { list: rows.slice((pn - 1) * size, pn * size), total: rows.length, page: pn, pageSize: size };
        return copy<PendingReviewPage>(result);
    }
    async listVersions(contestId: string, input: PageQuery): Promise<VersionPage> {
        owned(this.store, this.context, contestId);
        const p = this.page(input);
        const pn = p.page || 1;
        const size = p.pageSize || 20;
        const rows = this.store.versions.filter((v: ContestVersion) => v.contestId === contestId);
        const result: VersionPage = { list: rows.slice((pn - 1) * size, pn * size), total: rows.length, page: pn, pageSize: size };
        return copy<VersionPage>(result);
    }
    async getVersion(contestId: string, versionId: string): Promise<ContestVersion> {
        owned(this.store, this.context, contestId);
        const v = this.store.versions.find((item: ContestVersion) => item.contestId === contestId && item.versionId === versionId);
        if (!v)
            throw new RepositoryError(404, '版本不存在');
        return copy(v);
    }
    async getInternalAuditLog(contestId: string, changeType?: ChangeType): Promise<AuditLog[]> {
        admin(this.context);
        root(this.store, this.context, contestId);
        return copy(this.store.logs.filter((log: AuditLog) => log.contestId === contestId && (!changeType || log.changeType === changeType)));
    }
    async takedown(contestId: string, input: TakedownRequest): Promise<Contest> {
        admin(this.context);
        const c = root(this.store, this.context, contestId);
        if (!input.reason.trim())
            throw new RepositoryError(422, '下架原因必填');
        if (input.scope === TakedownScope.Value1)
            throw new RepositoryError(422, '仅公示下架请使用公示撤回接口');
        c.takedown = { reason: input.reason, at: this.store.now(), by: actor(this.context).id };
        c.updatedAt = this.store.now();
        this.aggregateLog(c, 'takedown', input.reason);
        return copy(c);
    }
    async restorePublication(contestId: string): Promise<Contest> {
        admin(this.context);
        const c = root(this.store, this.context, contestId);
        c.takedown = null;
        c.updatedAt = this.store.now();
        this.aggregateLog(c, 'restorePublication', '演示重新上架');
        return copy(c);
    }
    private aggregateLog(c: Contest, field: string, reason: string): void {
        if (!c.publishedVersionId)
            return;
        this.store.logs.push({ id: this.store.id('log'), contestId: c.contestId, versionId: c.publishedVersionId, operator: actor(this.context).id, time: this.store.now(), field: field, oldValue: null, newValue: field, reason: reason, changeType: ChangeType.Value1, visibility: Visibility.Value0 });
    }
    private diff(v: ContestVersion, a: ContestPayload, b: ContestPayload, publish: boolean): void {
        if (JSON.stringify(a.name) !== JSON.stringify(b.name))
            this.log(v, 'name', JSON.stringify(a.name), JSON.stringify(b.name), publish);
        if (JSON.stringify(a.category) !== JSON.stringify(b.category))
            this.log(v, 'category', JSON.stringify(a.category), JSON.stringify(b.category), publish);
        if (JSON.stringify(a.scopeType) !== JSON.stringify(b.scopeType))
            this.log(v, 'scopeType', JSON.stringify(a.scopeType), JSON.stringify(b.scopeType), publish);
        if (JSON.stringify(a.edition) !== JSON.stringify(b.edition))
            this.log(v, 'edition', JSON.stringify(a.edition), JSON.stringify(b.edition), publish);
        if (JSON.stringify(a.level) !== JSON.stringify(b.level))
            this.log(v, 'level', JSON.stringify(a.level), JSON.stringify(b.level), publish);
        if (JSON.stringify(a.applicableScope) !== JSON.stringify(b.applicableScope))
            this.log(v, 'applicableScope', JSON.stringify(a.applicableScope), JSON.stringify(b.applicableScope), publish);
        if (JSON.stringify(a.entryType) !== JSON.stringify(b.entryType))
            this.log(v, 'entryType', JSON.stringify(a.entryType), JSON.stringify(b.entryType), publish);
        if (JSON.stringify(a.sourceTitle) !== JSON.stringify(b.sourceTitle))
            this.log(v, 'sourceTitle', JSON.stringify(a.sourceTitle), JSON.stringify(b.sourceTitle), publish);
        if (JSON.stringify(a.sourceOrg) !== JSON.stringify(b.sourceOrg))
            this.log(v, 'sourceOrg', JSON.stringify(a.sourceOrg), JSON.stringify(b.sourceOrg), publish);
        if (JSON.stringify(a.sourceUrl) !== JSON.stringify(b.sourceUrl))
            this.log(v, 'sourceUrl', JSON.stringify(a.sourceUrl), JSON.stringify(b.sourceUrl), publish);
        if (JSON.stringify(a.sourcePublishedAt) !== JSON.stringify(b.sourcePublishedAt))
            this.log(v, 'sourcePublishedAt', JSON.stringify(a.sourcePublishedAt), JSON.stringify(b.sourcePublishedAt), publish);
        if (JSON.stringify(a.collectedAt) !== JSON.stringify(b.collectedAt))
            this.log(v, 'collectedAt', JSON.stringify(a.collectedAt), JSON.stringify(b.collectedAt), publish);
        if (JSON.stringify(a.lastVerifiedAt) !== JSON.stringify(b.lastVerifiedAt))
            this.log(v, 'lastVerifiedAt', JSON.stringify(a.lastVerifiedAt), JSON.stringify(b.lastVerifiedAt), publish);
        if (JSON.stringify(a.completeness) !== JSON.stringify(b.completeness))
            this.log(v, 'completeness', JSON.stringify(a.completeness), JSON.stringify(b.completeness), publish);
        if (JSON.stringify(a.regStart) !== JSON.stringify(b.regStart))
            this.log(v, 'regStart', JSON.stringify(a.regStart), JSON.stringify(b.regStart), publish);
        if (JSON.stringify(a.regEnd) !== JSON.stringify(b.regEnd))
            this.log(v, 'regEnd', JSON.stringify(a.regEnd), JSON.stringify(b.regEnd), publish);
        if (JSON.stringify(a.contestStart) !== JSON.stringify(b.contestStart))
            this.log(v, 'contestStart', JSON.stringify(a.contestStart), JSON.stringify(b.contestStart), publish);
        if (JSON.stringify(a.contestEnd) !== JSON.stringify(b.contestEnd))
            this.log(v, 'contestEnd', JSON.stringify(a.contestEnd), JSON.stringify(b.contestEnd), publish);
        if (JSON.stringify(a.publicityTime) !== JSON.stringify(b.publicityTime))
            this.log(v, 'publicityTime', JSON.stringify(a.publicityTime), JSON.stringify(b.publicityTime), publish);
        if (JSON.stringify(a.contestRequirement) !== JSON.stringify(b.contestRequirement))
            this.log(v, 'contestRequirement', JSON.stringify(a.contestRequirement), JSON.stringify(b.contestRequirement), publish);
        if (JSON.stringify(a.reviewRules) !== JSON.stringify(b.reviewRules))
            this.log(v, 'reviewRules', JSON.stringify(a.reviewRules), JSON.stringify(b.reviewRules), publish);
        if (JSON.stringify(a.awardSetting) !== JSON.stringify(b.awardSetting))
            this.log(v, 'awardSetting', JSON.stringify(a.awardSetting), JSON.stringify(b.awardSetting), publish);
        if (JSON.stringify(a.material) !== JSON.stringify(b.material))
            this.log(v, 'material', JSON.stringify(a.material), JSON.stringify(b.material), publish);
        if (JSON.stringify(a.entryMethod) !== JSON.stringify(b.entryMethod))
            this.log(v, 'entryMethod', JSON.stringify(a.entryMethod), JSON.stringify(b.entryMethod), publish);
        if (JSON.stringify(a.contact) !== JSON.stringify(b.contact))
            this.log(v, 'contact', JSON.stringify(a.contact), JSON.stringify(b.contact), publish);
        if (JSON.stringify(a.description) !== JSON.stringify(b.description))
            this.log(v, 'description', JSON.stringify(a.description), JSON.stringify(b.description), publish);
        if (JSON.stringify(a.creditApplicable) !== JSON.stringify(b.creditApplicable))
            this.log(v, 'creditApplicable', JSON.stringify(a.creditApplicable), JSON.stringify(b.creditApplicable), publish);
        if (JSON.stringify(a.creditBasis) !== JSON.stringify(b.creditBasis))
            this.log(v, 'creditBasis', JSON.stringify(a.creditBasis), JSON.stringify(b.creditBasis), publish);
        if (JSON.stringify(a.creditNote) !== JSON.stringify(b.creditNote))
            this.log(v, 'creditNote', JSON.stringify(a.creditNote), JSON.stringify(b.creditNote), publish);
        if (JSON.stringify(a.organizationId) !== JSON.stringify(b.organizationId))
            this.log(v, 'organizationId', JSON.stringify(a.organizationId), JSON.stringify(b.organizationId), publish);
        if (JSON.stringify(a.attachmentIds) !== JSON.stringify(b.attachmentIds))
            this.log(v, 'attachmentIds', JSON.stringify(a.attachmentIds), JSON.stringify(b.attachmentIds), publish);
    }
}
