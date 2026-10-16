const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {Database}=require('./database.cjs');
function migrateFileImport(database,options={}){
 const db=database.db;if(!db.prepare('SELECT 1 FROM schema_migrations WHERE version=3').get())throw Error('请先完成003学生高校迁移');
 const applied=Boolean(options.apply);let backup=null;
 if(applied){backup=path.resolve(options.backupPath||path.join(path.dirname(options.dbPath||'./data/jingzhi.sqlite'),'backups','file-import-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8)+'.sqlite'));if(fs.existsSync(backup))throw Error('备份文件已存在');fs.mkdirSync(path.dirname(backup),{recursive:true});db.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 database.begin();try{db.exec(fs.readFileSync(path.join(__dirname,'../migrations/004_file_import.sql'),'utf8'));
 const result={mode:applied?'apply':'preview',schemaVersion:4,files:db.prepare('SELECT count(*) n FROM import_files').get().n,jobs:db.prepare('SELECT count(*) n FROM import_jobs').get().n,backup};if(applied)database.commit();else database.rollback();return result;
 }catch(e){database.rollback();throw e;}
}
if(require.main===module){const filename=path.resolve(process.env.DB_PATH||'./data/jingzhi.sqlite');if(!fs.existsSync(filename)){console.error('数据库不存在，拒绝新建，请在backend目录执行');process.exitCode=1;}else{const db=new Database(filename);try{const args=process.argv.slice(2);if(args.some(x=>x!=='--apply')||args.length>1)throw Error('用法：node src/migrate-file-import.cjs [--apply]');console.log(JSON.stringify(migrateFileImport(db,{apply:args.includes('--apply'),dbPath:filename}),null,2));console.log(args.includes('--apply')?'文件导入存储已建立；上传与识别接口可用，原赛事及授权保持不变。':'预览已回滚，确认后添加 --apply。');}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}}}
module.exports={migrateFileImport};
