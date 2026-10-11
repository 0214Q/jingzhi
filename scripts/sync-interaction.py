from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
text=(root/'shared/InteractionService.ts').read_text()
for folder,ext,model in [('admin-web/src/services','ts','../models/contracts'),('student-app/entry/src/main/ets/services','ets','../models/Contracts')]:
 target=root/f'{folder}/InteractionService.{ext}'
 output=text.replace('./contracts',model).replace('./Repositories','../repository/Repositories')
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=output:raise SystemExit('互动服务不同步')
 else:target.write_text(output)
print('互动服务同步通过')
