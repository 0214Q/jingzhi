const {createHash}=require('node:crypto');
const {validate}=require('../build/DomainRules');
const {RepositoryError}=require('../build/RepositoryError');
function payloadHash(payload){return createHash('sha256').update(JSON.stringify(payload)).digest('hex');}
function validatePublication(store,version){
 const record=store.catalogPublications.find(x=>x.version_id===version.versionId);
 if(!record){validate(version.payload,true);return;}
 if(record.payload_hash!==payloadHash(version.payload))throw new RepositoryError(409,'目录版本内容已改变，需要重新提交');
 const contest=store.contests.find(c=>c.contestId===version.contestId);
 if(!contest||contest.schoolId!==record.school_id)throw new RepositoryError(403,'目录归属不一致');
 const p=version.payload;validate(p,false);
 const errors={};if(!p.name.trim())errors.name='必填';if(p.entryType!=='团队整理'||p.scopeType!=='面向河大学生的校外赛事'||!['国赛','省赛'].includes(p.level))errors.level='目录归属与层级不正确';if(!p.sourceTitle?.trim())errors.sourceTitle='保留目录来源标题';if(!p.description?.includes('【赛事目录条目】'))errors.description='请保留目录条目标记和原始来源说明';if(!p.organizationId||!p.entryMethod.trim()||!p.collectedAt.includes('T'))errors.entryMethod='组织、报名方式及采集时刻必填';
 if(p.creditApplicable==='待确认'&&!p.creditNote?.trim())errors.creditNote='待确认须说明';if(p.creditApplicable==='是'&&!p.creditBasis?.trim())errors.creditBasis='第二课堂适用必须有认定依据';
 const dated=[p.regStart,p.regEnd,p.contestStart,p.contestEnd,p.publicityTime].some(Boolean);
 if(dated&&(!p.sourceUrl||!p.sourceOrg?.trim()||!p.lastVerifiedAt))errors.sourceUrl='补充当年日期后，须填写原通知链接、来源单位和核对日期';
 if(Object.keys(errors).length)throw new RepositoryError(422,'目录提交资料不完整',{fieldErrors:errors});
}
module.exports={payloadHash,validatePublication};
