from pathlib import Path
import json,re,sys
r=Path(__file__).resolve().parents[1]
repos=json.loads((r/'shared/repositories.schema.json').read_text());groups=['AuthRepository','ContestRepository','PublicityRepository','FavoriteRepository','FeedbackRepository']
types=set();lines=[]
for group in groups:
 for method,args,result,endpoint in repos[group]:types.update(re.findall(r'\b[A-Z]\w*',args+' '+result))
lines=["/** Generated from repository schema by scripts/sync-http.py. */", "import { "+', '.join(sorted(types))+" } from './contracts';", "import { "+', '.join(groups)+" } from './Repositories';", "import { HttpTransport, queryPair, querySuffix } from './HttpProtocol';", "import { authorizationValue } from './SessionService';",'']
queryfields={'ContestFilter':['keyword','category','scopeType','entryType','contestStatus','year','month','monthMode','page','pageSize','sort'],'FeedbackFilter':['status','page','pageSize'],'PageQuery':['page','pageSize']}
for name,fields in queryfields.items():lines+=['function '+name[0].lower()+name[1:]+'Query(input: '+name+'): string { return querySuffix(['+', '.join("queryPair('"+f+"', input."+f+")" for f in fields)+']); }']
for group in groups:
 name='Http'+group;lines+=['export class '+name+' implements '+group+' {',' private transport: HttpTransport;']
 if group=='AuthRepository':lines+=[' private lastAuthorization: string | null = null;']
 lines+=[' constructor(transport: HttpTransport) { this.transport = transport; }']
 for method,args,result,endpoint in repos[group]:
  verb,route=endpoint.split(' ',1);params=re.findall(r'(\w+)\??:\s*(\w+)',args)
  route=route.replace(':vid',"' + encodeURIComponent(versionId) + '")
  identifier=next((key for key,typ in params if key in ['contestId','publicityId','feedbackId']),None)
  if ':id' in route:route=route.replace(':id',"' + encodeURIComponent("+identifier+") + '")
  path="'"+route+"'";body='null';lock='null';anonymous='true' if group=='AuthRepository' and method=='login' else 'false'
  for key,typ in params:
   if typ in queryfields:path+=' + '+typ[0].lower()+typ[1:]+'Query('+key+')'
   elif typ=='ChangeType':path+=" + querySuffix([queryPair('changeType', "+key+")])"
   elif typ=='ConcurrencyHeaders':lock=key+'.ifMatch'
   elif key=='input':body='JSON.stringify(input)'
  lines+=[' async '+method+'('+args+'): Promise<'+result+'> {']
  if group=='AuthRepository' and method=='login':lines+=['  const result: LoginResult = await this.transport.request<LoginResult>(\''+verb+'\', '+path+', '+body+', '+lock+', true);','  this.lastAuthorization = authorizationValue(result); return result;']
  elif group=='AuthRepository' and method=='logout':lines+=['  const authorization: string | null = this.lastAuthorization; this.lastAuthorization = null;','  if (authorization === null) return;','  await this.transport.requestVoid(\''+verb+'\', '+path+', null, null, false, authorization);']
  elif result=='void':lines+=['  await this.transport.requestVoid(\''+verb+'\', '+path+', '+body+', '+lock+', '+anonymous+');']
  else:lines+=['  return this.transport.request<'+result+'>(\''+verb+'\', '+path+', '+body+', '+lock+', '+anonymous+');']
  lines+=[' }']
 lines+=['}','']
content='\n'.join(lines)
target=r/'shared/HttpRepositories.ts'
if '--check' in sys.argv:
 if target.read_text()!=content:raise SystemExit('HttpRepository源不同步')
else:target.write_text(content)

for name in ['HttpProtocol','HttpRepositories']:
 text=(r/f'shared/{name}.ts').read_text()
 for folder,ext,model in [('admin-web/src/repository','ts','../models/contracts'),('student-app/entry/src/main/ets/repository','ets','../models/Contracts')]:
  output=text.replace('./contracts',model).replace('./SessionService','../services/SessionService')
  target=r/f'{folder}/{name}.{ext}'
  if '--check' in sys.argv:
   if not target.exists() or target.read_text()!=output:raise SystemExit('HTTP实现不同步: '+str(target))
  else:target.write_text(output)
print('两端37项HTTP Repository方法同步通过')

source=(r/'shared/FetchTransport.ts').read_text().replace("'./HttpProtocol'","'../repository/HttpProtocol'").replace("'./RepositoryError'","'../repository/RepositoryError'")
target=r/'admin-web/src/services/FetchTransport.ts'
if '--check' in sys.argv:
 if target.read_text()!=source:raise SystemExit('FetchTransport不同步')
else:target.write_text(source)
