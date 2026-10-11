import { Category, ContestStatus, ContestSummary, ContestFilter, ContestPage, MonthMode } from './contracts';
import { ContestRepository } from './Repositories';
export interface ListQuery {
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
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
    error: string;
    moreError: string;
}
export interface ListRouteParams {
    keyword?: string;
    category?: Category;
    status?: ContestStatus;
    month?: string;
    monthMode?: MonthMode;
    sort?: string;
}
export function defaultListQuery(): ListQuery { return { keyword: '', category: null, status: null, month: null, monthMode: MonthMode.Value0, sort: '-updatedAt' }; }
export function copyQuery(q: ListQuery): ListQuery { return { keyword: q.keyword, category: q.category, status: q.status, month: q.month, monthMode: q.monthMode, sort: q.sort }; }
export function routeQuery(params: ListRouteParams): ListQuery {
    const q = defaultListQuery();
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
export function initialListState(): ListState { return { query: defaultListQuery(), items: [], total: 0, page: 0, hasMore: false, loading: false, loadingMore: false, error: '', moreError: '' }; }
// The controller owns request ordering. Pages only render snapshots and send filter actions.
export class ContestListController {
    private repository: ContestRepository;
    private onChange: (state: ListState) => void;
    private pageSize: number;
    private state: ListState = initialListState();
    private requestId: number = 0;
    constructor(repository: ContestRepository, onChange: (state: ListState) => void, pageSize: number = 10) { this.repository = repository; this.onChange = onChange; this.pageSize = pageSize; }
    snapshot(): ListState {
        return { query: copyQuery(this.state.query), items: this.state.items.slice(), total: this.state.total, page: this.state.page, hasMore: this.state.hasMore, loading: this.state.loading, loadingMore: this.state.loadingMore, error: this.state.error, moreError: this.state.moreError };
    }
    private emit(): void { this.onChange(this.snapshot()); }
    dispose(): void { this.requestId += 1; }
    async setQuery(query: ListQuery): Promise<void> {
        const id = ++this.requestId;
        this.state = initialListState();
        this.state.query = copyQuery(query);
        this.state.loading = true;
        this.emit();
        try {
            const result: ContestPage = await this.repository.listPublished(toFilter(query, 1, this.pageSize));
            if (id !== this.requestId)
                return;
            this.state.items = result.list;
            this.state.total = result.total;
            this.state.page = 1;
            this.state.hasMore = result.list.length > 0 && result.page * result.pageSize < result.total;
        }
        catch {
            if (id !== this.requestId)
                return;
            this.state.error = '暂时无法读取赛事，请重试。';
        }
        finally {
            if (id === this.requestId) {
                this.state.loading = false;
                this.emit();
            }
        }
    }
    async refresh(): Promise<void> { await this.setQuery(this.state.query); }
    async loadMore(): Promise<void> {
        if (this.state.loading || this.state.loadingMore || !this.state.hasMore)
            return;
        const id = this.requestId;
        const page = this.state.page + 1;
        this.state.loadingMore = true;
        this.state.moreError = '';
        this.emit();
        try {
            const result: ContestPage = await this.repository.listPublished(toFilter(this.state.query, page, this.pageSize));
            if (id !== this.requestId)
                return;
            for (const item of result.list)
                if (!this.state.items.some((v: ContestSummary) => v.contestId === item.contestId))
                    this.state.items.push(item);
            this.state.page = page;
            this.state.total = result.total;
            this.state.hasMore = result.list.length > 0 && result.page * result.pageSize < result.total;
        }
        catch {
            if (id !== this.requestId)
                return;
            this.state.moreError = '加载下一页失败，请重试。';
        }
        finally {
            if (id === this.requestId) {
                this.state.loadingMore = false;
                this.emit();
            }
        }
    }
}
