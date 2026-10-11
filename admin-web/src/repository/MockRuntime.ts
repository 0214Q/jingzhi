import { MockFavoriteRepository, MockFeedbackRepository } from './MockInteractionRepository';
import { MockStore, MockContext } from './MockStore';
import { MockAuthRepository } from './MockAuthRepository';
import { MockContestRepository } from './MockContestRepository';
import { MockPublicityRepository } from './MockPublicityRepository';
export class MockRuntime {
  store: MockStore;
  context: MockContext = new MockContext();
  favorites: MockFavoriteRepository;
  feedback: MockFeedbackRepository;
  auth: MockAuthRepository;
  contests: MockContestRepository;
  publicity: MockPublicityRepository;
  constructor(store: MockStore = new MockStore()) {
    this.store=store;
    this.favorites=new MockFavoriteRepository(store,this.context);
    this.feedback=new MockFeedbackRepository(store,this.context);
    this.auth=new MockAuthRepository(store,this.context);
    this.contests=new MockContestRepository(store,this.context);
    this.publicity=new MockPublicityRepository(store,this.context);
  }
}
