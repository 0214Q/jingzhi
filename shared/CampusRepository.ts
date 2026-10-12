import { CampusSession, CampusAccountPage, CampusAccountSummary, CreateCampusAccountRequest, CampusMaintenancePage, CampusFilter, CampusSchoolPage, CampusCollegePage, CampusMemberPage, CampusSchool, CampusCollege, CampusMember, CampusSchoolTree, CreateCampusSchoolRequest, UpdateCampusSchoolRequest, CreateCampusCollegeRequest, UpdateCampusCollegeRequest, CreateCampusMemberRequest, UpdateCampusMemberRequest, ContestMaintenance, AssignContestMaintenanceRequest, CampusAssignmentLock, ConcurrencyHeaders } from './contracts';
/** 第一步接口契约；管理页面和HTTP实现将在后续步骤接入。 */
export interface CampusRepository {
 me():Promise<CampusSession>;
 listAccounts(filter:CampusFilter):Promise<CampusAccountPage>;
 createAccount(input:CreateCampusAccountRequest):Promise<CampusAccountSummary>;
 listMaintenanceContests(filter:CampusFilter):Promise<CampusMaintenancePage>;
 listSchools(filter:CampusFilter):Promise<CampusSchoolPage>;
 createSchool(input:CreateCampusSchoolRequest):Promise<CampusSchool>;
 updateSchool(id:string,input:UpdateCampusSchoolRequest,lock:ConcurrencyHeaders):Promise<CampusSchool>;
 listColleges(filter:CampusFilter):Promise<CampusCollegePage>;
 createCollege(input:CreateCampusCollegeRequest):Promise<CampusCollege>;
 updateCollege(id:string,input:UpdateCampusCollegeRequest,lock:ConcurrencyHeaders):Promise<CampusCollege>;
 listMembers(filter:CampusFilter):Promise<CampusMemberPage>;
 createMember(input:CreateCampusMemberRequest):Promise<CampusMember>;
 updateMember(id:string,input:UpdateCampusMemberRequest,lock:ConcurrencyHeaders):Promise<CampusMember>;
 getSchoolTree(schoolId:string):Promise<CampusSchoolTree>;
 getMaintenance(contestId:string):Promise<ContestMaintenance|null>;
 assignMaintenance(contestId:string,input:AssignContestMaintenanceRequest,lock:CampusAssignmentLock):Promise<ContestMaintenance>;
}
