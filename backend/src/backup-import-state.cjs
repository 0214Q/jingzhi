// Offline backup of SQLite plus private source files. Stop start-dev.cmd before running.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Database}=require('./database.cjs');
function backupImportState(database,{output,storageDir}){
 if(!output||fs.existsSync(output))throw Error('请提供尚不存在的备份目录');
 if(!database.db.prepare('SELECT 1 FROM schema_migrations WHERE version=4').get())throw Error('请先完成004迁移');
 const destination=path.resolve(output),staging=destination+'.partial-'+crypto.randomUUID();fs.mkdirSync(staging,{recursive:true,mode:0o700});
 try{
  database.db.exec("VACUUM INTO '"+path.join(staging,'jingzhi.sqlite').replaceAll("'","''")+"'");
  const snapshot=new Database(path.join(staging,'jingzhi.sqlite'));let files;
  try{files=snapshot.db.prepare('SELECT id,data FROM import_files').all().map(r=>({id:r.id,file:JSON.parse(r.data),retained:!!snapshot.db.prepare('SELECT 1 FROM import_job_files f JOIN import_draft_links l ON l.job_id=f.job_id WHERE f.file_id=?').get(r.id)}));}finally{snapshot.close();}
  const manifest={createdAt:new Date().toISOString(),database:'jingzhi.sqlite',files:[]};const target=path.join(staging,'import-files');fs.mkdirSync(target,{mode:0o700});
  for(const {id,file,retained} of files){
   if(!/^if-[0-9a-f-]{36}$/.test(id))throw Error('文件元数据ID异常');const source=path.join(storageDir,id+'.bin');
   if(!fs.existsSync(source)){if(file.status==='已接收'&&(retained||file.expiresAt>new Date().toISOString()))throw Error('有效或已引用的原材料缺失，备份未完成：'+id);continue;}
   const bytes=fs.readFileSync(source),sha=crypto.createHash('sha256').update(bytes).digest('hex');if(sha!==file.sha256)throw Error('原材料摘要不一致，备份未完成：'+id);fs.writeFileSync(path.join(target,id+'.bin'),bytes,{mode:0o600});manifest.files.push({fileId:id,sha256:sha,byteSize:bytes.length});
  }
  fs.writeFileSync(path.join(staging,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600});fs.renameSync(staging,destination);return {backup:destination,sourceFiles:manifest.files.length};
 }catch(e){fs.rmSync(staging,{recursive:true,force:true});throw e;}
}
if(require.main===module){try{process.loadEnvFile(path.join(__dirname,'../.env'));}catch(e){if(e.code!=='ENOENT')throw e;}const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output'){console.error('用法：停止服务后 node src/backup-import-state.cjs --output <尚不存在的备份目录>');process.exitCode=1;}else{const dbPath=path.resolve(process.env.DB_PATH||'data/jingzhi.sqlite');if(!fs.existsSync(dbPath)){console.error('数据库不存在');process.exitCode=1;}else{const db=new Database(dbPath);try{console.log(JSON.stringify(backupImportState(db,{output:path.resolve(args[1]),storageDir:path.resolve(process.env.IMPORT_STORAGE_DIR||path.join(path.dirname(dbPath),'import-files'))}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}}}}
module.exports={backupImportState};
