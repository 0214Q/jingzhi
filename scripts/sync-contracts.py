from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
s=json.loads((root/'shared/contracts.schema.json').read_text())
lines=['/** 自动生成。仅编辑 shared/contracts.schema.json，然后运行同步脚本。 */']
for name,values in s['enums'].items():
 lines.append('export enum '+name+' {')
 for i,value in enumerate(values): lines.append('  Value'+str(i)+' = '+json.dumps(value,ensure_ascii=False)+',')
 lines.append('}\n')
for name,fields in s['models'].items():
 base=s.get('extends',{}).get(name)
 lines.append('export interface '+name+(' extends '+base if base else '')+' {')
 for key,value in fields.items(): lines.append('  '+key+': '+value+';')
 lines.append('}\n')
lines.extend(['export interface ApiResponse<T> {','  code: number;','  message?: string;','  data?: T | null;','  traceId?: string;','}'])
content='\n'.join(lines)+'\n'
paths=['shared/contracts.ts','admin-web/src/models/contracts.ts','student-app/entry/src/main/ets/models/Contracts.ets']
for path in paths:
 target=root/path
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=content: raise SystemExit('契约不同步: '+path)
 else: target.write_text(content)
print('两端契约一致：'+str(len(s['models']))+' DTO，'+str(len(s['enums']))+' 枚举')
