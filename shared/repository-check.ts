import type { ContestRepository } from '../admin-web/src/repository/Repositories';
export async function verify(repo: ContestRepository): Promise<void> {
  const published = await repo.getPublicVersion('DEMO');
  // @ts-expect-error 公开详情无内部审核备注
  published.reviewNote;
  const logs = await repo.getPublicAuditLog('DEMO');
  // @ts-expect-error 公共日志不能携带内部审核备注
  logs[0].reviewNote;
  // @ts-expect-error 提交审核必须带锁
  await repo.submitReview('DEMO', 'v1');
  await repo.submitReview('DEMO', 'v1', { ifMatch: 'e1' });
  // @ts-expect-error 审核必须带 etag
  await repo.reviewApprove('DEMO', { versionId: 'v1' });
}
