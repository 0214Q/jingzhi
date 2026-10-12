import type { CampusRepository } from './CampusRepository';
import type { CampusSession, CampusFilter, CampusSchoolPage, CampusCollegePage, CampusMemberPage, CampusAccountPage, CampusAccountSummary, CreateCampusAccountRequest, CampusMaintenancePage, CampusSchool, CampusCollege, CampusMember, CampusSchoolTree, CreateCampusSchoolRequest, UpdateCampusSchoolRequest, CreateCampusCollegeRequest, UpdateCampusCollegeRequest, CreateCampusMemberRequest, UpdateCampusMemberRequest, ContestMaintenance, AssignContestMaintenanceRequest, CampusAssignmentLock, CampusMaintenanceResult, ConcurrencyHeaders } from '../models/contracts';
import { type HttpTransport, queryPair, querySuffix } from './HttpProtocol';
export class HttpCampusRepository implements CampusRepository {
 constructor(private transport:HttpTransport){}
 private url(resource:string,f:CampusFilter){return '/manage/campus/'+resource+querySuffix([queryPair('schoolId',f.schoolId),queryPair('collegeId',f.collegeId),queryPair('keyword',f.keyword),queryPair('status',f.status),queryPair('page',f.page),queryPair('pageSize',f.pageSize)]);}
 me():Promise<CampusSession>{return this.transport.request('GET','/manage/campus/me');}
 listSchools(f:CampusFilter):Promise<CampusSchoolPage>{return this.transport.request('GET',this.url('schools',f));}
 listColleges(f:CampusFilter):Promise<CampusCollegePage>{return this.transport.request('GET',this.url('colleges',f));}
 listMembers(f:CampusFilter):Promise<CampusMemberPage>{return this.transport.request('GET',this.url('members',f));}
 listAccounts(f:CampusFilter):Promise<CampusAccountPage>{return this.transport.request('GET',this.url('accounts',f));}
 createAccount(input:CreateCampusAccountRequest):Promise<CampusAccountSummary>{return this.transport.request('POST','/manage/campus/accounts',JSON.stringify(input));}
 listMaintenanceContests(f:CampusFilter):Promise<CampusMaintenancePage>{return this.transport.request('GET',this.url('contests',f));}
 createSchool(input:CreateCampusSchoolRequest):Promise<CampusSchool>{return this.transport.request('POST','/manage/campus/schools',JSON.stringify(input));}
 updateSchool(id:string,input:UpdateCampusSchoolRequest,lock:ConcurrencyHeaders):Promise<CampusSchool>{return this.transport.request('PUT','/manage/campus/schools/'+encodeURIComponent(id),JSON.stringify(input),lock.ifMatch);}
 createCollege(input:CreateCampusCollegeRequest):Promise<CampusCollege>{return this.transport.request('POST','/manage/campus/colleges',JSON.stringify(input));}
 updateCollege(id:string,input:UpdateCampusCollegeRequest,lock:ConcurrencyHeaders):Promise<CampusCollege>{return this.transport.request('PUT','/manage/campus/colleges/'+encodeURIComponent(id),JSON.stringify(input),lock.ifMatch);}
 createMember(input:CreateCampusMemberRequest):Promise<CampusMember>{return this.transport.request('POST','/manage/campus/members',JSON.stringify(input));}
 updateMember(id:string,input:UpdateCampusMemberRequest,lock:ConcurrencyHeaders):Promise<CampusMember>{return this.transport.request('PUT','/manage/campus/members/'+encodeURIComponent(id),JSON.stringify(input),lock.ifMatch);}
 getSchoolTree(id:string):Promise<CampusSchoolTree>{return this.transport.request('GET','/manage/campus/schools/'+encodeURIComponent(id)+'/tree');}
 async getMaintenance(id:string):Promise<ContestMaintenance|null>{return (await this.transport.request<CampusMaintenanceResult>('GET','/manage/campus/contests/'+encodeURIComponent(id)+'/maintenance')).maintenance;}
 assignMaintenance(id:string,input:AssignContestMaintenanceRequest,lock:CampusAssignmentLock):Promise<ContestMaintenance>{return this.transport.request('PUT','/manage/campus/contests/'+encodeURIComponent(id)+'/maintenance',JSON.stringify({input,lock}));}
}
