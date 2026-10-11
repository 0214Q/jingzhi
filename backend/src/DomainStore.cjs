const {randomUUID}=require('node:crypto');
class DomainStore {
 constructor(){this.catalogImports=[];this.catalogPublications=[];this.unselectedDraftFields={};for(const key of ['favorites','feedback','contests','versions','logs','publicity','reviews','organizations','users','withdrawnTypes','publicityActions'])this[key]=[];}
 id(prefix){return prefix+'-'+randomUUID();}
 now(){return new Date().toISOString();}
}
class RequestContext {constructor(){this.user=null;this.expiresAt=0;}}
function copy(value){return JSON.parse(JSON.stringify(value));}
module.exports={DomainStore,RequestContext,copy};
