import { Category, ContestStatus, ContestSummary, ContestFilter, ContestPage, MonthMode } from '../models/Contracts';
import { ContestRepository } from '../repository/Repositories';
export interface ListQuery {
    datedOnly?: boolean;
    keyword: string;
    category: Category | null;
    status: ContestStatus | null;
    month: string | null;
    monthMode: MonthMode;
    sort: string;
}
export interface ListState {
    query: ListQuery;
    items: ContestSummary[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
    error: string;
    moreError: string;
}
export interface ListRouteParams {
    datedOnly?: boolean;
    keyword?: string;
    category?: Category;
    status?: ContestStatus;
    month?: string;
    monthMode?: MonthMode;
    sort?: string;
}
export function defaultListQuery(): ListQuery { return { keyword: '', category: null, status: null, month: null, monthMode: MonthMode.Value0, sort: '-updatedAt' }; }
export function copyQuery(q: ListQuery): ListQuery { return { datedOnly: q.datedOnly, keyword: q.keyword, category: q.category, status: q.status, month: q.month, monthMode: q.monthMode, sort: q.sort }; }
export function routeQuery(params: ListRouteParams): ListQuery {
    const q = defaultListQuery();
    if (typeof params.datedOnly === 'boolean') q.datedOnly = params.datedOnly;
    if (typeof params.keyword === 'string')
        q.keyword = params.keyword;
    if (params.category && [Category.Value0, Category.Value1, Category.Value2, Category.Value3, Category.Value4].includes(params.category))
        q.category = params.category;
    if (params.status && [ContestStatus.Value0, ContestStatus.Value1, ContestStatus.Value2, ContestStatus.Value3, ContestStatus.Value4, ContestStatus.Value5, ContestStatus.Value6].includes(params.status))
        q.status = params.status;
    if (params.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month))
        q.month = params.month;
    if (params.monthMode === MonthMode.Value1)
        q.monthMode = params.monthMode;
    if (params.sort === 'regEnd')
        q.sort = 'regEnd';
    return q;
}
export function listTitle(q: ListQuery): string {
    return q.month ? q.month.slice(0, 4) + ' 年 ' + q.month.slice(5) + ' 月竞赛' : '赛事';
}
export function emptyText(q: ListQuery): string { return q.month ? '该月暂无符合条件的赛事' : '没有找到符合条件的赛事'; }
export function toFilter(q: ListQuery, page: number, pageSize: number): ContestFilter {
    const f: ContestFilter = { keyword: q.keyword.trim(), sort: q.sort, page: page, pageSize: pageSize };
    if (q.datedOnly !== undefined) f.datedOnly = q.datedOnly;
    if (q.category !== null)
        f.category = q.category;
    if (q.status !== null)
        f.contestStatus = q.status;
    if (q.month !== null) {
        f.month = q.month;
        f.monthMode = q.monthMode;
    }
    return f;
}
export function initialListState(): ListState { return { query: defaultListQuery(), items: [], total: 0, page: 0, pageSize: 10, totalPages: 0, hasMore: false, loading: false, loadingMore: false, error: '', moreError: '' }; }
export function visiblePageNumbers(page: number, totalPages: number): number[] {
    const pages: number[] = [];
    if (totalPages < 1) return pages;
    const start: number = Math.max(1, Math.min(page - 2, totalPages - 4));
    for (let value: number = start; value <= Math.min(totalPages, start + 4); value += 1) pages.push(value);
    return pages;
}
// Each page replaces the visible rows. Request generations discard stale replies.
export class ContestListController {
    private repository: ContestRepository;
    private onChange: (state: ListState) => void;
    private pageSize: number;
    private state: ListState = initialListState();
    private requestId: number = 0;
    constructor(repository: ContestRepository, onChange: (state: ListState) => void, pageSize: number = 10) {
        if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('无效每页数量');
        this.repository = repository; this.onChange = onChange; this.pageSize = pageSize;
    }
    snapshot(): ListState {
        return { query: copyQuery(this.state.query), items: this.state.items.slice(), total: this.state.total, page: this.state.page, pageSize: this.pageSize, totalPages: this.state.totalPages, hasMore: this.state.hasMore, loading: this.state.loading, loadingMore: false, error: this.state.error, moreError: this.state.moreError };
    }
    private emit(): void { this.onChange(this.snapshot()); }
    dispose(): void { this.requestId += 1; }
    async setQuery(query: ListQuery, page: number = 1): Promise<void> {
        this.state = initialListState(); this.state.query = copyQuery(query); this.state.pageSize = this.pageSize;
        await this.fetchPage(Number.isInteger(page) && page > 0 ? page : 1);
    }
    private async fetchPage(target: number): Promise<void> {
        const id: number = ++this.requestId; const query: ListQuery = copyQuery(this.state.query);
        this.state.loading = true; this.state.error = ''; this.state.moreError = ''; this.emit();
        try {
            let page: number = target;
            let result: ContestPage = await this.repository.listPublished(toFilter(query, page, this.pageSize));
            if (id !== this.requestId) return;
            // Records may be removed while the user is on the last page.
            const last: number = Math.max(1, Math.ceil(result.total / this.pageSize));
            if (page > last) { page = last; result = await this.repository.listPublished(toFilter(query, page, this.pageSize)); }
            if (id !== this.requestId) return;
            if (page > Math.max(1, Math.ceil(result.total / this.pageSize))) throw new Error('赛事数量已改变');
            this.state.items = result.list; this.state.total = result.total; this.state.page = page;
            this.state.totalPages = Math.ceil(result.total / this.pageSize); this.state.hasMore = page < this.state.totalPages;
        } catch {
            if (id !== this.requestId) return;
            if (this.state.page === 0) this.state.error = '暂时无法读取赛事，请重试。';
            else this.state.moreError = '读取第 ' + target.toString() + ' 页失败，当前页已保留，请重试。';
        } finally { if (id === this.requestId) { this.state.loading = false; this.emit(); } }
    }
    async goToPage(page: number): Promise<void> {
        if (!Number.isInteger(page) || page < 1 || this.state.totalPages < 1 || page > this.state.totalPages) return;
        await this.fetchPage(page);
    }
    async previousPage(): Promise<void> { if (this.state.page > 1) await this.goToPage(this.state.page - 1); }
    async nextPage(): Promise<void> { if (this.state.hasMore) await this.goToPage(this.state.page + 1); }
    async refresh(): Promise<void> { await this.fetchPage(Math.max(1, this.state.page)); }
    // Retained for older callers; it now navigates instead of appending rows.
    async loadMore(): Promise<void> { await this.nextPage(); }
}
