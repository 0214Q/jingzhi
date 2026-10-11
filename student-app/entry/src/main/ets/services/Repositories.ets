import { ContestRepository } from '../repository/Repositories';
export class ContestRepositoryProvider {
  private repository: ContestRepository | null = null;
  configure(repository: ContestRepository): void {
    this.repository = repository;
  }
  get(): ContestRepository {
    const repository = this.repository;
    if (repository === null) {
      throw new Error('数据源尚未配置，请在下一步接入 Mock Repository');
    }
    return repository;
  }
}
export const contestRepositoryProvider = new ContestRepositoryProvider();
