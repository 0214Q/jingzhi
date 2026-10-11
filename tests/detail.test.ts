import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockRuntime } from '../admin-web/src/repository/MockRuntime';
import { MockStore } from '../admin-web/src/repository/MockStore';
import { ContestDetailController, detailId, detailSections, incompleteText, publicLogs, fieldLabel, auditValue, currentPublicityText, publicityTabText, historicalPublicityText, safeSourceUrl, isDemoUrl, timeText } from '../admin-web/src/services/ContestDetailService';
import { ChangeType, Role } from '../admin-web/src/models/contracts';
import type { PublicContest } from '../admin-web/src/models/contracts';
async function setup(){const r=new MockRuntime();await r.auth.login({account:'student',password:'demo123'});return r;}
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {resolve,promise};}
test('详情只请求公开快照，含来源、公示和日志；不读取后台接口',async()=>{
 const r=await setup();let reads=0;const original=r.contests.getPublicVersion.bind(r.contests);
 r.contests.getPublicVersion=async id=>{reads++;return original(id);};
 const c=new ContestDetailController(r.contests,()=>{});await c.load('DEMO-1');const state=c.snapshot();
 assert.equal(reads,1);assert.equal(state.error,'');assert.equal(state.loading,false);assert.equal(state.detail?.publishedVersionId,'DEMO-1-v1');
 assert.equal(state.detail?.source.sourceOrg,state.detail?.data.sourceOrg);
 assert.ok(!JSON.stringify(state.detail).includes('内部审核说明'));assert.ok(!JSON.stringify(state.detail).includes('reviewNote'));
});
test('待补充字段用中文标签、null显示未公布；不能伪造截止时刻或加分承诺',async()=>{
 const r=await setup();const d=await r.contests.getPublicVersion('DEMO-3');
 assert.ok(incompleteText(d).includes('评审规则'));assert.ok(!incompleteText(d).includes('reviewRules'));
 const sections=detailSections(d);assert.equal(sections.find(s=>s.key==='rules')?.text,'原通知未公布');
 assert.ok(sections.find(s=>s.key==='award')?.text.includes('平台不作加分承诺'));
 assert.equal(timeText('2026-10-11'),'2026.10.11（原文仅日期）');assert.equal(timeText('2026-10-11T09:00:00Z'),'2026.10.11 17:00');
});
test('两类公共记录可筛选；值反序列化仅用于文字显示，内部日志不出现',async()=>{
 const r=await setup();const d=await r.contests.getPublicVersion('DEMO-1');
 assert.ok(publicLogs(d,ChangeType.Value0).every(x=>x.changeType===ChangeType.Value0));assert.ok(publicLogs(d,ChangeType.Value0).length>0);
 assert.ok(publicLogs(d,ChangeType.Value1).length>0);assert.equal(fieldLabel('regEnd'),'报名截止');
 assert.equal(auditValue('"2026-10-12"'),'2026-10-12');assert.equal(auditValue(null),'原通知未公布');assert.equal(auditValue('null'),'原通知未公布');
 assert.equal(auditValue('"<script>alert(1)</script>"'),'<script>alert(1)</script>');
 assert.ok(!JSON.stringify(publicLogs(d,null)).includes('内部信息不得公开'));
});
test('已公开获奖名单、当前评审办法及历史公示保留，待审评分标准不出现',async()=>{
 const r=await setup();const d=await r.contests.getPublicVersion('DEMO-11');const current=currentPublicityText(d.publicity);
 assert.ok(publicityTabText(d.publicity,'winners').includes('演示团队甲（虚构）'));assert.equal(publicityTabText(d.publicity,'standard'),'暂无已公开评分标准');assert.ok(current.includes('演示团队甲（虚构）'));assert.ok(current.includes('修订后的评审办法'));assert.ok(!current.includes('尚未公开评分标准'));
 assert.equal(d.publicity.history.length,1);assert.ok(historicalPublicityText(d.publicity.history[0]).includes('已审核评审办法'));
 assert.ok(!JSON.stringify(d).includes('内部公示说明'));
});
test('下架保留只读快照；未发布、未登录和跨校显示明确错误，不返回旧内容',async()=>{
 const r=await setup();const c=new ContestDetailController(r.contests,()=>{});await c.load('DEMO-15');assert.ok(c.snapshot().detail?.takedown);
 await c.load('DEMO-16');assert.equal(c.snapshot().detail,null);assert.equal(c.snapshot().errorCode,404);
 await r.auth.logout();await c.load('DEMO-1');assert.equal(c.snapshot().errorCode,401);
 r.context.user={id:'foreign',role:Role.Value0,schoolId:'OTHER',openid:null,subscribes:[],devices:[]};r.context.expiresAt=Date.now()+10000;
 await c.load('DEMO-1');assert.equal(c.snapshot().errorCode,403);assert.equal(c.snapshot().detail,null);
 await c.load('');assert.equal(c.snapshot().errorCode,422);assert.equal(detailId({}), '');
});
test('新详情请求后旧结果不可覆盖；页面销毁后不回调',async()=>{
 const r=await setup();const d1=await r.contests.getPublicVersion('DEMO-1');const d2=await r.contests.getPublicVersion('DEMO-2');
 const first=deferred<PublicContest>();const second=deferred<PublicContest>();let calls=0;let updates=0;
 r.contests.getPublicVersion=()=>++calls===1?first.promise:second.promise;
 const c=new ContestDetailController(r.contests,()=>{updates++;});const a=c.load('DEMO-1');const b=c.load('DEMO-2');second.resolve(d2);await b;first.resolve(d1);await a;
 assert.equal(c.snapshot().detail?.contestId,'DEMO-2');const last=deferred<PublicContest>();r.contests.getPublicVersion=()=>last.promise;const pending=c.load('DEMO-1');c.dispose();const count=updates;last.resolve(d1);await pending;assert.equal(updates,count);
});
test('网络失败可重试恢复；来源仅允许HTTP(S)，演示链接不打开',async()=>{
 const r=await setup();const original=r.contests.getPublicVersion.bind(r.contests);let fail=true;
 r.contests.getPublicVersion=async id=>{if(fail){fail=false;throw new Error('临时错误');}return original(id);};
 const c=new ContestDetailController(r.contests,()=>{});await c.load('DEMO-1');assert.equal(c.snapshot().errorCode,500);await c.refresh();assert.equal(c.snapshot().error,'');assert.ok(c.snapshot().detail);
 assert.equal(safeSourceUrl('javascript:alert(1)'),null);assert.equal(safeSourceUrl('https://user:pass@example.com'),null);assert.equal(safeSourceUrl('https://example.com/a'),'https://example.com/a');
 assert.ok(isDemoUrl('https://example.invalid/demo/1'));assert.equal(isDemoUrl('https://example.invalid.evil.org'),false);
});
