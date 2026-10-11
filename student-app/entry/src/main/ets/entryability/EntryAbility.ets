import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { Role } from '../models/Contracts';
import { ArkHttpTransport } from '../repository/ArkHttpTransport';
import {
  HttpAuthRepository,
  HttpContestRepository,
  HttpFavoriteRepository,
  HttpFeedbackRepository
} from '../repository/HttpRepositories';
import { API_BASE_URL } from '../services/ApiConfig';
import { contestRepositoryProvider } from '../services/Repositories';
import { interactionProvider } from '../services/InteractionProvider';
import { InteractionService } from '../services/InteractionService';
import { SessionService } from '../services/SessionService';
import { sessionServiceProvider } from '../services/SessionProvider';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    const transport: ArkHttpTransport = new ArkHttpTransport(
      API_BASE_URL,
      () => sessionServiceProvider.get().authorizationHeader()
    );

    const auth: HttpAuthRepository = new HttpAuthRepository(transport);
    const contests: HttpContestRepository = new HttpContestRepository(transport);
    const favorites: HttpFavoriteRepository = new HttpFavoriteRepository(transport);
    const feedback: HttpFeedbackRepository = new HttpFeedbackRepository(transport);

    sessionServiceProvider.configure(
      new SessionService(auth, [Role.Value0])
    );

    contestRepositoryProvider.configure(contests);

    interactionProvider.configure(
      favorites,
      feedback,
      new InteractionService(favorites, contests)
    );

    windowStage.loadContent('pages/Login');
  }
}