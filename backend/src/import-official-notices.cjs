// Offline, fact-reviewed import. No crawling, guessed dates or automatic publication.
const fs=require('node:fs'),path=require('node:path');
const {createHash,randomUUID}=require('node:crypto');
const {Database}=require('./database.cjs');
const {RequestContext}=require('../build/DomainStore');
const {ContestService}=require('../build/ContestService');
const {CampusService}=require('./CampusService.cjs');
const {CampusCapability}=require('../build/contracts');
const {validate:validateRequest}=require('./validation.cjs');
const {validDate}=require('../build/DomainRules');
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hosts=new Set(['www.aicomp.cn','dasai.lanqiao.cn','design.lanqiao.cn','www.cms.org.cn','www.mcm.edu.cn','www.contest.comap.com']);
function official(url){const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||!hosts.has(u.hostname))throw Error('来源不在已审核的官方 HTTPS 域名内：'+url);}
function inspectBundle(bundle){
 if(bundle.formatVersion!==1||bundle.schoolId!=='HENU'||!validDate(bundle.verifiedAt)||!Array.isArray(bundle.records)||!bundle.records.length)throw Error('导入包格式、高校或核对日期无效');
 const seen=new Set();
 for(const r of bundle.records){
  if(!r.key||seen.has(r.key))throw Error('导入键重复或缺失');seen.add(r.key);
  if(!Array.isArray(r.matchNames)||!r.matchNames.length||!r.organizer?.trim())throw Error('缺少匹配名或主办方');
  validateRequest(r.request,'CreateDraftRequest');
  if(r.request.entryType!=='团队整理'||!r.request.edition||r.request.lastVerifiedAt!==bundle.verifiedAt)throw Error('需要明确届次、核对日期及团队整理来源');
  official(r.request.sourceUrl);
  if(!Array.isArray(r.sources)||!r.sources.length)throw Error('缺少溯源资料');
  r.sources.forEach(s=>official(s.url));
  if(!r.sources.some(s=>s.url===r.request.sourceUrl))throw Error('主要来源不在溯源清单');
  for(const key of ['regStart','regEnd','contestStart','contestEnd','publicityTime']){
   const value=r.request[key];if(!value)continue;
   const proof=r.dateEvidence?.find(e=>e.field===key&&e.value===value);
   if(!validDate(value)||!proof||!r.sources.some(s=>s.url===proof.sourceUrl))throw Error('具体日程缺少对应官方证据：'+r.key+'/'+key);
   if(value.includes('T')&&(!value.endsWith('+08:00')||proof.timeZone!=='Asia/Shanghai'))throw Error('时刻必须明确转换为北京时间');
  }
  for(const s of r.schedule||[]){if(!s.stage||!validDate(s.value)||!r.sources.some(x=>x.url===s.sourceUrl))throw Error('分阶段日程无效');}
  if(!['regStart','regEnd','contestStart','contestEnd'].some(k=>r.request[k])&&!(r.schedule||[]).length)throw Error('年度通知至少需要一个已核实日程');
 }
}
async function importNotices(database,bundle,options={}){
 inspectBundle(bundle);
 const actorId=options.actor||'admin',row=database.db.prepare('SELECT data FROM users WHERE id=?').get(actorId);
 if(!row)throw Error('导入账号不存在');const user=JSON.parse(row.data);
 const campus=new CampusService(database,user);if(!campus.enabled)throw Error('请先完成高校权限迁移 002');
 campus.require(CampusCapability.Value5,bundle.schoolId);
 if(options.submit)campus.require(CampusCapability.Value6,bundle.schoolId);
 let backup=null;
 if(options.apply){backup=path.resolve(options.backupPath||'data/backups/official-notices-'+new Date().toISOString().replaceAll(':','-')+'-'+randomUUID().slice(0,8)+'.sqlite');if(fs.existsSync(backup))throw Error('备份目标已存在');fs.mkdirSync(path.dirname(backup),{recursive:true});database.db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 database.begin();
 try{
  database.db.exec('CREATE TABLE IF NOT EXISTS official_notice_imports(school_id TEXT NOT NULL, import_key TEXT NOT NULL, content_hash TEXT NOT NULL, contest_id TEXT NOT NULL REFERENCES contests(id), version_id TEXT NOT NULL REFERENCES versions(id), evidence TEXT NOT NULL CHECK(json_valid(evidence)), imported_at TEXT NOT NULL, PRIMARY KEY(school_id,import_key,content_hash));');
  const store=database.load(),context=new RequestContext();context.user={...user,role:'管理员',schoolId:bundle.schoolId};context.expiresAt=Date.now()+3600000;
  const repo=new ContestService(store,context),items=[],pending=[];
  const prior=database.db.prepare('SELECT contest_id,version_id FROM official_notice_imports WHERE school_id=? AND import_key=? AND content_hash=?');
  for(const r of bundle.records){
   const contentHash=digest(r),old=prior.get(bundle.schoolId,r.key,contentHash);
   if(old){items.push({key:r.key,name:r.request.name,status:'skipped',reason:'相同资料已导入',contestId:old.contest_id,versionId:old.version_id});continue;}
   const matches=store.contests.filter(c=>c.schoolId===bundle.schoolId&&!/^DEMO-\d+$/.test(c.contestId)&&store.versions.some(v=>v.contestId===c.contestId&&r.matchNames.includes(v.payload.name)));
   if(matches.length>1){items.push({key:r.key,status:'conflict',reason:'多个同名赛事，需人工选择'});continue;}
   const existing=matches[0];
   if(existing&&(existing.takedown||!existing.publishedVersionId||store.versions.some(v=>v.contestId===existing.contestId&&v.status!=='已发布'))){items.push({key:r.key,name:r.request.name,status:'conflict',contestId:existing.contestId,reason:'已有工作版本或已下架；保留本地修改'});continue;}
   const orgId='official-source-'+digest([bundle.schoolId,r.organizer]).slice(0,24);
   if(!store.organizations.some(o=>o.id===orgId))store.organizations.push({id:orgId,schoolId:bundle.schoolId,name:r.organizer,type:'官方公告主办方信息',contact:null,intro:'仅记录公告来源，不认证组织账号、不授予权限。',owners:[]});
   const input=structuredClone(r.request);input.organizationId=orgId;input.collectedAt=new Date().toISOString();input.schedule=structuredClone(r.schedule||[]);
   // Preserve campus-owned fields and append prior local content; old catalog source is retained in description.
   let draft;
   if(existing){
    const base=store.versions.find(v=>v.versionId===existing.publishedVersionId);
    input.applicableScope=base.payload.applicableScope;
    for(const k of ['attachmentIds','creditApplicable','creditBasis','creditNote'])input[k]=base.payload[k];
    for(const k of ['contact','material','reviewRules','awardSetting'])if(input[k]===null)input[k]=base.payload[k];
    if(input.creditApplicable==='待确认'&&!input.creditNote)input.creditNote=r.request.creditNote;
    input.description+='\n\n【此前校内资料，年度时间请以以上正式公告为准】\n'+(base.payload.description||'')+'\n此前来源：'+(base.payload.sourceUrl||base.payload.sourceTitle||'校内目录');
    const derived=await repo.deriveVersion(existing.contestId,{changeType:input.changeType,reason:input.reason},{ifMatch:base.etag});
    draft=await repo.updateDraft(existing.contestId,derived.versionId,input,{ifMatch:derived.etag});
   }else draft=await repo.createDraft(input);
   // Compatibility context must not rewrite the actual operator role in audit history.
   const version=store.versions.find(v=>v.versionId===draft.versionId);version.operatorRole=user.role;
   if(options.submit)await repo.submitReview(draft.contestId,draft.versionId,{ifMatch:draft.etag});
   pending.push({r,contentHash,draft});items.push({key:r.key,name:input.name,status:options.submit?'pending':'draft',operation:existing?'enriched':'new',contestId:draft.contestId,versionId:draft.versionId,unknownFields:r.unknownFields});
  }
  if(options.apply){database.save(store);const insert=database.db.prepare('INSERT INTO official_notice_imports VALUES(?,?,?,?,?,?,?)');for(const p of pending)insert.run(bundle.schoolId,p.r.key,p.contentHash,p.draft.contestId,p.draft.versionId,JSON.stringify({sources:p.r.sources,dateEvidence:p.r.dateEvidence,schedule:p.r.schedule||[]}),new Date().toISOString());database.commit();}else database.rollback();
  return {mode:options.apply?'apply':'preview',schoolId:bundle.schoolId,total:bundle.records.length,newDrafts:items.filter(i=>i.operation==='new').length,enrichedDrafts:items.filter(i=>i.operation==='enriched').length,skipped:items.filter(i=>i.status==='skipped').length,conflicts:items.filter(i=>i.status==='conflict').length,submitted:options.submit?pending.length:0,backup,items};
 }catch(e){database.rollback();throw e;}
}
async function main(){
 const args=process.argv.slice(2),o={};let file=path.join(__dirname,'../imports/official-notices-20261013.json');
 for(let i=0;i<args.length;i++){const k=args[i];if(k==='--apply')o.apply=true;else if(k==='--submit')o.submit=true;else if(k==='--actor'||k==='--file'){const value=args[++i];if(!value||value.startsWith('--'))throw Error('参数缺少值');if(k==='--actor')o.actor=value;else file=path.resolve(value);}else throw Error('未知参数：'+k);}
 const dbPath=process.env.DB_PATH||path.resolve('data/jingzhi.sqlite');if(!fs.existsSync(dbPath))throw Error('数据库不存在，请设置 DB_PATH，不会创建空库');
 const db=new Database(dbPath);try{const result=await importNotices(db,JSON.parse(fs.readFileSync(file,'utf8')),o);const report=path.resolve('data/import-reports/official-notices-'+Date.now()+'-'+randomUUID().slice(0,8)+'.json');fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify(result,null,2));const {items,...summary}=result;console.log(JSON.stringify({...summary,report},null,2));console.log(o.apply?'已写入草稿/待审核版本。必须由校级管理员审核后才公开；原公开内容、收藏和反馈保留。':'预览已回滚，数据库未改动；确认冲突报告后加 --apply。');}finally{db.close();}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={inspectBundle,importNotices};
