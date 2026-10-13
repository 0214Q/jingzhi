import { PublicContest, PublicAuditLog, ChangeType, Winner, PublishedPublicity, PublicityResult } from '../models/Contracts';
import { ContestRepository } from '../repository/Repositories';
import { RepositoryError } from '../repository/RepositoryError';
export interface DetailState {
    detail: PublicContest | null;
    loading: boolean;
    error: string;
    errorCode: number;
}
export interface DetailRouteParams {
    contestId?: string;
}
export interface DetailSection {
    key: string;
    title: string;
    text: string;
}
export function initialDetailState(): DetailState { return { detail: null, loading: false, error: '', errorCode: 0 }; }
export function detailId(params: DetailRouteParams): string {
    return typeof params.contestId === 'string' && params.contestId.trim().length > 0 && params.contestId.length <= 128 ? params.contestId.trim() : '';
}
export function displayText(value: string | null): string { return value && value.trim() ? value : '原通知未公布'; }
export function timeText(value: string | null): string {
    if (!value)
        return '原通知未公布';
    if (!value.includes('T'))
        return value.replace(/-/g, '.') + '（原文仅日期）';
    const time = Date.parse(value);
    if (!Number.isFinite(time))
        return value;
    return new Date(time + 8 * 3600000).toISOString().slice(0, 16).replace('T', ' ').replace(/-/g, '.');
}
export function fieldLabel(field: string): string {
    switch (field) {
        case 'schedule': return '分阶段官方日程';
        case 'name': return '赛事名称';
        case 'category': return '分类';
        case 'scopeType': return '赛事归属';
        case 'edition': return '届次';
        case 'level': return '赛事层级';
        case 'applicableScope': return '适用对象';
        case 'entryType': return '信息录入方式';
        case 'sourceTitle': return '原通知标题';
        case 'sourceOrg': return '信息来源单位';
        case 'sourceUrl': return '原通知链接';
        case 'sourcePublishedAt': return '原文发布时间';
        case 'collectedAt': return '采集时间';
        case 'lastVerifiedAt': return '最近核对时间';
        case 'completeness': return '信息完整度';
        case 'regStart': return '报名开始';
        case 'regEnd': return '报名截止';
        case 'contestStart': return '比赛开始';
        case 'contestEnd': return '比赛结束';
        case 'publicityTime': return '公示时间';
        case 'contestRequirement': return '参赛要求';
        case 'reviewRules': return '评审规则';
        case 'awardSetting': return '奖项设置';
        case 'material': return '材料要求';
        case 'entryMethod': return '报名方式';
        case 'contact': return '联系方式';
        case 'description': return '赛事简介';
        case 'creditApplicable': return '第二课堂适用性';
        case 'creditBasis': return '第二课堂依据';
        case 'creditNote': return '第二课堂说明';
        case 'organizationId': return '主办单位';
        case 'attachmentIds': return '附件';
        case 'created': return '首次发布';
        case 'takedown': return '赛事下架';
        case 'restorePublication': return '赛事重新上架';
        default: return '其他信息';
    }
}
export function incompleteText(d: PublicContest): string {
    return d.incompleteFields.length > 0 ? '待补充：' + d.incompleteFields.map((field: string) => fieldLabel(field)).join('、') + '。原通知未公布的内容不会推测补全。' : '';
}
export function auditValue(value: string | null): string {
    if (value === null || value === 'null')
        return '原通知未公布';
    try {
        const text = JSON.parse(value) as string;
        return typeof text === 'string' ? text : value;
    }
    catch {
        return value;
    }
}
export function publicLogs(d: PublicContest, type: ChangeType | null): PublicAuditLog[] {
    return d.auditLogs.filter((log: PublicAuditLog) => type === null || log.changeType === type).slice().sort((a: PublicAuditLog, b: PublicAuditLog) => Date.parse(b.time) - Date.parse(a.time));
}
export function safeSourceUrl(value: string | null): string | null {
    if (!value || !/^https?:\/\/[^\s]+$/i.test(value))
        return null;
    // Disallow embedded credentials and non-network schemes; source text is never executed as HTML.
    const host = value.replace(/^https?:\/\//i, '').split('/')[0];
    return host.includes('@') ? null : value;
}
export function isDemoUrl(value: string): boolean { return /^https?:\/\/example\.invalid(?:[/:]|$)/i.test(value); }
function winnersText(rows: Winner[]): string {
    return rows.length === 0 ? '暂无已公开获奖名单' : rows.map((w: Winner) => w.award + ' · ' + w.name + (w.workTitle ? '\n作品：' + w.workTitle : '') + (w.organizationName ? '\n单位：' + w.organizationName : '')).join('\n\n');
}
export function currentPublicityText(result: PublicityResult): string {
    const current = result.current;
    if (current === null)
        return '当前暂无已公开公示';
    return winnersText(current.winners) + '\n\n评审办法：' + (current.rule || '暂无已公开评审办法') + '\n\n评分标准：' + (current.standard || '暂无已公开评分标准');
}
export function publicityTabText(result: PublicityResult, tab: string): string {
    const current = result.current;
    if (current === null)
        return '当前暂无已公开公示';
    if (tab === 'rule')
        return current.rule || '暂无已公开评审办法';
    if (tab === 'standard')
        return current.standard || '暂无已公开评分标准';
    return winnersText(current.winners);
}
export function historicalPublicityText(p: PublishedPublicity): string {
    if (typeof p.content === 'string')
        return p.content;
    return (p.content.text ? p.content.text + '\n' : '') + (p.content.winners.length ? winnersText(p.content.winners) : '') || '暂无公示内容';
}
export function detailSections(d: PublicContest): DetailSection[] {
    const p = d.data;
    const scope = p.applicableScope;
    return [
        { key: 'basic', title: '基本信息', text: '主办方：' + d.organizationName + '\n赛事届次：' + displayText(p.edition) + '\n层级：' + displayText(p.level) + '\n联系方式：' + displayText(p.contact) + '\n简介：' + displayText(p.description) },
        { key: 'scope', title: '适用对象', text: '学院：' + (scope.colleges.length ? scope.colleges.join('、') : '以原通知为准') + '\n专业：' + (scope.majors.length ? scope.majors.join('、') : '以原通知为准') + '\n年级：' + (scope.grades.length ? scope.grades.join('、') : '以原通知为准') + '\n学历：' + (scope.degrees.length ? scope.degrees.join('、') : '以原通知为准') + '\n校区：' + (scope.campuses.length ? scope.campuses.join('、') : '以原通知为准') + '\n说明：' + displayText(scope.applicableNote) },
        { key: 'schedule', title: '时间安排', text: (p.schedule || []).map((s) => s.stage + '：' + timeText(s.value) + '（北京时间）\n来源：' + s.sourceUrl).join('\n') + ((p.schedule || []).length ? '\n\n' : '') + '报名开始：' + timeText(p.regStart) + '\n报名截止：' + timeText(p.regEnd) + '\n比赛开始：' + timeText(p.contestStart) + '\n比赛结束：' + timeText(p.contestEnd) + '\n公示时间：' + timeText(p.publicityTime) },
        { key: 'requirement', title: '参赛要求', text: displayText(p.contestRequirement) + '\n\n材料要求：' + displayText(p.material) + (p.attachmentIds.length ? '\n通知附件请查看原通知。' : '') },
        { key: 'rules', title: '评审规则', text: displayText(p.reviewRules) },
        { key: 'award', title: '奖项与第二课堂', text: displayText(p.awardSetting) + '\n\n第二课堂成绩单（到梦空间）\n是否适用：' + p.creditApplicable + '\n依据：' + displayText(p.creditBasis) + '\n说明：' + displayText(p.creditNote) + '\n以主办方最终认定为准，平台不作加分承诺。' },
        { key: 'entry', title: '报名方式', text: displayText(p.entryMethod) + '\n\n仅展示报名方式，以原通知为准。平台不提供站内报名。' }
    ];
}
export class ContestDetailController {
    private repository: ContestRepository;
    private onChange: (state: DetailState) => void;
    private state: DetailState = initialDetailState();
    private requestId: number = 0;
    private id: string = '';
    constructor(repository: ContestRepository, onChange: (state: DetailState) => void) { this.repository = repository; this.onChange = onChange; }
    snapshot(): DetailState { return { detail: this.state.detail, loading: this.state.loading, error: this.state.error, errorCode: this.state.errorCode }; }
    dispose(): void { this.requestId += 1; }
    async load(contestId: string): Promise<void> {
        this.id = contestId;
        const id = ++this.requestId;
        this.state = initialDetailState();
        this.state.loading = true;
        this.onChange(this.snapshot());
        try {
            if (!contestId)
                throw new RepositoryError(422, '缺少赛事信息');
            const detail = await this.repository.getPublicVersion(contestId);
            if (id !== this.requestId)
                return;
            this.state.detail = detail;
        }
        catch (error) {
            if (id !== this.requestId)
                return;
            this.state.errorCode = error instanceof RepositoryError ? error.code : 500;
            if (this.state.errorCode === 404)
                this.state.error = '赛事不存在或尚未发布。';
            else if (this.state.errorCode === 403)
                this.state.error = '你无法访问这场赛事。';
            else if (this.state.errorCode === 401)
                this.state.error = '登录已失效，请返回首页。';
            else if (this.state.errorCode === 422)
                this.state.error = '缺少有效的赛事信息，请返回列表。';
            else
                this.state.error = '暂时无法读取赛事详情，请重试。';
        }
        finally {
            if (id === this.requestId) {
                this.state.loading = false;
                this.onChange(this.snapshot());
            }
        }
    }
    async refresh(): Promise<void> { await this.load(this.id); }
}
