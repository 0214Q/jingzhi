import { Contest, ContestVersion, AuditLog, Publicity, ReviewRecord, Organization, User, Favorite, Feedback } from './contracts';
import { makeSeeds, makeUsers, makeOrganizations } from './MockSeeds';
export function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export class MockStore {
  unselectedDraftFields: Record<string, string[]> = {};
  favorites: Favorite[] = [];
  feedback: Feedback[] = [];
  contests: Contest[] = [];
  versions: ContestVersion[] = [];
  logs: AuditLog[] = [];
  publicity: Publicity[] = [];
  reviews: ReviewRecord[] = [];
  organizations: Organization[] = makeOrganizations();
  users: User[] = makeUsers();
  withdrawnTypes: string[] = [];
  publicityActions: PublicityAction[] = [];
  private serial: number = 1000;
  constructor() { makeSeeds(this); }
  id(prefix: string): string { this.serial += 1; return prefix + '-' + this.serial.toString(); }
  now(): string { return "2026-10-10T10:00:00+08:00"; }
}
export class MockContext {
  user: User | null = null;
  expiresAt: number = 0;
}

export interface PublicityAction { action: string; id: string; publicityId: string; operator: string; reason: string; time: string; }
