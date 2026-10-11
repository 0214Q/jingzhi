const fs=require('node:fs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const {Database}=require('./database.cjs'),{RequestContext}=require('../build/DomainStore'),{ContestService}=require('../build/ContestService');
const {payloadHash}=require('./CatalogRules.cjs');
const SOURCE='河南大学本科生学科竞赛目录整理（竞知平台字段版）.xlsx';
const keyFor=(level,name)=>createHash('sha256').update(level+'\n'+name).digest('hex').slice(0,24);
function isDemo(store,c){const versions=store.versions.filter(v=>v.contestId===c.contestId);return /^DEMO-(?:[1-9]|1[0-8])$/.test(c.contestId)&&versions.length>0&&versions.every(v=>v.payload.organizationId==='ORG-DEMO'&&v.payload.name.startsWith('【演示】校园赛事')&&/^https:\/\/example\.invalid\/demo\/\d+$/.test(v.payload.sourceUrl||''));}
async function replaceCatalog(database,options={}){
 const row=database.db.prepare('SELECT data FROM users WHERE id=?').get(options.actor||'admin');if(!row)throw Error('管理员账号不存在');
 const user=JSON.parse(row.data);if(user.role!=='管理员'||user.schoolId!=='HENU')throw Error('仅河南大学管理员可以执行本补丁');
 if(!database.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_imports'").get())throw Error('没有目录导入记录，请先完成184条草稿导入');
 const imports=database.db.prepare('SELECT * FROM catalog_imports WHERE school_id=? AND source_file=? ORDER BY import_key').all(user.schoolId,SOURCE);
 if(imports.length!==184)throw Error('应有184条目录导入记录，实际'+imports.length+'；停止替换');
 let sourceCount=0;
 for(const rec of imports){const rows=JSON.parse(rec.source_rows);sourceCount+=rows.length;if(!rows.length||rows.some(r=>keyFor(r.raw['层级'],r.raw['竞赛名称'])!==rec.import_key))throw Error('目录原始行与导入键不一致');}
 if(sourceCount!==185)throw Error('原始溯源记录不是185行');
 let backup=null;
 if(options.apply){backup=options.backupPath||path.resolve('data/backups/replace-catalog-'+new Date().toISOString().replaceAll(':','-')+'-'+randomUUID().slice(0,8)+'.sqlite');if(fs.existsSync(backup))throw Error('备份目标已存在');fs.mkdirSync(path.dirname(backup),{recursive:true});database.db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 database.begin();
 try{
  database.db.exec('CREATE TABLE IF NOT EXISTS catalog_publications(version_id TEXT PRIMARY KEY REFERENCES versions(id), school_id TEXT NOT NULL, import_key TEXT NOT NULL, payload_hash TEXT NOT NULL, authorized_at TEXT NOT NULL, authorized_by TEXT NOT NULL, FOREIGN KEY(school_id,import_key) REFERENCES catalog_imports(school_id,import_key));');
  const store=database.load(),context=new RequestContext();context.user=user;context.expiresAt=Date.now()+3600000;const repo=new ContestService(store,context);
  const result={mode:options.apply?'apply':'preview',catalogRecords:184,newlyPublished:0,alreadyPublished:0,newlyHiddenDemo:0,alreadyHiddenDemo:0,backup,items:[]};
  for(const rec of imports){
   const c=store.contests.find(c=>c.contestId===rec.contest_id&&c.schoolId===user.schoolId);if(!c)throw Error('目录赛事缺失：'+rec.contest_id);
   const rows=JSON.parse(rec.source_rows),raw=rows[0].raw;
   if(c.publishedVersionId){const marker=store.catalogPublications.find(p=>p.version_id===c.publishedVersionId);if(!marker||marker.import_key!==rec.import_key)throw Error('目录已通过其他流程发布，需人工确认：'+c.contestId);result.alreadyPublished++;result.items.push({contestId:c.contestId,name:raw['竞赛名称'],action:'alreadyPublished',takedown:c.takedown!==null});continue;}
   const versions=store.versions.filter(v=>v.contestId===c.contestId);if(versions.length!==1||versions[0].status!=='草稿')throw Error('目录版本已编辑或送审，需人工确认：'+c.contestId);
   const v=versions[0];if(v.payload.name!==raw['竞赛名称']||v.payload.level!==(raw['层级']==='国家级'?'国赛':'省赛'))throw Error('目录名称或层级与原表不符');
   const record={version_id:v.versionId,school_id:user.schoolId,import_key:rec.import_key,payload_hash:payloadHash(v.payload),authorized_at:new Date().toISOString(),authorized_by:user.id};store.catalogPublications.push(record);
   if(options.apply)database.db.prepare('INSERT INTO catalog_publications VALUES(?,?,?,?,?,?)').run(record.version_id,record.school_id,record.import_key,record.payload_hash,record.authorized_at,record.authorized_by);
   v.reason='用户授权公开河大学生可参加的赛事目录；非当年报名通知，资料与时间待补充。';
   await repo.submitReview(c.contestId,v.versionId,{ifMatch:v.etag});
   await repo.reviewApprove(c.contestId,{versionId:v.versionId,etag:v.etag});
   result.newlyPublished++;result.items.push({contestId:c.contestId,name:raw['竞赛名称'],action:'publishedCatalog'});
  }
  for(const c of store.contests.filter(c=>c.schoolId===user.schoolId&&isDemo(store,c))){
   if(c.takedown){result.alreadyHiddenDemo++;continue;}
   // Remove pending demo versions from the review queue via existing rejection rules.
   for(const v of store.versions.filter(v=>v.contestId===c.contestId&&v.status==='待审核'))await repo.reviewReject(c.contestId,{versionId:v.versionId,etag:v.etag,rejectReason:'演示数据已退出展示，替换为河南大学真实赛事目录'});
   await repo.takedown(c.contestId,{scope:'全部',reason:'撤下开发演示赛事，替换为用户提供的河南大学赛事目录'});
   result.newlyHiddenDemo++;result.items.push({contestId:c.contestId,action:'hiddenDemo'});
  }
  const publicList=await repo.listPublished({page:1,pageSize:100});result.publicTotal=publicList.total;
  if(options.apply){database.save(store);database.commit();}else database.rollback();
  return result;
 }catch(error){database.rollback();throw error;}
}
async function main(){let apply=false,actor='admin';const args=process.argv.slice(2);for(let i=0;i<args.length;i++){if(args[i]==='--apply')apply=true;else if(args[i]==='--actor'&&args[i+1])actor=args[++i];else throw Error('支持参数：--apply、--actor <管理员账号>');}
 const filename=process.env.DB_PATH||path.resolve('data/jingzhi.sqlite');if(!fs.existsSync(filename))throw Error('数据库不存在，核对DB_PATH');const db=new Database(filename);
 try{const result=await replaceCatalog(db,{apply,actor});const report=path.resolve('data/import-reports/replace-catalog-'+Date.now()+'-'+randomUUID().slice(0,8)+'.json');fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify(result,null,2));const {items,...summary}=result;console.log(JSON.stringify({...summary,report},null,2));console.log(apply?'真实目录已公开，演示赛事已下架；已有反馈和收藏保留。':'预览已回滚；确认结果后加 --apply。');}finally{db.close();}}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={replaceCatalog,isDemo};
