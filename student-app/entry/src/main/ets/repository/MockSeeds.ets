import { ContestPayload, ContestVersion, Contest, User, Organization, Role, Category, ScopeType, EntryType, Completeness, CreditApplicable, ContestLevel, VersionStatus, ContestStatus, ChangeType, Visibility, PublicityType } from '../models/Contracts';
import { MockStore, copy } from './MockStore';
export function makeUsers(): User[] {
  return [
    { id:'student',role:Role.Value0,schoolId:'HENU',openid:null,subscribes:[],devices:[] },
    { id:'editor',role:Role.Value1,schoolId:'HENU',openid:null,subscribes:[],devices:[] },
    { id:'organizer',role:Role.Value2,schoolId:'HENU',openid:null,subscribes:[],devices:[] },
    { id:'admin',role:Role.Value3,schoolId:'HENU',openid:null,subscribes:[],devices:[] }
  ];
}
export function makeOrganizations(): Organization[] {
  return [{id:'ORG-DEMO',schoolId:'HENU',name:'演示主办单位（非官方）',type:'演示',contact:null,intro:'纯演示数据',owners:['organizer']}];
}
export function demoPayload(index: number): ContestPayload {
  const categories: Category[] = [Category.Value0,Category.Value1,Category.Value2,Category.Value3,Category.Value4];
  return { name:'【演示】校园赛事 '+index.toString(),category:categories[(index-1)%5],scopeType:ScopeType.Value0,edition:'演示2026',level:ContestLevel.Value0,
    applicableScope:{colleges:[],majors:[],grades:[],degrees:[],campuses:[],applicableNote:'以原通知为准（演示）'},entryType:EntryType.Value0,
    sourceTitle:'演示通知（不是真实河大通知）',sourceOrg:'演示单位',sourceUrl:'https://example.invalid/demo/'+index.toString(),sourcePublishedAt:'2026-09-01',collectedAt:'2026-10-01T09:00:00+08:00',lastVerifiedAt:'2026-10-01',completeness:Completeness.Value0,
    regStart:'2026-10-01',regEnd:index%2===0?'2026-10-20':'2026-10-20T17:00:00+08:00',contestStart:'2026-11-01',contestEnd:'2026-11-02',publicityTime:null,
    contestRequirement:'演示：面向在校学生',reviewRules:index%3===0?null:'演示评审规则',awardSetting:index%3===0?null:'演示一等奖',material:null,entryMethod:'演示：查看原通知，不提供站内报名',contact:null,description:'此记录仅用于开发验证，不可用于报名。',creditApplicable:CreditApplicable.Value1,creditBasis:null,creditNote:null,organizationId:'ORG-DEMO',attachmentIds:[] };
}
export function makeSeeds(store: MockStore): void {
  for(let i=1;i<=18;i+=1) {
    const payload=demoPayload(i);
    if(i===1)payload.regEnd='2026-10-12T17:00:00+08:00';
    if(i===2)payload.regEnd='2026-10-11';
    if(i===4)payload.regEnd='2026-10-13T17:00:00+08:00';
    const id='DEMO-'+i.toString(); const vid=id+'-v1';
    let status=VersionStatus.Value2;
    if(i===16) status=VersionStatus.Value0; if(i===17) status=VersionStatus.Value1; if(i===18) status=VersionStatus.Value3;
    let phase=ContestStatus.Value1;
    if(i===10) phase=ContestStatus.Value4; if(i===11) phase=ContestStatus.Value5;
    if(i>=12&&i<=15) { phase=ContestStatus.Value6; payload.regStart='2026-08-01';payload.regEnd='2026-08-20';payload.contestStart='2026-09-01';payload.contestEnd='2026-09-02'; }
    payload.completeness=payload.reviewRules===null?Completeness.Value1:Completeness.Value0;
    const version: ContestVersion={versionId:vid,contestId:id,versionNo:1,status:status,etag:vid+'-e1',isCurrent:status===VersionStatus.Value2,payload:payload,operator:'editor',operatorRole:Role.Value1,entryType:payload.entryType,changeType:ChangeType.Value1,reason:'演示首录',createdAt:'2026-10-01T09:00:00+08:00',submittedAt:status===VersionStatus.Value0?null:'2026-10-01T10:00:00+08:00',reviewedAt:status===VersionStatus.Value2?'2026-10-01T11:00:00+08:00':null,reviewNote:status===VersionStatus.Value3?'演示驳回备注（内部）':null,updatedAt:'2026-10-01T11:00:00+08:00'};
    const contest: Contest={contestId:id,schoolId:'HENU',publishedVersionId:status===VersionStatus.Value2?vid:null,contestStatus:phase,takedown:i===15?{reason:'演示下架',at:'2026-10-02T09:00:00+08:00',by:'admin'}:null,createdBy:'editor',updatedAt:version.updatedAt};
    version.updatedAt='2026-10-'+(i<10?'0':'')+Math.min(i,10).toString()+'T11:00:00+08:00';
    contest.updatedAt=version.updatedAt;
    store.contests.push(contest);store.versions.push(version);
    store.logs.push({id:id+'-log',contestId:id,versionId:vid,operator:'editor',time:version.createdAt,field:'created',oldValue:null,newValue:payload.name,reason:'演示首录',changeType:ChangeType.Value1,visibility:status===VersionStatus.Value2?Visibility.Value0:Visibility.Value1});
  }
  store.publicity.push({id:'DEMO-PUB-11',contestId:'DEMO-11',type:PublicityType.Value1,reviewStatus:VersionStatus.Value2,versionNo:1,content:'【演示】已审核评审办法',operator:'editor',etag:'DEMO-PUB-11-e1',reason:'演示公示',reviewNote:'内部备注不公开',publishedAt:'2026-10-01T11:00:00+08:00'});

  // Rich detail fixtures, all explicitly synthetic. Published historical payloads remain immutable.
  const current=store.versions.find((v:ContestVersion)=>v.contestId==='DEMO-1');
  if(current) {
    const historical=copy(current);historical.versionId='DEMO-1-v0';historical.versionNo=1;historical.isCurrent=false;historical.payload.regEnd='2026-10-15T17:00:00+08:00';historical.payload.name='【演示】校园赛事原名';historical.updatedAt='2026-10-01T11:00:00+08:00';
    current.versionNo=2;store.versions.push(historical);
    store.logs.push({id:'DEMO-1-source-change',contestId:'DEMO-1',versionId:current.versionId,operator:'editor',time:'2026-10-02T10:00:00+08:00',field:'regEnd',oldValue:JSON.stringify(historical.payload.regEnd),newValue:JSON.stringify(current.payload.regEnd),reason:'【演示】原通知调整截止日',changeType:ChangeType.Value0,visibility:Visibility.Value0});
    store.logs.push({id:'DEMO-1-correction',contestId:'DEMO-1',versionId:current.versionId,operator:'editor',time:'2026-10-02T11:00:00+08:00',field:'name',oldValue:JSON.stringify(historical.payload.name),newValue:JSON.stringify(current.payload.name),reason:'【演示】录入名称纠错',changeType:ChangeType.Value1,visibility:Visibility.Value0});
    store.logs.push({id:'DEMO-1-private',contestId:'DEMO-1',versionId:current.versionId,operator:'admin',time:'2026-10-02T11:00:00+08:00',field:'review',oldValue:null,newValue:'内部审核说明',reason:'内部信息不得公开',changeType:ChangeType.Value1,visibility:Visibility.Value1});
  }
  store.publicity.push({id:'DEMO-PUB-11-v2',contestId:'DEMO-11',type:PublicityType.Value1,reviewStatus:VersionStatus.Value2,versionNo:2,content:'【演示】修订后的评审办法',operator:'editor',etag:'DEMO-PUB-11-v2-e1',reason:'演示公示更新',reviewNote:'内部公示说明',publishedAt:'2026-10-02T11:00:00+08:00'});
  store.publicity.push({id:'DEMO-WINNERS-11',contestId:'DEMO-11',type:PublicityType.Value0,reviewStatus:VersionStatus.Value2,versionNo:1,content:{text:null,winners:[{name:'演示团队甲（虚构）',award:'演示一等奖',workTitle:'演示作品',organizationName:'演示学院'}]},operator:'editor',etag:'DEMO-WINNERS-11-e1',reason:'演示名单',reviewNote:null,publishedAt:'2026-10-02T11:00:00+08:00'});
  store.publicity.push({id:'DEMO-PENDING-11',contestId:'DEMO-11',type:PublicityType.Value2,reviewStatus:VersionStatus.Value1,versionNo:1,content:'尚未公开评分标准',operator:'editor',etag:'DEMO-PENDING-11-e1',reason:'待审演示',reviewNote:'不得公开',publishedAt:null});

}
