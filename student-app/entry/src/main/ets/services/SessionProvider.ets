import { SessionService } from './SessionService';
export class SessionServiceProvider {
  private service: SessionService | null = null;
  configure(service: SessionService): void { this.service = service; }
  get(): SessionService {
    if (this.service === null) throw new Error('登录服务尚未初始化');
    return this.service;
  }
}
export const sessionServiceProvider = new SessionServiceProvider();
