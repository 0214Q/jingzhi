import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MockRuntime } from '../admin-web/src/repository/MockRuntime';
import { MockStore } from '../admin-web/src/repository/MockStore';
import { demoPayload } from '../admin-web/src/repository/MockSeeds';
import { RepositoryError } from '../admin-web/src/repository/RepositoryError';
import { ChangeType, VersionStatus, Role, PublicityType, EntryType, Completeness, CreditApplicable, TakedownScope } from '../admin-web/src/models/contracts';
import type { CreateDraftRequest } from '../admin-web/src/models/contracts';
async function setup() {
 const store=new MockStore();const editor=new MockRuntime(store);const admin=new MockRuntime(store);const student=new MockRuntime(store);const organizer=new MockRuntime(store);
 for(const [runtime,account] of [[editor,'editor'],[admin,'admin'],[student,'student'],[organizer,'organizer']] as const) await runtime.auth.login({account,password:'demo123'});
 return {store,editor,admin,student,organizer};
}
const errorCode=(code:number)=>(error:unknown)=>error instanceof RepositoryError&&error.code===code;
function form(index=1): CreateDraftRequest { return {...demoPayload(index),changeType:ChangeType.Value1,reason:'演示录入'}; }
test('种子仅公开14条，草稿/待审/驳回/下架不进入公开列表；日期精度保留',async()=>{
 const {student}=await setup();const list=await student.contests.listPublished({});assert.equal(list.total,14);
 for(const id of ['DEMO-16','DEMO-17','DEMO-18']) await assert.rejects(student.contests.getPublicVersion(id),errorCode(404));
 assert.equal((await student.contests.getPublicVersion('DEMO-1')).regEndHasTime,true);
 assert.equal((await student.contests.getPublicVersion('DEMO-2')).regEndHasTime,false);
 assert.equal((await student.contests.getPublicVersion('DEMO-3')).data.reviewRules,null);
 assert.equal((await student.contests.getPublicVersion('DEMO-3')).completeness,Completeness.Value1);
 assert.equal((await student.contests.getPublicVersion('DEMO-15')).takedown?.reason,'演示下架');
});
test('派生→编辑→待审→驳回→修改重提→通过：旧公开版持续可见，最终只切换一次',async()=>{
 const {editor,admin,student,store}=await setup();const original=await student.contests.getPublicVersion('DEMO-1');
 const base=await editor.contests.getVersion('DEMO-1',original.publishedVersionId);
 let draft=await editor.contests.deriveVersion('DEMO-1',{changeType:ChangeType.Value0,reason:'演示原通知变更'},{ifMatch:base.etag});
 draft=await editor.contests.updateDraft('DEMO-1',draft.versionId,{...form(),name:'【演示】修订名称',reason:'内部第一次错误输入',changeType:ChangeType.Value0},{ifMatch:draft.etag});
 await editor.contests.submitReview('DEMO-1',draft.versionId,{ifMatch:draft.etag});
 assert.deepEqual(await student.contests.getPublicVersion('DEMO-1'),original);
 let current=await editor.contests.getVersion('DEMO-1',draft.versionId);
 await admin.contests.reviewReject('DEMO-1',{versionId:current.versionId,etag:current.etag,rejectReason:'内部审核备注不应公开'});
 assert.deepEqual(await student.contests.getPublicVersion('DEMO-1'),original);
 current=await editor.contests.getVersion('DEMO-1',draft.versionId);assert.equal(current.status,VersionStatus.Value3);
 draft=await editor.contests.updateDraft('DEMO-1',draft.versionId,{...form(),name:'【演示】最终名称',reason:'按原通知核对',changeType:ChangeType.Value0},{ifMatch:current.etag});
 assert.equal(draft.status,VersionStatus.Value3);
 await editor.contests.submitReview('DEMO-1',draft.versionId,{ifMatch:draft.etag});current=await editor.contests.getVersion('DEMO-1',draft.versionId);
 const result=await admin.contests.reviewApprove('DEMO-1',{versionId:current.versionId,etag:current.etag});
 assert.equal(result.previousVersionId,original.publishedVersionId);
 const published=await student.contests.getPublicVersion('DEMO-1');assert.equal(published.data.name,'【演示】最终名称');
 assert.equal(published.publishedVersionId,draft.versionId);
 const change=published.auditLogs.find(log=>log.versionId===draft.versionId&&log.field==='name')!;
 assert.equal(change.oldValue,JSON.stringify(original.data.name));assert.equal(change.newValue,JSON.stringify('【演示】最终名称'));
 assert.equal(change.changeType,ChangeType.Value0);assert.equal(change.operator,'editor');
 assert.ok(!JSON.stringify(published).includes('内部审核备注'));assert.ok(!JSON.stringify(published).includes('内部第一次错误输入'));
 assert.equal(store.reviews.filter(r=>r.contestId==='DEMO-1').length,2);
 assert.equal(store.versions.filter(v=>v.contestId==='DEMO-1'&&v.isCurrent).length,1);
 assert.equal((await admin.contests.getVersion('DEMO-1',original.publishedVersionId)).isCurrent,false);
});
test('过期etag、待审编辑、重复通过、空驳回均失败且不修改公开版',async()=>{
 const {editor,admin,student}=await setup();const before=await student.contests.getPublicVersion('DEMO-1');const v=await editor.contests.getVersion('DEMO-1',before.publishedVersionId);
 const d=await editor.contests.deriveVersion('DEMO-1',{changeType:ChangeType.Value1,reason:'纠错'},{ifMatch:v.etag});
 await assert.rejects(editor.contests.submitReview('DEMO-1',d.versionId,{ifMatch:'stale'}),errorCode(409));
 await editor.contests.submitReview('DEMO-1',d.versionId,{ifMatch:d.etag});
 await assert.rejects(editor.contests.updateDraft('DEMO-1',d.versionId,form(),{ifMatch:d.etag}),errorCode(409));
 const pending=await editor.contests.getVersion('DEMO-1',d.versionId);
 await assert.rejects(admin.contests.reviewReject('DEMO-1',{versionId:d.versionId,etag:pending.etag,rejectReason:' '}),errorCode(422));
 await assert.rejects(admin.contests.reviewApprove('DEMO-1',{versionId:d.versionId,etag:d.etag}),errorCode(409));
 assert.deepEqual(await student.contests.getPublicVersion('DEMO-1'),before);
 await admin.contests.reviewApprove('DEMO-1',{versionId:d.versionId,etag:pending.etag});
 const approved=await admin.contests.getVersion('DEMO-1',d.versionId);
 await assert.rejects(admin.contests.reviewApprove('DEMO-1',{versionId:d.versionId,etag:approved.etag}),errorCode(409));
});
test('权限：学生不能写、整理不能审核、组织/学校隔离、登出失效',async()=>{
 const {student,editor,admin,organizer}=await setup();await assert.rejects(student.contests.createDraft(form()),errorCode(403));
 const pending=await admin.contests.getVersion('DEMO-17','DEMO-17-v1');await assert.rejects(editor.contests.reviewApprove('DEMO-17',{versionId:pending.versionId,etag:pending.etag}),errorCode(403));
 await assert.rejects(student.contests.getInternalAuditLog('DEMO-1'),errorCode(403));
 await assert.rejects(organizer.contests.createDraft({...form(),entryType:EntryType.Value1,organizationId:'OTHER'}),errorCode(403));
 admin.context.user={id:'foreign',role:Role.Value3,schoolId:'OTHER',openid:null,subscribes:[],devices:[]};
 await assert.rejects(admin.contests.getPublicVersion('DEMO-1'),errorCode(403));assert.equal((await admin.contests.listPublished({})).total,0);
 await student.auth.logout();await assert.rejects(student.contests.listPublished({}),errorCode(401));
});
test('返回快照不能反向修改Mock；缺少字段可保存草稿但不可发布；拒绝非法日期',async()=>{
 const {student,editor}=await setup();const p=await student.contests.getPublicVersion('DEMO-1');p.data.name='恶意外部修改';p.data.applicableScope.colleges.push('修改');
 assert.notEqual((await student.contests.getPublicVersion('DEMO-1')).data.name,p.data.name);
 const d=await editor.contests.createDraft({changeType:ChangeType.Value1,reason:'未完成草稿'});
 await assert.rejects(editor.contests.submitReview(d.contestId,d.versionId,{ifMatch:d.etag}),errorCode(422));
 await assert.rejects(editor.contests.createDraft({...form(),regEnd:'2026-02-30'}),errorCode(422));
});
test('团队整理可待补充；主办方缺规则不可提交；待确认加分不承诺',async()=>{
 const {editor,admin,student,organizer}=await setup();const d=await editor.contests.createDraft({...form(3),creditApplicable:CreditApplicable.Value2,creditBasis:null,creditNote:'待确认，以原通知为准'});
 await editor.contests.submitReview(d.contestId,d.versionId,{ifMatch:d.etag});const v=await editor.contests.getVersion(d.contestId,d.versionId);
 await admin.contests.reviewApprove(d.contestId,{versionId:v.versionId,etag:v.etag});const p=await student.contests.getPublicVersion(d.contestId);
 assert.ok(p.incompleteFields.includes('reviewRules'));assert.ok(p.incompleteFields.includes('creditBasis'));
 const bad=await organizer.contests.createDraft({...form(3),entryType:EntryType.Value1});
 await assert.rejects(organizer.contests.submitReview(bad.contestId,bad.versionId,{ifMatch:bad.etag}),errorCode(422));
});
test('公示必须提交审核；新版驳回不替换原公示；通过后归档；撤回不回退旧版',async()=>{
 const {editor,admin,student}=await setup();let p=await editor.publicity.create({contestId:'DEMO-1',type:PublicityType.Value1,content:'演示评审办法v1',reason:'首录'});
 assert.equal((await student.contests.getPublicity('DEMO-1')).current,null);
 await assert.rejects(editor.publicity.reviewApprove(p.id,{ifMatch:p.etag}),errorCode(403));
 await assert.rejects(admin.publicity.reviewApprove(p.id,{ifMatch:p.etag}),errorCode(409));
 p=await editor.publicity.submitReview(p.id,{ifMatch:p.etag});p=await admin.publicity.reviewApprove(p.id,{ifMatch:p.etag});
 const first=p;assert.equal((await student.contests.getPublicity('DEMO-1')).current?.rule,'演示评审办法v1');
 p=await editor.publicity.create({contestId:'DEMO-1',type:PublicityType.Value1,content:'演示评审办法v2',reason:'变更'});p=await editor.publicity.submitReview(p.id,{ifMatch:p.etag});
 p=await admin.publicity.reviewReject(p.id,{rejectReason:'内部备注'},{ifMatch:p.etag});assert.equal((await student.contests.getPublicity('DEMO-1')).current?.rule,'演示评审办法v1');
 p=await editor.publicity.update(p.id,{content:'演示评审办法v2',reason:'补充'},{ifMatch:p.etag});p=await editor.publicity.submitReview(p.id,{ifMatch:p.etag});p=await admin.publicity.reviewApprove(p.id,{ifMatch:p.etag});
 const pub=await student.contests.getPublicity('DEMO-1');assert.equal(pub.current?.rule,'演示评审办法v2');assert.equal(pub.history[0].id,first.id);assert.ok(!JSON.stringify(pub).includes('内部备注'));
 await admin.publicity.withdraw(p.id,{reason:'演示撤回'},{ifMatch:p.etag});assert.equal((await student.contests.getPublicity('DEMO-1')).current,null);
});
test('历史恢复生成待审新版本，不能直接改指针；下架不删除数据',async()=>{
 const {admin,student}=await setup();const old=(await admin.contests.getManaged('DEMO-1')).publishedVersion!;
 const d=await admin.contests.restoreVersion('DEMO-1',old.versionId,{reason:'恢复演示历史',changeType:ChangeType.Value1},{ifMatch:old.etag});
 assert.notEqual(d.versionId,old.versionId);assert.equal(d.status,VersionStatus.Value0);assert.equal((await student.contests.getPublicVersion('DEMO-1')).publishedVersionId,old.versionId);
 await admin.contests.takedown('DEMO-1',{reason:'演示下架',scope:TakedownScope.Value0});
 assert.ok((await student.contests.getPublicVersion('DEMO-1')).takedown);assert.equal((await student.contests.listPublished({})).total,13);
 await admin.contests.restorePublication('DEMO-1');assert.equal((await student.contests.listPublished({})).total,14);
});
test('过滤、分页、月份候选仅包含公开记录',async()=>{
 const {student}=await setup();const p=await student.contests.listPublished({keyword:'校园赛事 1',page:1,pageSize:2});assert.equal(p.list.length,2);assert.ok(p.total>2);
 assert.deepEqual(await student.contests.getMonths({}),['2026-08','2026-10']);
 await assert.rejects(student.contests.listPublished({pageSize:101}),errorCode(422));
 await assert.rejects(student.contests.listPublished({month:'2026-99'}),errorCode(422));
});
test('会话过期及同日时刻先后校验',async()=>{
 const {editor,student}=await setup();student.context.expiresAt=Date.now()-1;await assert.rejects(student.contests.listPublished({}),errorCode(401));
 await assert.rejects(editor.contests.createDraft({...form(),regStart:'2026-10-20T18:00:00+08:00',regEnd:'2026-10-20T17:00:00+08:00'}),errorCode(422));
 await assert.rejects(editor.contests.createDraft({...form(),regEnd:'2026-10-20T24:00:00+08:00'}),errorCode(422));
});
