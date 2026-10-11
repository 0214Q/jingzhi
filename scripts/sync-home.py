from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
text=(root/'shared/HomeService.ts').read_text()
for file,models,repo in [('admin-web/src/services/HomeService.ts','../models/contracts','../repository/Repositories'),('student-app/entry/src/main/ets/services/HomeService.ets','../models/Contracts','../repository/Repositories')]:
 output=text.replace('./contracts',models).replace('./Repositories',repo)
 target=root/file
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=output:raise SystemExit('首页逻辑不同步: '+file)
 else:target.write_text(output)
print('首页服务同步通过')
