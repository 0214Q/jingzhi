const fs=require('node:fs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const {Database}=require('./database.cjs');
/** 幂等预览/应用：不写旧users/contests/versions/收藏/反馈，不自动赋予平台管理员。 */
function migrateCampus(database,options={}){
 const applied=Boolean(options.apply);let backup=null;
 if(applied){backup=path.resolve(options.backupPath||path.join(path.dirname(database.dbPath||options.dbPath||'./data/jingzhi.sqlite'),'backups','campus-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8)+'.sqlite'));if(fs.existsSync(backup))throw Error('备份路径已存在');fs.mkdirSync(path.dirname(backup),{recursive:true});database.db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 database.begin();try{
  const previouslyApplied=Boolean(database.db.prepare('SELECT 1 FROM schema_migrations WHERE version=2').get());
  database.db.exec(fs.readFileSync(path.join(__dirname,'../migrations/002_campus_hierarchy.sql'),'utf8'));
  const now=new Date().toISOString(),schoolIds=database.db.prepare('SELECT school_id FROM users UNION SELECT school_id FROM contests UNION SELECT school_id FROM organizations').all();let addedSchools=0,addedAdmins=0;
  const insertSchool=database.db.prepare('INSERT OR IGNORE INTO campus_schools VALUES(?,?,?,?,?,?,?)');
  for(const row of previouslyApplied?[]:schoolIds){const id=row.school_id;if(!id?.trim())throw Error('旧数据缺少schoolId，迁移已回滚');const r=insertSchool.run(id,id==='HENU'?'河南大学':'待登记高校（'+id+'）',id,id==='HENU'?'启用':'停用',randomUUID(),now,now);addedSchools+=r.changes;}
  for(const user of previouslyApplied?[]:database.db.prepare("SELECT id,school_id FROM users WHERE role='管理员'").all()){
   const id='campus-school-admin-'+createHash('sha256').update(user.id+'\n'+user.school_id).digest('hex').slice(0,24);
   addedAdmins+=database.db.prepare("INSERT OR IGNORE INTO campus_members VALUES(?,?,?,NULL,'校级管理员',?,NULL,'启用',?,?,?)").run(id,user.id,user.school_id,user.id,randomUUID(),now,now).changes;
  }
  const result={mode:applied?'apply':'preview',newSchools:addedSchools,newSchoolAdmins:addedAdmins,schoolTotal:database.db.prepare('SELECT count(*) AS n FROM campus_schools').get().n,collegeTotal:database.db.prepare('SELECT count(*) AS n FROM campus_colleges').get().n,responsibleTotal:database.db.prepare("SELECT count(*) AS n FROM campus_members WHERE role='学院负责人'").get().n,unassignedContests:database.db.prepare('SELECT count(*) AS n FROM contests c LEFT JOIN contest_maintenance m ON m.contest_id=c.id WHERE m.contest_id IS NULL').get().n,unassignedPublicContests:database.db.prepare("SELECT count(*) AS n FROM contests c LEFT JOIN contest_maintenance m ON m.contest_id=c.id WHERE m.contest_id IS NULL AND json_extract(c.data,'$.publishedVersionId') IS NOT NULL AND json_extract(c.data,'$.takedown') IS NULL").get().n,backup};
  if(applied)database.commit();else database.rollback();return result;
 }catch(e){database.rollback();throw e;}
}
if(require.main===module){const filename=path.resolve(process.env.DB_PATH||'./data/jingzhi.sqlite');if(!fs.existsSync(filename)){console.error('数据库不存在，拒绝新建；请在backend目录执行。');process.exitCode=1;}else{const db=new Database(filename);try{const args=process.argv.slice(2);if(args.some(a=>a!=='--apply')||args.length>1)throw Error('用法：node src/migrate-campus.cjs [--apply]');console.log(JSON.stringify(migrateCampus(db,{apply:args.includes('--apply'),dbPath:filename}),null,2));console.log(args.includes('--apply')?'高校结构已建立；管理页面和新权限路由尚未接入。':'预览已回滚，确认后添加 --apply。');}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}}}
module.exports={migrateCampus};
