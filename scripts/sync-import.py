from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
for name in ['ImportRepository','ImportDraftRules','HttpImportRepository']:
 text=(root/'shared'/(name+'.ts')).read_text()
 for folder,ext,model in [('admin-web/src/repository','ts','../models/contracts'),('student-app/entry/src/main/ets/repository','ets','../models/Contracts')]:
  target=root/folder/(name+'.'+ext)
  output=text.replace("'./contracts'",repr(model))
  if '--check' in sys.argv:
   if not target.exists() or target.read_text()!=output:raise SystemExit('导入契约未同步: '+str(target))
  else:target.write_text(output)
print('文件导入接口与规则已同步到两端')
