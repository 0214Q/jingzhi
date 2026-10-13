const {randomUUID}=require('node:crypto');
const {RepositoryError}=require('../build/RepositoryError');
const {validate,query}=require('./validation.cjs');
function fail(code,message){throw new RepositoryError(code,message);}
const summary=r=>r?{id:r.id,name:r.name,code:r.code,status:r.status}:null;
class StudentSchoolService {
 constructor(database,user){this.db=database.db;this.user=user;this.enabled=Boolean(this.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='student_school_preferences'").get());}
 student(){if(this.user.role!=='学生')fail(403,'仅学生可选择浏览高校');if(!this.enabled)fail(503,'请先完成学生高校数据迁移');}
 school(id){return summary(this.db.prepare('SELECT id,name,code,status FROM campus_schools WHERE id=?').get(id));}
 preference(){this.student();let row=this.db.prepare('SELECT * FROM student_school_preferences WHERE user_id=?').get(this.user.id);if(!row){const home=this.school(this.user.schoolId);this.db.prepare('INSERT INTO student_school_preferences VALUES(?,?,?,?)').run(this.user.id,home?.status==='启用'?home.id:null,randomUUID(),new Date().toISOString());row=this.db.prepare('SELECT * FROM student_school_preferences WHERE user_id=?').get(this.user.id);}return row;}
 context(){const row=this.preference(),selected=this.school(row.selected_school_id),active=selected?.status==='启用';return {homeSchoolId:this.user.schoolId,homeSchool:this.school(this.user.schoolId),selectedSchoolId:row.selected_school_id,selectedSchool:active?selected:null,state:!active?'需重新选择':selected.id===this.user.schoolId?'默认所属高校':'已选择高校',etag:row.etag};}
 list(f){this.student();const page=f.page??1,pageSize=f.pageSize??20;if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>100||f.keyword?.length>200)fail(422,'高校查询参数无效');const rows=this.db.prepare("SELECT id,name,code,status FROM campus_schools WHERE status='启用' ORDER BY name,id").all().filter(r=>!f.keyword||(r.name+' '+r.code).toLowerCase().includes(f.keyword.toLowerCase()));return {list:rows.slice((page-1)*pageSize,page*pageSize).map(summary),total:rows.length,page,pageSize};}
 select(input){this.student();if(!input.schoolId.trim()||input.schoolId.length>100||!input.expectedEtag||input.expectedEtag.length>100)fail(422,'请选择有效高校并携带当前版本');const before=this.preference();if(before.etag!==input.expectedEtag)fail(409,'浏览高校已改变，请刷新高校信息');const target=this.school(input.schoolId);if(target?.status!=='启用')fail(422,'高校不存在或已停用，请重新选择');if(before.selected_school_id===target.id)return this.context();this.db.prepare('UPDATE student_school_preferences SET selected_school_id=?,etag=?,updated_at=? WHERE user_id=?').run(target.id,randomUUID(),new Date().toISOString(),this.user.id);this.db.prepare('INSERT INTO student_school_audit_logs VALUES(?,?,?,?,?)').run(randomUUID(),this.user.id,before.selected_school_id,target.id,new Date().toISOString());return this.context();}
 async dispatch(method,url,body){const p=url.pathname.replace(/\/$/,'');if(p==='/student/schools'&&method==='GET')return this.list(query(url,'StudentSchoolQuery'));if(p==='/student/school-context'&&method==='GET'){if(url.search)fail(422,'高校上下文不接受查询参数');return this.context();}if(p==='/student/school-selection'&&method==='PUT'){if(url.search)fail(422,'高校选择不接受查询参数');return this.select(validate(body,'SelectStudentSchoolRequest'));}fail(404,'学生高校接口不存在或方法不支持');}
 /** Applies server-stored selection to public data only, never to auth or management. */
 guard(context,store,method,url,headers){if(!this.enabled)return;const p=url.pathname.replace(/\/$/,'');if(!(p==='/contests'||p.startsWith('/contests/')||p==='/favorites'||p.startsWith('/favorites/')||p==='/feedback'||p==='/feedback/mine'))return;
 if(context.user.role==='学生'){const selected=this.context();if(!selected.selectedSchool)fail(409,'当前浏览高校已停用或未选择，请重新选择高校');const explicit=headers['x-student-school'];if(explicit!==undefined&&explicit!==selected.selectedSchoolId)fail(409,'浏览高校已改变，请刷新页面后重试');context.user={...context.user,schoolId:selected.selectedSchool.id};}
 else {const home=this.school(context.user.schoolId);if(home?.status!=='启用')fail(403,'所属高校不存在或已停用');}
 if(method==='DELETE'&&p.startsWith('/favorites/')){const id=decodeURIComponent(p.slice('/favorites/'.length));const c=store.contests.find(c=>c.contestId===id);if(!c||c.schoolId!==context.user.schoolId)fail(403,'只能取消当前高校的收藏');}
 }
}
module.exports={StudentSchoolService};
