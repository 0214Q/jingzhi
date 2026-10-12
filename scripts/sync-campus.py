from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
for name in ['CampusRepository','CampusPermissions']:
 source=(root/'shared'/f'{name}.ts').read_text()
 for base,ext,model in [('admin-web/src/repository','.ts','../models/contracts'),('student-app/entry/src/main/ets/repository','.ets','../models/Contracts')]:
  content=source.replace("'./contracts'",repr(model))
  target=root/base/(name+ext)
  if '--check' in sys.argv:
   if not target.exists() or target.read_text()!=content:raise SystemExit('不同步: '+str(target))
  else:target.write_text(content)
print('高校管理接口与权限参考实现已同步到两端')
