from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
text=(root/'shared/SessionService.ts').read_text()
for file,model in [('admin-web/src/services/SessionService.ts','../models/contracts'),('student-app/entry/src/main/ets/services/SessionService.ets','../models/Contracts')]:
 output=text.replace('./contracts',model).replace('./Repositories','../repository/Repositories').replace('./RepositoryError','../repository/RepositoryError')
 target=root/file
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=output:raise SystemExit('登录逻辑不同步: '+file)
 else:target.write_text(output)
print('登录服务同步通过')
