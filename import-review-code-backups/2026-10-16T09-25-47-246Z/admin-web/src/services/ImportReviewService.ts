import { ImportFieldKey, ImportDecisionKind, ImportDuplicateDecision, EntryType, ChangeType, CreditApplicable, Completeness, Category, ScopeType, ContestLevel, type ImportJob, type ImportRecognitionResult, type ImportFieldCandidate, type ImportFieldConfirmation, type ImportStageConfirmation, type ConfirmImportDraftRequest, type ContestPayload, type CreateDraftRequest } from '../models/contracts';
import { blankPayload, applyInput, validate, validDate } from '../repository/MockRules';
export type ReviewMode='candidate'|'manual'|'unknown';
export interface FieldReview {field:ImportFieldKey;label:string;mode:ReviewMode;value:string;candidateId:string|null;evidenceIds:string[];note:string;verified:boolean;existingValue:string|null;candidates:ImportFieldCandidate[]}
export interface StageReview extends FieldReview {stage:string;fixedName:boolean;sourceUrl:string}
export const dateFields:string[]=['regStart','regEnd','contestStart','contestEnd','publicityTime','sourcePublishedAt','lastVerifiedAt','stageDate'];
export const labels:Record<string,string>={name:'赛事名称',category:'分类',scopeType:'赛事归属',edition:'届次 / 年度',level:'赛事层级',regStart:'报名开始',regEnd:'报名截止',contestStart:'整项比赛开始',contestEnd:'整项比赛结束',publicityTime:'公示时间',contestRequirement:'参赛要求',reviewRules:'评审规则',awardSetting:'奖项设置',material:'参赛材料',entryMethod:'报名方式',contact:'联系方式',description:'简介与来源说明',sourceTitle:'来源通知标题',sourceOrg:'来源发布单位 / 主办方',sourceUrl:'原通知网页链接',sourcePublishedAt:'原文发布日期',lastVerifiedAt:'最近核对日期'};
export const requiredFields=['name','edition','category','scopeType','level'];
export function optionsFor(field:string):string[]|null{return field==='category'?Object.values(Category):field==='scopeType'?Object.values(ScopeType):field==='level'?Object.values(ContestLevel):null;}
function copy<T>(x:T):T{return JSON.parse(JSON.stringify(x)) as T;}
function scalar(p:ContestPayload|null,field:string):string|null{const v=p?(p as unknown as Record<string,unknown>)[field]:null;return typeof v==='string'&&v.length?v:null;}
function row(field:ImportFieldKey,label:string,candidates:ImportFieldCandidate[],existingValue:string|null):FieldReview {const nonempty=candidates.filter(c=>c.value!==null);const unique=[...new Set(nonempty.map(c=>c.value))];const selected=existingValue===null&&unique.length===1?nonempty[0]:null;return {field,label,mode:existingValue!==null?'manual':selected?'candidate':'unknown',value:existingValue||selected?.value||'',candidateId:selected?.candidateId||null,evidenceIds:selected?.evidenceIds.slice()||[],note:'',verified:false,existingValue,candidates:copy(candidates)};}
export function reviewFields(result:ImportRecognitionResult,base:ContestPayload|null):FieldReview[]{return Object.values(ImportFieldKey).filter(f=>f!==ImportFieldKey.Value22).map(field=>row(field,labels[field]||field,result.candidates.filter(c=>c.field===field),scalar(base,field)));}
export function reviewStages(result:ImportRecognitionResult,base:ContestPayload|null):StageReview[]{const names=[...new Set([...(base?.schedule||[]).map(s=>s.stage),...result.candidates.filter(c=>c.field===ImportFieldKey.Value22).map(c=>c.stage||'原文日期（请确认阶段）')])];return names.map(stage=>{const prior=base?.schedule?.find(s=>s.stage===stage);return {...row(ImportFieldKey.Value22,stage,result.candidates.filter(c=>c.field===ImportFieldKey.Value22&&c.stage===stage),prior?.value||null),stage,fixedName:true,sourceUrl:prior?.sourceUrl||''};});}
export function setReviewMode(row:FieldReview,mode:ReviewMode):void {row.mode=mode;row.verified=false;row.note='';if(mode==='unknown'){row.value='';row.candidateId=null;row.evidenceIds=[];}else if(mode==='candidate'){const first=row.candidates.find(c=>c.value!==null);row.candidateId=first?.candidateId||null;row.value=first?.value||'';row.evidenceIds=first?.evidenceIds.slice()||[];}else row.candidateId=null;}
export function setCandidate(row:FieldReview,id:string):void{const c=row.candidates.find(c=>c.candidateId===id);row.candidateId=c?.candidateId||null;row.value=c?.value||'';row.evidenceIds=c?.evidenceIds.slice()||[];row.verified=false;row.note='';}
export function isDate(field:string):boolean{return dateFields.includes(field);}
export function confirmRow(row:FieldReview):ImportFieldConfirmation{
 if(!row.verified)throw Error('请核对并勾选：'+row.label);
 const value=row.mode==='unknown'?null:row.value.trim()||null;
 if(row.mode==='unknown')return {field:row.field,decision:ImportDecisionKind.Value2,candidateId:null,value:null,evidenceIds:[],note:row.note.trim()||null};
 if(value===null)throw Error(row.label+'：请填写值或选择保留未知');
 if(row.mode==='manual'&&!row.note.trim())throw Error(row.label+'：人工填写须说明核对依据');
 if(row.mode==='candidate'){
  const c=row.candidates.find(c=>c.candidateId===row.candidateId);if(!c||c.value!==value)throw Error(row.label+'：请重新选择候选');
  if((c.confidence===null||c.confidence<0.85||isDate(row.field))&&!row.note.trim())throw Error(row.label+'：需要填写原文核对说明');
  if(isDate(row.field)&&!['仅日期','精确时刻'].includes(c.datePrecision||''))throw Error(row.label+'：原文精度不足，不能采用具体日期');
 }
 if(isDate(row.field)&&(!validDate(value)||value.includes('T')&&!value.endsWith('+08:00')))throw Error(row.label+'：请输入有效日期；精确时刻需包含+08:00');
 return {field:row.field,decision:row.mode==='candidate'?ImportDecisionKind.Value0:ImportDecisionKind.Value1,candidateId:row.mode==='candidate'?row.candidateId:null,value,evidenceIds:row.evidenceIds.slice(),note:row.note.trim()||null};
}
export function buildConfirmation(input:{job:ImportJob;result:ImportRecognitionResult;fields:FieldReview[];stages:StageReview[];base:ContestPayload|null;expectedPublishedEtag:string|null;reason:string;applicableNote:string;issueNotes:Record<string,string>;duplicateNote:string;key:string;finalChecked:boolean}):ConfirmImportDraftRequest {
 if(input.job.status!=='待确认'||input.result.jobId!==input.job.jobId||input.result.jobEtag!==input.job.etag)throw Error('识别结果已变化，请重新载入');
 if(!input.finalChecked)throw Error('请确认已核对原材料、适用范围和学分信息');
 if(!input.reason.trim())throw Error('请填写修改原因');
 const confirmations=input.fields.map(confirmRow);for(const field of requiredFields)if(!confirmations.some(c=>c.field===field&&c.value))throw Error((labels[field]||field)+'必须明确填写');
 const draft:CreateDraftRequest=input.base?{...copy(input.base),changeType:ChangeType.Value0,reason:input.reason.trim()}:{entryType:EntryType.Value0,changeType:ChangeType.Value1,reason:input.reason.trim(),creditApplicable:CreditApplicable.Value2,creditNote:'尚未取得学校认定依据，请向学院确认。'};
 delete draft.schedule;delete draft.attachmentIds;delete draft.collectedAt;
 for(const c of confirmations){const v=c.value??(['name','entryMethod','lastVerifiedAt'].includes(c.field)?'':null);(draft as unknown as Record<string,unknown>)[c.field]=v;}
 draft.completeness=Completeness.Value1;draft.entryType=EntryType.Value0;
 draft.applicableScope=input.base?copy(input.base.applicableScope):{colleges:[],majors:[],grades:[],degrees:[],campuses:[],applicableNote:''};draft.applicableScope.applicableNote=input.applicableNote.trim()||'参赛资格以经核对的原通知为准。';
 if(!draft.organizationId&&!draft.sourceOrg?.trim())throw Error('请确认来源发布单位 / 主办方，或在原赛事中维护有效组织');
 const payload=blankPayload(draft);applyInput(payload,draft);validate(payload,false);
 const stageConfirmations:ImportStageConfirmation[]=input.stages.map(s=>{if(!s.stage.trim())throw Error('阶段名称不能为空');const c=confirmRow(s);return {stage:s.stage.trim(),decision:c.decision,candidateId:c.candidateId,value:c.value,evidenceIds:c.evidenceIds,note:c.note,sourceUrl:s.sourceUrl.trim()||null};});
 const issueResolutions=input.result.issues.filter(i=>i.severity==='需确认').map(i=>{const note=input.issueNotes[i.issueId]?.trim();if(!note)throw Error('请说明问题处理：'+i.message);return {issueId:i.issueId,note};});
 if(input.result.issues.some(i=>i.severity==='阻断'))throw Error('材料含阻断问题，需更换材料或重新识别');
 if(input.result.duplicates.length&&!input.job.targetContestId&&!input.duplicateNote.trim())throw Error('请说明为什么仍新建赛事；也可从已有赛事重新建立补充任务');
 return {expectedJobEtag:input.job.etag,idempotencyKey:input.key,duplicateDecision:input.job.targetContestId?ImportDuplicateDecision.Value1:ImportDuplicateDecision.Value0,targetContestId:input.job.targetContestId,expectedPublishedEtag:input.expectedPublishedEtag,duplicateNote:input.duplicateNote.trim()||null,draft,confirmations,stageConfirmations,issueResolutions};
}
