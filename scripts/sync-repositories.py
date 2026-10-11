from pathlib import Path
import re,json,sys
root=Path(__file__).resolve().parents[1]
repos=json.loads((root/'shared/repositories.schema.json').read_text())
types=set()
for methods in repos.values():
 for _,args,result,_ in methods:
  types.update(re.findall(r'\b[A-Z]\w*',args+' '+result))
lines=['/** 自动生成：只修改 shared/repositories.schema.json。 */',"import { "+', '.join(sorted(types))+" } from '../models/contracts';",'']
for name,methods in repos.items():
 lines.append('export interface '+name+' {')
 for method,args,result,path in methods:
  lines.extend(['  /** '+path+' */','  '+method+'('+args+'): Promise<'+result+'>;'])
 lines.extend(['}',''])
content='\n'.join(lines)
for path in ['shared/Repositories.ts','admin-web/src/repository/Repositories.ts','student-app/entry/src/main/ets/repository/Repositories.ets']:
 target=root/path
 rendered=content.replace('../models/contracts','./contracts') if path.startswith('shared/') else content.replace('../models/contracts','../models/Contracts') if path.endswith('.ets') else content
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=rendered:raise SystemExit('不同步: '+path)
 else:target.write_text(rendered)
print('Repository 接口同步：'+str(len(repos))+' 组，'+str(sum(len(x) for x in repos.values()))+' 方法')
