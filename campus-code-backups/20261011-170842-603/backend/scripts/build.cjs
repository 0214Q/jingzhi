const fs=require('node:fs'),path=require('node:path');
const ts=require('../../admin-web/node_modules/typescript');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'backend/build');fs.mkdirSync(dir,{recursive:true});
const renames={MockStore:'DomainStore',MockContext:'RequestContext',MockRules:'DomainRules',MockSeeds:'DemoSeeds',MockContestRepository:'ContestService',MockPublicityRepository:'PublicityService',MockInteractionRepository:'InteractionRepository',MockFavoriteRepository:'FavoriteService',MockFeedbackRepository:'FeedbackService'};
for(const name of ['contracts','Repositories','RepositoryError','MockRules','MockSeeds','MockContestRepository','MockPublicityRepository','MockInteractionRepository']){
 let source=fs.readFileSync(path.join(root,'shared',name+'.ts'),'utf8');
 for(const [a,b] of Object.entries(renames))source=source.replace(new RegExp('\\b'+a+'\\b','g'),b);
 if(name==='MockContestRepository'){source="import { validatePublication } from './CatalogRules';\n"+source;source=source.replaceAll('validate(v.payload, true);','validatePublication(this.store, v);');}
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
 if(result.diagnostics.some(d=>d.category===ts.DiagnosticCategory.Error))throw Error('Transpile failed: '+name);
 fs.writeFileSync(path.join(dir,(renames[name]||name)+'.js'),result.outputText);
}
fs.copyFileSync(path.join(root,'backend/src/DomainStore.cjs'),path.join(dir,'DomainStore.js'));
console.log('Domain build complete (business rules derived from shared sources).');

fs.copyFileSync(path.join(root,'backend/src/CatalogRules.cjs'),path.join(dir,'CatalogRules.js'));
