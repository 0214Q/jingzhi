import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContestRepositoryProvider } from '../admin-web/src/services/repositories';
import type { ContestRepository } from '../admin-web/src/repository/Repositories';
test('未注入实现时明确失败，不伪造空数据', () => {
  assert.throws(() => new ContestRepositoryProvider().get(), /数据源尚未配置/);
});
test('页面通过同一接口使用替换后的数据源', async () => {
  const provider = new ContestRepositoryProvider();
  const first = { listPublished: async () => ({ list: [], total: 2, page: 1, pageSize: 20 }) } as unknown as ContestRepository;
  const second = { listPublished: async () => ({ list: [], total: 5, page: 1, pageSize: 20 }) } as unknown as ContestRepository;
  provider.configure(first);
  assert.equal((await provider.get().listPublished({})).total, 2);
  provider.configure(second);
  assert.equal((await provider.get().listPublished({})).total, 5);
});
