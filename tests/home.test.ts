import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockRuntime } from '../admin-web/src/repository/MockRuntime';
import { HomeService, demoHomeConfig, deadlineText, deadlineHint, scopeText } from '../admin-web/src/services/HomeService';
import { Category } from '../admin-web/src/models/contracts';
async function setup() { const runtime=new MockRuntime();await runtime.auth.login({account:'student',password:'demo123'});return runtime; }
test('首页：即将截止按真实截止排序，最新按公开版本更新时间而非报名截止排列',async()=>{
 const runtime=await setup();const result=await new HomeService(runtime.contests,demoHomeConfig).load({keyword:'',category:null});
 assert.equal(result.total,14);assert.deepEqual(result.urgent.map(x=>x.contestId),['DEMO-2','DEMO-1','DEMO-4']);
 assert.equal(result.latest.length,4);assert.equal(result.latest[0].contestId,'DEMO-10');
 assert.ok(result.latest.every(x=>!['DEMO-15','DEMO-16','DEMO-17','DEMO-18'].includes(x.contestId)));
});
test('首页搜索、分类及空结果保持一致，不修改Repo数据',async()=>{
 const runtime=await setup();const service=new HomeService(runtime.contests,demoHomeConfig);
 const result=await service.load({keyword:'校园赛事 1',category:Category.Value0});
 assert.ok(result.latest.every(x=>x.category===Category.Value0&&x.name.includes('校园赛事 1')));
 const empty=await service.load({keyword:'不存在的赛事',category:null});assert.equal(empty.total,0);assert.equal(empty.latest.length,0);assert.equal(empty.urgent.length,0);
 assert.equal((await runtime.contests.listPublished({})).total,14);
});
test('仅日期保留原文精度，今日截止与精确时刻过期分开显示',()=>{
 assert.equal(deadlineText('2026-10-11'),'2026.10.11（原文仅日期）');
 assert.equal(deadlineText('2026-10-11T17:00:00+08:00'),'2026.10.11 17:00');
 assert.equal(deadlineHint('2026-10-10',demoHomeConfig.now),'今天截止');
 assert.equal(deadlineHint('2026-10-10T09:00:00+08:00',demoHomeConfig.now),'报名已截止');
 assert.equal(deadlineHint(null,demoHomeConfig.now),'截止时间待公布');
});
test('首页错误向上交给页面，不以空列表掩盖登录失败',async()=>{
 const runtime=await setup();await runtime.auth.logout();
 await assert.rejects(new HomeService(runtime.contests,demoHomeConfig).load({keyword:'',category:null}));
});
test('候选超过一页仍能找到即将截止项，未知与超过7天不强行显示',async()=>{
 const runtime=await setup();const original=runtime.contests.listPublished.bind(runtime.contests);
 let requestedSecond=false;
 runtime.contests.listPublished=async(filter)=>{
  if(filter.pageSize===4)return original(filter);
  const row=(await original({keyword:'校园赛事 1',pageSize:100})).list[0];
  if(filter.page===1)return {list:Array.from({length:100},()=>({...row,regEnd:null})),total:101,page:1,pageSize:100};
  requestedSecond=true;return {list:[{...row,regEnd:'2026-10-11'}],total:101,page:2,pageSize:100};
 };
 const data=await new HomeService(runtime.contests,demoHomeConfig).load({keyword:'',category:null});
 assert.ok(requestedSecond);assert.equal(data.urgent.length,1);assert.equal(data.urgent[0].regEnd,'2026-10-11');
 assert.ok(scopeText(data.urgent[0]).includes('原通知'));
});
