import { FavoriteRepository, FeedbackRepository } from '../repository/Repositories';
import { InteractionService } from './InteractionService';
class InteractionProvider {
 private favorites: FavoriteRepository | null = null;
 private feedback: FeedbackRepository | null = null;
 private service: InteractionService | null = null;
 configure(favorites: FavoriteRepository, feedback: FeedbackRepository, service: InteractionService): void { this.favorites = favorites; this.feedback = feedback; this.service = service; }
 getFavorites(): FavoriteRepository { if (this.favorites === null) throw new Error('收藏服务未配置'); return this.favorites; }
 getFeedback(): FeedbackRepository { if (this.feedback === null) throw new Error('反馈服务未配置'); return this.feedback; }
 getService(): InteractionService { if (this.service === null) throw new Error('互动服务未配置'); return this.service; }
}
export const interactionProvider = new InteractionProvider();
