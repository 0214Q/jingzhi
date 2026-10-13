const {createHash}=require('node:crypto');
const {admin,missing}=require('../build/DomainRules'),{RepositoryError}=require('../build/RepositoryError');
const {payloadHash}=require('./CatalogRules.cjs');
class CatalogService {
 constructor(store,context,contests){this.store=store;this.context=context;this.contests=contests;}
 ids(){const user=admin(this.context);return this.store.catalogImports.filter(x=>x.school_id===user.schoolId).map(x=>x.contest_id);}
 assert(id){if(!this.ids().includes(id))throw new RepositoryError(403,'无权访问该学校的目录记录');}
 async list(filter){const ids=this.ids();let rows=[];for(const id of ids){const item=await this.contests.getManaged(id),v=item.workingVersion||item.publishedVersion;if(!v)continue;if(filter.keyword&&!v.payload.name.toLowerCase().includes(filter.keyword.toLowerCase()))continue;if(filter.level&&v.payload.level!==filter.level)continue;if(filter.state&&v.status!==filter.state)continue;const org=this.store.organizations.find(o=>o.id===v.payload.organizationId);rows.push({...item,organizationName:org?.name||'主办方待补充'});}const page=filter.page||1,pageSize=filter.pageSize||20;return {list:rows.slice((page-1)*pageSize,page*pageSize),total:rows.length,page,pageSize};}
 async get(id){this.assert(id);const item=await this.contests.getManaged(id),v=item.workingVersion||item.publishedVersion;return {...item,sourceRows:JSON.parse(this.store.catalogImports.find(x=>x.contest_id===id).source_rows),organizationName:this.store.organizations.find(o=>o.id===v?.payload.organizationId)?.name||'主办方待补充'};}
 async derive(id,input,lock){this.assert(id);return this.contests.deriveVersion(id,input,lock);}
 async save(id,vid,input,lock){this.assert(id);const user=admin(this.context),name=input.organizerName.trim();if(!name||name.length>300)throw new RepositoryError(422,'主办方必填且最多300字',{fieldErrors:{organizerName:'必填，最多300字'}});const orgId='catalog-edit-org-'+createHash('sha256').update(user.schoolId+'\n'+name).digest('hex').slice(0,24);if(!this.store.organizations.some(o=>o.id===orgId))this.store.organizations.push({id:orgId,schoolId:user.schoolId,name,type:'目录主办方信息',contact:null,intro:'来自目录整理，非主办方身份认证',owners:[]});return this.contests.updateDraft(id,vid,{...input.draft,organizationId:orgId},lock);}
 async submit(id,input){this.assert(id);const v=await this.contests.getVersion(id,input.versionId);if(v.etag!==input.etag)throw new RepositoryError(409,'目录已更新，请重新加载',{currentEtag:v.etag});if(!['草稿','驳回'].includes(v.status))throw new RepositoryError(409,'仅草稿或驳回版本可提交');
 const source=this.store.catalogImports.find(x=>x.contest_id===id);const user=admin(this.context);const live=this.store.versions.find(x=>x.versionId===v.versionId&&x.contestId===id);live.payload.completeness=missing(live.payload).length?'待补充':'完整';
 const record={version_id:v.versionId,school_id:user.schoolId,import_key:source.import_key,payload_hash:payloadHash(live.payload),authorized_at:new Date().toISOString(),authorized_by:user.id};
 this.store.catalogPublications=this.store.catalogPublications.filter(x=>x.version_id!==v.versionId);this.store.catalogPublications.push(record);
 return this.contests.submitReview(id,v.versionId,{ifMatch:input.etag});}
}
module.exports={CatalogService};
