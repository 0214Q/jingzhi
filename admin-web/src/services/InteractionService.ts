import { FavoriteRepository, ContestRepository } from '../repository/Repositories';
import { Favorite, PublicContest } from '../models/contracts';
export interface FavoriteView {
    favorite: Favorite;
    name: string;
}
export interface FavoriteViewPage {
    list: FavoriteView[];
    total: number;
}
export class InteractionService {
    private favorites: FavoriteRepository;
    private contests: ContestRepository;
    constructor(favorites: FavoriteRepository, contests: ContestRepository) { this.favorites = favorites; this.contests = contests; }
    async isFavorite(id: string): Promise<boolean> { let page = 1; while (true) {
        const result = await this.favorites.listMine({ page, pageSize: 100 });
        if (result.list.some(f => f.contestId === id))
            return true;
        if (page * result.pageSize >= result.total)
            return false;
        page += 1;
    } }
    async list(page: number): Promise<FavoriteViewPage> { const result = await this.favorites.listMine({ page, pageSize: 20 }); const rows: FavoriteView[] = []; for (const favorite of result.list) {
        let detail: PublicContest | null = null;
        if (favorite.available)
            detail = await this.contests.getPublicVersion(favorite.contestId);
        rows.push({ favorite, name: detail ? detail.data.name : '已失效赛事 · ' + favorite.contestId });
    } return { list: rows, total: result.total }; }
}
