import { Category, ContestFilter, ContestStatus, ContestSummary, ContestPage } from '../models/Contracts';
import { ContestRepository } from '../repository/Repositories';
export interface HomeQuery {
    keyword: string;
    category: Category | null;
}
export interface HomeData {
    urgent: ContestSummary[];
    latest: ContestSummary[];
    total: number;
}
export interface HomeConfig {
    title: string;
    schoolName: string;
    primaryColor: string;
    demo: boolean;
    datedOnly?: boolean;
    now: string;
}
export const demoHomeConfig: HomeConfig = { title: '竞知', schoolName: '河南大学', primaryColor: '#2C7BE5', demo: true, now: '2026-10-10T10:00:00+08:00' };
export function deadlineText(value: string | null): string {
    if (!value)
        return '原通知未公布';
    return value.includes('T') ? value.slice(0, 10).replace(/-/g, '.') + ' ' + value.slice(11, 16) : value.replace(/-/g, '.') + '（原文仅日期）';
}
export function daysUntil(value: string | null, now: string): number | null {
    if (!value)
        return null;
    const today = new Date(Date.parse(now) + 8 * 3600000).toISOString().slice(0, 10);
    return Math.round((Date.parse(value.slice(0, 10) + 'T00:00:00+08:00') - Date.parse(today + 'T00:00:00+08:00')) / 86400000);
}
export function deadlineHint(value: string | null, now: string): string {
    const days = daysUntil(value, now);
    if (days === null)
        return '截止时间待公布';
    if (days < 0 || (value?.includes('T') && Date.parse(value) < Date.parse(now)))
        return '报名已截止';
    if (days === 0)
        return '今天截止';
    return '还有 ' + days.toString() + ' 天截止';
}
export function scopeText(item: ContestSummary): string {
    const scope = item.applicableScope;
    const parts: string[] = [];
    if (scope.colleges.length > 0)
        parts.push(scope.colleges.join('、'));
    if (scope.degrees.length > 0)
        parts.push(scope.degrees.join('、'));
    if (scope.grades.length > 0)
        parts.push(scope.grades.join('、'));
    return parts.length > 0 ? parts.join(' · ') : scope.applicableNote || '以原通知为准';
}
export class HomeService {
    private repository: ContestRepository;
    private config: HomeConfig;
    constructor(repository: ContestRepository, config: HomeConfig) { this.repository = repository; this.config = config; }
    async load(query: HomeQuery): Promise<HomeData> {
        const latestFilter: ContestFilter = { keyword: query.keyword.trim(), page: 1, pageSize: 4, sort: '-updatedAt' };
        if (query.category !== null)
            latestFilter.category = query.category;
        if (this.config.datedOnly !== undefined) latestFilter.datedOnly = this.config.datedOnly;
        const urgentFilter: ContestFilter = { keyword: query.keyword.trim(), page: 1, pageSize: 100, sort: 'regEnd' };
        if (query.category !== null)
            urgentFilter.category = query.category;
        if (this.config.datedOnly !== undefined) urgentFilter.datedOnly = this.config.datedOnly;
        const latest = await this.repository.listPublished(latestFilter);
        const urgent: ContestSummary[] = [];
        let page = 1;
        let total = 0;
        do {
            urgentFilter.page = page;
            const result: ContestPage = await this.repository.listPublished(urgentFilter);
            total = result.total;
            for (const item of result.list) {
                const days = daysUntil(item.regEnd, this.config.now);
                if (days !== null && days >= 0 && days <= 7 && (!item.regEnd?.includes('T') || Date.parse(item.regEnd) >= Date.parse(this.config.now)))
                    urgent.push(item);
            }
            page += 1;
            // An empty page ends scanning rather than looping on an inconsistent backend total.
            if (result.list.length === 0)
                break;
        } while ((page - 1) * 100 < total && urgent.length < 3);
        return { urgent: urgent.slice(0, 3), latest: latest.list, total: latest.total };
    }
}
