from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
text=(root/'shared/RepositoryError.ts').read_text()
for folder,ext,model in [('admin-web/src/repository','ts','../models/contracts'),('student-app/entry/src/main/ets/repository','ets','../models/Contracts')]:
 target=root/f'{folder}/RepositoryError.{ext}'
 output=text.replace('./contracts',model)
 if '--check' in sys.argv:
  if not target.exists() or target.read_text()!=output:raise SystemExit('RepositoryError不同步')
 else:target.write_text(output)
print('RepositoryError同步通过')
