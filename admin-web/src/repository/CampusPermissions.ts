import { CampusActor, CampusCapability, CampusSchool, CampusCollege, ContestMaintenance, CampusMember, CampusPermissionTarget, CampusPermissionSnapshot, CampusPermissionDecision, CampusRole, CampusStatus } from '../models/contracts';
/** 仅以服务器会话的userId和数据库授权快照计算；旧Role字符串不作为新权限来源。 */
export function campusPermission(snapshot:CampusPermissionSnapshot,actor:CampusActor,action:CampusCapability,target:CampusPermissionTarget):CampusPermissionDecision {
 const denied:CampusPermissionDecision={allowed:false,reason:'没有此学校或赛事的管理权限'};
 const allowed:CampusPermissionDecision={allowed:true,reason:'授权有效'};
 if(!actor.userId)return denied;
 const mine:CampusMember[]=snapshot.members.filter((m:CampusMember)=>m.userId===actor.userId&&m.status===CampusStatus.Value0);
 const platform:boolean=mine.some((m:CampusMember)=>m.role===CampusRole.Value0&&m.schoolId===null&&m.collegeId===null);
 if(action===CampusCapability.Value0||action===CampusCapability.Value10||action===CampusCapability.Value11)return platform?allowed:denied;
 if(!target.schoolId)return denied;
 const school=snapshot.schools.find((s:CampusSchool)=>s.id===target.schoolId&&s.status===CampusStatus.Value0);
 if(!school)return {allowed:false,reason:'高校不存在或已停用'};
 if(target.collegeId&&!snapshot.colleges.some((c:CampusCollege)=>c.id===target.collegeId&&c.schoolId===target.schoolId&&c.status===CampusStatus.Value0))return {allowed:false,reason:'学院不存在、跨校或已停用'};
 const schoolAdmin:boolean=mine.some((m:CampusMember)=>m.role===CampusRole.Value1&&m.schoolId===target.schoolId&&m.collegeId===null);
 if(action===CampusCapability.Value1||action===CampusCapability.Value2)return platform||schoolAdmin?allowed:denied;
 if(action===CampusCapability.Value3)return schoolAdmin?allowed:denied;
 if(action===CampusCapability.Value7||action===CampusCapability.Value8||action===CampusCapability.Value9)return schoolAdmin?allowed:denied;
 if(action===CampusCapability.Value4||action===CampusCapability.Value5||action===CampusCapability.Value6){
  if(schoolAdmin)return allowed;
  if(!target.contestId)return denied;
  const assignment=snapshot.maintenance.find((a:ContestMaintenance)=>a.contestId===target.contestId&&a.schoolId===target.schoolId);
  if(!assignment||target.collegeId&&assignment.collegeId!==target.collegeId)return denied;
  if(!snapshot.colleges.some((c:CampusCollege)=>c.id===assignment.collegeId&&c.schoolId===assignment.schoolId&&c.status===CampusStatus.Value0))return {allowed:false,reason:'负责学院已停用'};
  return mine.some((m:CampusMember)=>m.id===assignment.responsibleMemberId&&m.role===CampusRole.Value2&&m.schoolId===assignment.schoolId&&m.collegeId===assignment.collegeId)?allowed:denied;
 }
 return denied;
}
