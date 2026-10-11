from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
for base in ['admin-web/src/pages','student-app/entry/src/main/ets/pages']:
 for path in (root/base).rglob('*'):
  if path.suffix not in ['.vue','.ts','.ets']:continue
  text=path.read_text()
  if re.search(r'fetch\s*\(|axios|@kit.NetworkKit|MockRepository|HttpRepository|services/http',text):
   raise SystemExit('页面越过 Repository: '+str(path))
print('页面依赖边界通过')
