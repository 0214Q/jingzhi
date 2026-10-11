from pathlib import Path
import subprocess,tempfile,json
root=Path(__file__).resolve().parents[1]
tsc=root/'admin-web/node_modules/typescript/bin/tsc'
with tempfile.TemporaryDirectory() as temp:
 out=Path(temp)
 (out/'package.json').write_text(json.dumps({'type':'commonjs'}))
 subprocess.run(['node',str(tsc),'--outDir',temp,'--rootDir',str(root),'--module','commonjs','--target','ES2022','--strict','--esModuleInterop','--skipLibCheck','--typeRoots',str(root/'admin-web/node_modules/@types'),*[str(p) for p in (root/'tests').glob('*.test.ts')],str(root/'shared/repository-check.ts')],check=True)
 subprocess.run(['node','--test',*[str(p) for p in (out/'tests').glob('*.test.js')]],check=True)
