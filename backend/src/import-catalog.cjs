// Offline maintenance tool. Use the same DB_PATH as the running backend; stop it before apply.
const fs=require('node:fs'),path=require('node:path'),{createHash,randomUUID}=require('node:crypto');
const {Database}=require('./database.cjs');
const {RequestContext}=require('../build/DomainStore');
const {ContestService}=require('../build/ContestService');
const {validate}=require('./validation.cjs');
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,24);
function inspectBundle(bundle){
 if(bundle.formatVersion!==1||!Array.isArray(bundle.records)||!bundle.records.length)throw Error('不支持的导入包或空记录');
 const keys=new Set();let total=0;
 for(const rec of bundle.records){
  if(typeof rec.key!=='string'||!rec.key||keys.has(rec.key))throw Error('重复或缺失导入键');keys.add(rec.key);
  if(!Array.isArray(rec.sourceRows)||!rec.sourceRows.length)throw Error('缺少原表行');total+=rec.sourceRows.length;
  validate(rec.request,'CreateDraftRequest');
  if(!rec.request.name?.trim()||!['国赛','省赛'].includes(rec.request.level)||rec.request.entryType!=='团队整理')throw Error('赛事名称/层级/录入主体不正确');
  if(rec.request.regStart||rec.request.regEnd||rec.request.contestStart||rec.request.contestEnd)throw Error('目录导入不接受推测的具体日期');
 }
 if(total!==bundle.sourceRowCount)throw Error('原表总行数与溯源记录不一致');
}
async function importCatalog(database,bundle,options={}){
 inspectBundle(bundle);const actorId=options.actor||'admin';
 const actorRow=database.db.prepare('SELECT data FROM users WHERE id=?').get(actorId);
 if(!actorRow)throw Error('找不到导入账号：'+actorId+'；请指定已存在的管理员账号');
 const user=JSON.parse(actorRow.data);if(user.role!=='管理员')throw Error('仅管理员维护账号可导入目录');
 let backup=null;
 if(options.apply){
  const destination=options.backupPath||path.resolve('data/backups/catalog-'+new Date().toISOString().replaceAll(':','-')+'-'+randomUUID().slice(0,8)+'.sqlite');
  if(fs.existsSync(destination))throw Error('备份目标已存在');fs.mkdirSync(path.dirname(destination),{recursive:true});
  database.db.exec("VACUUM INTO '"+destination.replaceAll("'","''")+"'");backup=destination;
 }
 database.begin();
 try{
  database.db.exec('CREATE TABLE IF NOT EXISTS catalog_imports(school_id TEXT NOT NULL, import_key TEXT NOT NULL, contest_id TEXT NOT NULL REFERENCES contests(id), source_file TEXT NOT NULL, source_rows TEXT NOT NULL CHECK(json_valid(source_rows)), imported_at TEXT NOT NULL, PRIMARY KEY(school_id,import_key));');
  const store=database.load();const context=new RequestContext();context.user=user;context.expiresAt=Date.now()+3600000;
  const repo=new ContestService(store,context);const items=[];
  const ledger=database.db.prepare('SELECT contest_id FROM catalog_imports WHERE school_id=? AND import_key=?');
  const addLedger=database.db.prepare('INSERT INTO catalog_imports VALUES(?,?,?,?,?,?)');
  const created=[];
  for(const rec of bundle.records){
   const prior=ledger.get(user.schoolId,rec.key);
   if(prior){items.push({key:rec.key,name:rec.request.name,contestId:prior.contest_id,status:'skipped',reason:'同一导入键已存在'});continue;}
   const match=store.contests.find(c=>c.schoolId===user.schoolId&&store.versions.some(v=>v.contestId===c.contestId&&v.payload.name.trim()===rec.request.name.trim()&&v.payload.level===rec.request.level));
   if(match){items.push({key:rec.key,name:rec.request.name,contestId:match.contestId,status:'skipped',reason:'同校同名同层级已有赛事，未覆盖'});continue;}
   const organizer=rec.organizer||'主办方待确认';const orgId='catalog-org-'+hash(user.schoolId+'\n'+organizer);
   if(!store.organizations.some(o=>o.id===orgId))store.organizations.push({id:orgId,schoolId:user.schoolId,name:organizer+'（目录记载，未认证）',type:'目录主办方信息',contact:null,intro:'来自用户提供目录，尚未认证主办方身份；不授予主办方账号权限。',owners:[]});
   const input=structuredClone(rec.request);input.organizationId=orgId;input.collectedAt=new Date().toISOString();input.lastVerifiedAt='';input.sourceOrg=null;
   const draft=await repo.createDraft(input);created.push({rec,draft});
   items.push({key:rec.key,name:input.name,contestId:draft.contestId,versionId:draft.versionId,status:'draft',warnings:rec.warnings});
  }
  if(options.apply){database.save(store);for(const {rec,draft} of created)addLedger.run(user.schoolId,rec.key,draft.contestId,bundle.sourceFile,JSON.stringify(rec.sourceRows),new Date().toISOString());database.commit();}
  else database.rollback();
  return {mode:options.apply?'apply':'preview',schoolId:user.schoolId,sourceRows:bundle.sourceRowCount,uniqueRecords:bundle.records.length,created:created.length,skipped:items.length-created.length,backup,items};
 }catch(error){database.rollback();throw error;}
}
async function main(){
 const args=process.argv.slice(2),allowed=new Set(['--apply','--file','--actor']);let apply=false,actor='admin',filename=path.join(__dirname,'../imports/henu-catalog-20261010.json');
 for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw Error('未知参数：'+args[i]);if(args[i]==='--apply'){apply=true;continue;}const value=args[++i];if(!value||value.startsWith('--'))throw Error('参数缺少值');if(args[i-1]==='--file')filename=path.resolve(value);else actor=value;}
 const dbPath=process.env.DB_PATH||path.resolve('data/jingzhi.sqlite');if(!fs.existsSync(dbPath))throw Error('数据库文件不存在；请确认DB_PATH。不会自动创建空库。');
 const bundle=JSON.parse(fs.readFileSync(filename,'utf8'));const database=new Database(dbPath);
 try{const result=await importCatalog(database,bundle,{apply,actor});const report=path.resolve('data/import-reports/catalog-'+Date.now()+'-'+randomUUID().slice(0,8)+'.json');fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify(result,null,2));console.log(JSON.stringify({mode:result.mode,sourceRows:result.sourceRows,uniqueRecords:result.uniqueRecords,newDrafts:result.created,skipped:result.skipped,backup:result.backup,report},null,2));console.log(apply?'草稿已写入。未发布、未自动送审，不改变已有公开赛事。':'预览完成，数据库已回滚；确认数量后再加 --apply。');}
 finally{database.close();}
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={importCatalog,inspectBundle};
