from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
text=(root/'shared/ContestListService.ts').read_text()
for path,models,repo in [('admin-web/src/services/ContestListService.ts','../models/contracts','../repository/Repositories'),('student-app/entry/src/main/ets/services/ContestListService.ets','../models/Contracts','../repository/Repositories')]:
 output=text.replace('./contracts',models).replace('./Repositories',repo)
 target=root/path
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=output:raise SystemExit('列表逻辑不同步: '+path)
 else:target.write_text(output)
print('列表服务同步通过')
