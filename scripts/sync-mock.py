from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
files=['MockStore','MockSeeds','MockRules','MockAuthRepository','MockContestRepository','MockPublicityRepository','MockRuntime','MockInteractionRepository']
for name in files:
 text=(root/('shared/'+name+'.ts')).read_text()
 for base,extension in [('admin-web/src/repository','.ts'),('student-app/entry/src/main/ets/repository','.ets')]:
  target=root/(base+'/'+name+extension)
  output=text.replace('./contracts','../models/Contracts' if extension=='.ets' else '../models/contracts')
  if '--check' in sys.argv:
   if not target.exists() or target.read_text()!=output:raise SystemExit('Mock 不同步: '+str(target))
  else:target.write_text(output)
print('两端 Mock 源码同步通过')
