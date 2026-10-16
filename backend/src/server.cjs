const http=require('node:http');
const crypto=require('node:crypto');
const path=require('node:path'),fs=require('node:fs');
const {ImportRuntime}=require('./ImportRuntime.cjs');
const {Database,verifyPassword}=require('./database.cjs');
const {RepositoryError}=require('../build/RepositoryError');
const {RequestContext}=require('../build/DomainStore');
const {ContestService}=require('../build/ContestService');
const {PublicityService}=require('../build/PublicityService');
const {FavoriteService,FeedbackService}=require('../build/InteractionRepository');
const {dispatch}=require('./routes.cjs');
const {CatalogService}=require('./CatalogService.cjs');
const {CampusService}=require('./CampusService.cjs');
const {StudentSchoolService}=require('./StudentSchoolService.cjs');
const {guardBusiness}=require('./CampusBusinessGuard.cjs');
const {validate}=require('./validation.cjs');
const digest=token=>crypto.createHash('sha256').update(token).digest('hex');
async function readBody(req){let length=0,chunks=[];for await(const chunk of req){length+=chunk.length;if(length>256*1024)throw new RepositoryError(413,'请求体过大');chunks.push(chunk);}if(!length)return {};if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))throw new RepositoryError(415,'请使用application/json');try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new RepositoryError(400,'无效JSON');}}
function createServer(options={}){
 const database=new Database(options.dbPath||process.env.DB_PATH||'./data/jingzhi.sqlite');
 const ttl=Number(options.ttlSeconds||process.env.SESSION_TTL_SECONDS||3600);if(!Number.isInteger(ttl)||ttl<1||ttl>86400)throw Error('Invalid SESSION_TTL_SECONDS');
 const origins=new Set(options.origins||(process.env.CORS_ORIGINS||'http://localhost:5173,http://127.0.0.1:5173').split(',').map(x=>x.trim()));
 let closing=null;let queue=Promise.resolve();const attempts=new Map();
 function serialized(operation){const result=queue.then(operation);queue=result.catch(()=>{});return result;}
 const importRuntime=new ImportRuntime(database,{serialized,storageDir:options.importStorageDir||process.env.IMPORT_STORAGE_DIR||path.join(path.dirname(path.resolve(options.dbPath||process.env.DB_PATH||'./data/jingzhi.sqlite')),'import-files'),config:options.importConfig,recognize:options.importRecognize,fetchImpl:options.importFetch});
 function importUser(req){const match=(req.headers.authorization||'').match(/^Bearer ([A-Za-z0-9_-]{43})$/);if(!match)throw new RepositoryError(401,'请先登录');const row=database.db.prepare('SELECT s.expires_at,u.data FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=?').get(digest(match[1]));if(!row||row.expires_at<=Date.now())throw new RepositoryError(401,'登录已失效');return JSON.parse(row.data);}
 const server=http.createServer(async(req,res)=>{
  const traceId=crypto.randomUUID();res.setHeader('X-Request-Id',traceId);res.setHeader('Cache-Control','no-store');
  const reply=(status,data,message='')=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({code:status,message,data:data===undefined?null:data,traceId}));};
  try{
   const origin=req.headers.origin;if(origin){if(!origins.has(origin))throw new RepositoryError(403,'不允许的访问来源');res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Expose-Headers','X-Request-Id');}
   if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,If-Match,X-Campus-School,X-Student-School');res.statusCode=204;res.end();return;}
   const url=new URL(req.url,'http://localhost');if(url.pathname==='/health'&&req.method==='GET'){reply(200,{status:'ok',schemaVersion:database.db.prepare('SELECT max(version) AS version FROM schema_migrations').get().version});return;}
   const upload=url.pathname.match(/^\/manage\/import-files\/([^/]+)\/content$/);
   if(upload&&req.method==='PUT'){const result=await importRuntime.receive(decodeURIComponent(upload[1]),req,()=>importUser(req));reply(200,result);return;}
   const body=await readBody(req);
   const result=await serialized(async()=>{
    database.begin();try{
     let result;
     if(url.pathname==='/auth/login'&&req.method==='POST'){
      validate(body,'LoginRequest');if(!body.account||!body.password||body.agcToken||body.account.length>128||body.password.length>256)throw new RepositoryError(401,'账号或密码错误');
      const key=(req.socket.remoteAddress||'')+':'+body.account,now=Date.now();let attempt=attempts.get(key);if(!attempt||attempt.until<=now)attempt={count:0,until:now+15*60000};if(attempt.count>=10)throw new RepositoryError(429,'登录失败次数过多，请稍后重试');attempt.count++;attempts.set(key,attempt);if(attempts.size>10000)attempts.delete(attempts.keys().next().value);
      const row=database.db.prepare('SELECT * FROM users WHERE id=?').get(body.account);const fallback=database.db.prepare('SELECT password_hash FROM users LIMIT 1').get();const encoded=row?.password_hash||fallback?.password_hash;const valid=encoded?verifyPassword(body.password,encoded):false;if(!row||!valid)throw new RepositoryError(401,'账号或密码错误');attempts.delete(key);
      database.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);const token=crypto.randomBytes(32).toString('base64url'),expiry=now+ttl*1000;database.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),row.id,expiry);result={token,tokenType:'Bearer',expiresAt:new Date(expiry).toISOString(),user:JSON.parse(row.data)};
     }else{
      const match=(req.headers.authorization||'').match(/^Bearer ([A-Za-z0-9_-]{43})$/);if(!match)throw new RepositoryError(401,'请先登录');const session=database.db.prepare('SELECT s.*,u.data FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=?').get(digest(match[1]));if(!session||session.expires_at<=Date.now())throw new RepositoryError(401,'登录已失效');
      if(url.pathname==='/auth/me'&&req.method==='GET')result=JSON.parse(session.data);
      else if(url.pathname==='/auth/logout'&&req.method==='POST'){database.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(match[1]));result=undefined;}
      else{const studentSchool=new StudentSchoolService(database,JSON.parse(session.data));const campus=new CampusService(database,JSON.parse(session.data));if(url.pathname.startsWith('/manage/import-'))result=await importRuntime.service(JSON.parse(session.data)).dispatch(req.method,url,body);else if(url.pathname.startsWith('/student/'))result=await studentSchool.dispatch(req.method,url,body);else if(url.pathname.startsWith('/manage/campus/'))result=await campus.dispatch(req.method,url,body,req.headers);else{const store=database.load(),context=new RequestContext();context.user=JSON.parse(session.data);context.expiresAt=session.expires_at;const originalUser={...context.user},versionEtags=new Map(store.versions.map(v=>[v.versionId,v.etag]));studentSchool.guard(context,store,req.method,url,req.headers);guardBusiness(campus,store,context,req.method,url,body,req.headers);const repositories={contests:new ContestService(store,context),publicity:new PublicityService(store,context),favorites:new FavoriteService(store,context),feedback:new FeedbackService(store,context)};repositories.catalog=new CatalogService(store,context,repositories.contests);repositories.catalog.includeManaged=campus.enabled;result=await dispatch(req.method,url,body,req.headers,repositories);if(req.method!=='GET'){for(const v of store.versions)if(v.operator===originalUser.id&&versionEtags.get(v.versionId)!==v.etag)v.operatorRole=originalUser.role;database.save(store);}}}
     }
     database.commit();return result;
    }catch(e){database.rollback();throw e;}
   });
   importRuntime.wake();
   if(result?.download){res.statusCode=200;res.setHeader('Content-Type',result.download.mime);res.setHeader('Content-Disposition','attachment; filename="source"');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");const stream=fs.createReadStream(result.download.path);stream.on('error',()=>{if(!res.headersSent)reply(404,null,'原材料文件不存在');else res.destroy();});stream.pipe(res);return;}
   reply(200,result);
  }catch(e){if(e instanceof RepositoryError)reply(e.code,e.details,e.message);else{console.error('Request failed',traceId,e.message);reply(500,null,'服务暂时不可用');}}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;
 return {server,database,importRuntime,close(){if(!closing)closing=(async()=>{const stopped=server.listening?new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve())):Promise.resolve();await importRuntime.close();await stopped;await queue;database.close();})();return closing;}};
}
if(require.main===module){try{process.loadEnvFile(path.join(__dirname,'../.env'));}catch(e){if(e.code!=='ENOENT')throw e;}const app=createServer();const port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1';app.server.listen(port,host,()=>console.log(`Jingzhi API http://${host}:${port} (SQLite)`));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit(0)));}
module.exports={createServer};
