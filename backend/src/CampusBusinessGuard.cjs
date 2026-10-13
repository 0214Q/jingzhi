const {RepositoryError}=require('../build/RepositoryError');
const {CampusCapability:C}=require('../build/contracts');
function deny(){throw new RepositoryError(403,'没有此赛事的管理授权');}
/** 先查数据库授权，再仅为原有领域服务提供受限兼容上下文；不改变登录返回的旧Role。 */
function guardBusiness(campus,store,context,method,url,body,headers={}){
 if(!campus.enabled||!url.pathname.startsWith('/manage/'))return;
 campus.session();const p=url.pathname.replace(/\/$/,'');let school=headers['x-campus-school']||context.user.schoolId,action=C.Value4,id=null;
 const listRead=method==='GET'&&['/manage/catalog','/manage/contests'].includes(p);
 if(listRead){const allowed=store.contests.filter(c=>c.schoolId===school&&campus.can(C.Value4,c.schoolId,null,c.contestId));if(!campus.can(C.Value4,school)&&!allowed.length){const member=campus.session().members.some(m=>m.role==='学院负责人'&&m.schoolId===school);if(!member)deny();}store.contests=allowed;store.catalogImports=store.catalogImports.filter(x=>allowed.some(c=>c.contestId===x.contest_id));}
 else if(p==='/manage/review/pending'||p==='/manage/review/publicity/pending'){action=C.Value7;campus.require(action,school);}
 else if(p==='/manage/feedback'){action=C.Value9;campus.require(action,school);}
 else if(p==='/manage/contests'&&method==='POST'){action=C.Value5;campus.require(action,school);}
 else{
  let m;if((m=p.match(/^\/manage\/(?:catalog|contests|review)\/([^/]+)/))&&!p.startsWith('/manage/review/publicity/'))id=decodeURIComponent(m[1]);
  else if((m=p.match(/^\/manage\/(?:publicity|review\/publicity)\/([^/]+)/))){const pub=store.publicity.find(x=>x.publicityId===decodeURIComponent(m[1])||x.id===decodeURIComponent(m[1]));if(!pub)deny();id=pub.contestId;}
  else if(p==='/manage/publicity'&&method==='POST')id=body.contestId;
  else if((m=p.match(/^\/manage\/feedback\/([^/]+)\/handle$/))){const feedback=store.feedback.find(x=>x.id===decodeURIComponent(m[1]));if(!feedback)deny();action=C.Value9;if(feedback.contestId)id=feedback.contestId;else{const user=store.users.find(u=>u.id===feedback.userId);if(!user)deny();school=feedback.schoolId||user.schoolId;}}
  else deny();
  if(id){const contest=store.contests.find(c=>c.contestId===id);if(!contest)deny();school=contest.schoolId;}
  if(p.startsWith('/manage/review/'))action=C.Value7;
  else if(/\/(takedown|restore)$/.test(p))action=C.Value8;
  else if(p.startsWith('/manage/feedback/'))action=C.Value9;
  else if(method!=='GET')action=/\/submit$/.test(p)?C.Value6:C.Value5;
  campus.require(action,school,null,id);
 }
 context.user={...context.user,schoolId:school,role:'管理员'};
}
module.exports={guardBusiness};
