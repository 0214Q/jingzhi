// Checks the specific syntax families from the reported build log. This is not an ArkTS compiler.
const ts=require('../admin-web/node_modules/typescript');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const base=path.join(root,'student-app/entry/src/main/ets');
const failures=[];let files=0;
for(const folder of ['repository','services','models']){
 for(const file of fs.readdirSync(path.join(base,folder)).filter(x=>x.endsWith('.ets'))){
  const filename=path.join(base,folder,file),text=fs.readFileSync(filename,'utf8');
  const source=ts.createSourceFile(filename,text,ts.ScriptTarget.Latest,true);files++;
  const fail=(node,rule)=>failures.push(`${folder}/${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line+1} ${rule}`);
  function visit(node){
   if(ts.isConstructorDeclaration(node))for(const p of node.parameters)if((p.modifiers||[]).some(m=>[ts.SyntaxKind.PrivateKeyword,ts.SyntaxKind.PublicKeyword,ts.SyntaxKind.ProtectedKeyword,ts.SyntaxKind.ReadonlyKeyword].includes(m.kind)))fail(p,'arkts-no-ctor-prop-decls');
   if(ts.isTypeLiteralNode(node))fail(node,'arkts-no-obj-literals-as-types');
   if(ts.isSpreadAssignment(node))fail(node,'arkts-no-spread');
   if(ts.isCallExpression(node)&&node.expression.getText(source)==='copy'&&node.arguments.some(ts.isObjectLiteralExpression))fail(node,'anonymous literal in copy(): use a typed DTO local');
   if(ts.isThrowStatement(node)&&ts.isIdentifier(node.expression))fail(node,'untyped rethrow: narrow and explicitly type the Error');
   ts.forEachChild(node,visit);
  }
  visit(source);
 }
}
const schema=JSON.parse(fs.readFileSync(path.join(root,'shared/contracts.schema.json'),'utf8'));
for(const [child,parent] of [['ContestFilter','PageQuery'],['FeedbackFilter','PageQuery'],['UpdateDraftRequest','CreateDraftRequest']])if(schema.extends?.[child]!==parent)failures.push(`${child} must explicitly extend ${parent} for nominal typing`);
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Known-rule source preflight passed for ${files} non-UI native files. DevEco/ArkTS build is still required.`);
