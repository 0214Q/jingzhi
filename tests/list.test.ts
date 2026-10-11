import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockRuntime } from '../admin-web/src/repository/MockRuntime';
import { ContestListController, defaultListQuery, routeQuery, listTitle, toFilter } from '../admin-web/src/services/ContestListService';
import { Category, ContestStatus, MonthMode } from '../admin-web/src/models/contracts';
import type { ContestPage, ContestSummary } from '../admin-web/src/models/contracts';
async function setup(){const r=new MockRuntime();await r.auth.login({account:'student',password:'demo123'});return r;}
function deferred<T>() { let resolve!:(v:T)=>void;let reject!:(e:Error)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; }
test('列表分页读取全部公开记录，反复点击加载不会重复追加',async()=>{
 const runtime=await setup();const controller=new ContestListController(runtime.contests,()=>{});
 await controller.setQuery(defaultListQuery());assert.equal(controller.snapshot().items.length,10);assert.equal(controller.snapshot().total,14);assert.ok(controller.snapshot().hasMore);
 await Promise.all([controller.loadMore(),controller.loadMore()]);assert.equal(controller.snapshot().items.length,14);assert.equal(controller.snapshot().page,2);assert.equal(controller.snapshot().hasMore,false);
 assert.equal(new Set(controller.snapshot().items.map(x=>x.contestId)).size,14);
});
test('分类、状态、关键词、月份和模式联合传入Repository；修改筛选重置分页',async()=>{
 const runtime=await setup();const c=new ContestListController(runtime.contests,()=>{},2);const q=defaultListQuery();
 q.category=Category.Value0;q.status=ContestStatus.Value1;q.keyword='校园赛事 1';q.month='2026-10';q.monthMode=MonthMode.Value0;
 await c.setQuery(q);assert.equal(c.snapshot().items.length,1);assert.equal(c.snapshot().items[0].contestId,'DEMO-1');
 assert.equal(toFilter(q,1,2).monthMode,MonthMode.Value0);assert.equal(listTitle(q),'2026 年 10 月竞赛');
 q.category=null;q.status=null;q.keyword='';q.month='2026-11';q.monthMode=MonthMode.Value1;await c.setQuery(q);
 assert.ok(c.snapshot().items.every(x=>!['DEMO-12','DEMO-13','DEMO-14'].includes(x.contestId)));
 assert.equal(c.snapshot().page,1);await c.setQuery(defaultListQuery());assert.equal(c.snapshot().query.month,null);
});
test('空月份给空结果，清除全部后恢复14条',async()=>{
 const r=await setup();const c=new ContestListController(r.contests,()=>{});const q=defaultListQuery();q.month='2028-01';
 await c.setQuery(q);assert.equal(c.snapshot().items.length,0);assert.equal(c.snapshot().hasMore,false);assert.equal(c.snapshot().error,'');
 await c.setQuery(defaultListQuery());assert.equal(c.snapshot().total,14);
});
test('下一页失败保留首屏数据，重试同一页且清除错误',async()=>{
 const r=await setup();const original=r.contests.listPublished.bind(r.contests);let fail=true;const pages:number[]=[];
 r.contests.listPublished=async(f)=>{pages.push(f.page!);if(f.page===2&&fail){fail=false;throw new Error('演示下一页失败');}return original(f);};
 const c=new ContestListController(r.contests,()=>{});await c.setQuery(defaultListQuery());await c.loadMore();
 assert.equal(c.snapshot().items.length,10);assert.equal(c.snapshot().page,1);assert.ok(c.snapshot().moreError);assert.equal(c.snapshot().loadingMore,false);
 await c.loadMore();assert.equal(c.snapshot().items.length,14);assert.equal(c.snapshot().moreError,'');assert.deepEqual(pages,[1,2,2]);
});
test('快速切换筛选：旧请求后返回也不能覆盖新结果',async()=>{
 const r=await setup();const first=deferred<ContestPage>();const second=deferred<ContestPage>();let calls=0;
 const row=(await r.contests.listPublished({})).list[0];r.contests.listPublished=()=>++calls===1?first.promise:second.promise;
 const c=new ContestListController(r.contests,()=>{});const q=defaultListQuery();const a=c.setQuery(q);q.keyword='新的条件';const b=c.setQuery(q);
 second.resolve({list:[{...row,name:'新的结果'}],total:1,page:1,pageSize:10});await b;
 first.resolve({list:[{...row,name:'旧结果'}],total:1,page:1,pageSize:10});await a;
 assert.equal(c.snapshot().items[0].name,'新的结果');assert.equal(c.snapshot().query.keyword,'新的条件');assert.equal(c.snapshot().loading,false);
});
test('加载下一页时切换筛选，旧页不会追加到新的结果中；销毁后不通知页面',async()=>{
 const r=await setup();const original=r.contests.listPublished.bind(r.contests);const next=deferred<ContestPage>();let updates=0;
 r.contests.listPublished=async(f)=>f.page===2?next.promise:original(f);
 const c=new ContestListController(r.contests,()=>{updates++;});await c.setQuery(defaultListQuery());const oldPage=c.loadMore();
 const q=defaultListQuery();q.keyword='不存在';await c.setQuery(q);next.resolve({list:(await original({page:2,pageSize:10})).list,total:14,page:2,pageSize:10});await oldPage;
 assert.equal(c.snapshot().items.length,0);assert.equal(c.snapshot().total,0);
 const blocked=deferred<ContestPage>();r.contests.listPublished=()=>blocked.promise;const pending=c.refresh();c.dispose();const count=updates;blocked.resolve({list:[],total:0,page:1,pageSize:10});await pending;assert.equal(updates,count);
});
test('路由参数校验，不把无效分类/月份带入查询；首页分类和关键词正常传递',()=>{
 const q=routeQuery({category:Category.Value1,keyword:'挑战',month:'2026-11',monthMode:MonthMode.Value1});
 assert.equal(q.category,Category.Value1);assert.equal(q.keyword,'挑战');assert.equal(q.monthMode,MonthMode.Value1);
 const invalid=routeQuery({category:'错误分类' as Category,month:'2026-99',sort:'内部字段'});
 assert.equal(invalid.category,null);assert.equal(invalid.month,null);assert.equal(invalid.sort,'-updatedAt');
});
