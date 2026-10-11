from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
text=(root/'shared/ContestDetailService.ts').read_text()
for path,models,repo,error in [('admin-web/src/services/ContestDetailService.ts','../models/contracts','../repository/Repositories','../repository/RepositoryError'),('student-app/entry/src/main/ets/services/ContestDetailService.ets','../models/Contracts','../repository/Repositories','../repository/RepositoryError')]:
 output=text.replace('./contracts',models).replace('./Repositories',repo).replace('./RepositoryError',error)
 target=root/path
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=output:raise SystemExit('详情逻辑不同步: '+path)
 else:target.write_text(output)
print('详情服务同步通过')
