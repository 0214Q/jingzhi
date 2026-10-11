const {DatabaseSync}=require('node:sqlite');
const {readFileSync,mkdirSync}=require('node:fs');
const path=require('node:path');
const {randomBytes,scryptSync,timingSafeEqual}=require('node:crypto');
const {DomainStore}=require('../build/DomainStore');
const {RepositoryError}=require('../build/RepositoryError');
function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
function verifyPassword(password,encoded){const [salt,expected]=encoded.split(':');const computed=scryptSync(password,salt,64);const stored=Buffer.from(expected,'hex');return stored.length===computed.length&&timingSafeEqual(stored,computed);}
const collections={organizations:['organizations','id'],contests:['contests','contestId'],versions:['versions','versionId'],logs:['audit_logs','id'],publicity:['publicity','id'],reviews:['reviews','id'],feedback:['feedback','id'],publicityActions:['publicity_actions','id']};
class Database {
 constructor(filename){if(filename!==':memory:')mkdirSync(path.dirname(path.resolve(filename)),{recursive:true});this.db=new DatabaseSync(filename);this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');this.db.exec(readFileSync(path.join(__dirname,'../migrations/001_initial.sql'),'utf8'));}
 close(){this.db.close();}
 begin(){this.db.exec('BEGIN IMMEDIATE');}
 commit(){this.db.exec('COMMIT');}
 rollback(){this.db.exec('ROLLBACK');}
 load(){const s=new DomainStore();if(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_imports'").get())s.catalogImports=this.db.prepare('SELECT * FROM catalog_imports').all();if(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_publications'").get())s.catalogPublications=this.db.prepare('SELECT * FROM catalog_publications').all();s.users=this.db.prepare('SELECT data FROM users ORDER BY rowid').all().map(r=>JSON.parse(r.data));for(const [key,[table]] of Object.entries(collections))s[key]=this.db.prepare('SELECT data FROM '+table+' ORDER BY rowid').all().map(r=>JSON.parse(r.data));s.favorites=this.db.prepare('SELECT data FROM favorites ORDER BY rowid').all().map(r=>JSON.parse(r.data));for(const r of this.db.prepare('SELECT * FROM draft_fields').all())s.unselectedDraftFields[r.version_id]=JSON.parse(r.data);s.withdrawnTypes=this.db.prepare('SELECT key FROM withdrawn_types').all().map(r=>r.key);return s;}
 save(s){

  for(const [key,[table,idField]] of Object.entries(collections)){
   for(const item of s[key]){
    const cols=['id'],vals=[item[idField]];
    if(['organizations','contests'].includes(table)){cols.push('school_id');vals.push(item.schoolId);}
    if(table==='contests'){cols.push('published_version_id');vals.push(item.publishedVersionId);}
    if(['versions','audit_logs','publicity','reviews'].includes(table)){cols.push('contest_id');vals.push(item.contestId);}
    if(['versions','publicity'].includes(table)){cols.push('etag','status');vals.push(item.etag,item.status||item.reviewStatus);}
    if(table==='feedback'){cols.push('user_id');vals.push(item.userId);}
    cols.push('data');vals.push(JSON.stringify(item));
    this.db.prepare(`INSERT INTO ${table}(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${cols.slice(1).map(c=>c+'=excluded.'+c).join(',')}`).run(...vals);
   }
  }
  if(s.catalogPublications.length){const save=this.db.prepare('INSERT INTO catalog_publications VALUES(?,?,?,?,?,?) ON CONFLICT(version_id) DO UPDATE SET payload_hash=excluded.payload_hash,authorized_at=excluded.authorized_at,authorized_by=excluded.authorized_by');for(const r of s.catalogPublications)save.run(r.version_id,r.school_id,r.import_key,r.payload_hash,r.authorized_at,r.authorized_by);}
  this.db.exec('DELETE FROM favorites; DELETE FROM draft_fields; DELETE FROM withdrawn_types;');
  const favorite=this.db.prepare('INSERT INTO favorites VALUES(?,?,?)');for(const f of s.favorites)favorite.run(f.userId,f.contestId,JSON.stringify(f));
  const fields=this.db.prepare('INSERT INTO draft_fields VALUES(?,?)');for(const [id,value] of Object.entries(s.unselectedDraftFields))fields.run(id,JSON.stringify(value));
  const withdrawn=this.db.prepare('INSERT INTO withdrawn_types VALUES(?)');for(const key of s.withdrawnTypes)withdrawn.run(key);
 }
 addUser(user,password){if(this.db.prepare('SELECT id FROM users WHERE id=?').get(user.id))throw new RepositoryError(409,'账号已存在');this.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(user.id,user.schoolId,user.role,hashPassword(password),JSON.stringify(user));}
}
module.exports={Database,hashPassword,verifyPassword};
