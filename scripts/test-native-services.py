"""Tests the generated .ets service/repository copies as TypeScript, NOT a DevEco build."""
from pathlib import Path
import tempfile,shutil,subprocess,json,re
root=Path(__file__).resolve().parents[1]
base=root/'student-app/entry/src/main/ets'
with tempfile.TemporaryDirectory() as temporary:
 work=Path(temporary)/'source';out=Path(temporary)/'out'
 for folder in ['models','repository','services']:
  target=work/'native'/folder;target.mkdir(parents=True,exist_ok=True)
  for path in (base/folder).glob('*.ets'):
   if path.name in ['Navigation.ets','ArkHttpTransport.ets']:continue
   (target/(path.stem+'.ts')).write_text(path.read_text())
 def rewrite(match):
  name=match.group(1)
  if name in ['contracts','models/contracts']:return "'../native/models/Contracts'"
  if name=='services/repositories':return "'../native/services/Repositories'"
  if name.startswith('services/'):return "'../native/"+name+"'"
  if name.startswith('repository/'):return "'../native/"+name+"'"
  folder='services' if name.endswith('Service') else 'repository'
  return "'../native/"+folder+'/'+name+"'"
 (work/'tests').mkdir()
 for path in (root/'tests').glob('*.test.ts'):
  text=path.read_text()
  text=re.sub(r"'\.\./shared/([^']+)'",rewrite,text)
  text=re.sub(r"'\.\./admin-web/src/([^']+)'",rewrite,text)
  (work/'tests'/path.name).write_text(text)
 out.mkdir();(out/'package.json').write_text(json.dumps({'type':'commonjs'}))
 subprocess.run(['node',str(root/'admin-web/node_modules/typescript/bin/tsc'),'--outDir',str(out),'--rootDir',str(work),'--module','commonjs','--target','ES2022','--strict','--esModuleInterop','--skipLibCheck','--typeRoots',str(root/'admin-web/node_modules/@types'),*[str(p) for p in work.rglob('*.ts')]],check=True)
 subprocess.run(['node','--test',*[str(p) for p in (out/'tests').glob('*.test.js')]],check=True)
print('Generated native services TypeScript regression passed; DevEco/ArkTS compilation still required.')
