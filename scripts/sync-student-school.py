from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
for name in ['StudentSchoolRepository','HttpStudentSchoolRepository']:
    source=(root/'shared'/f'{name}.ts').read_text()
    for folder,ext,model in [('admin-web/src/repository','.ts','../models/contracts'),('student-app/entry/src/main/ets/repository','.ets','../models/Contracts')]:
        output=source.replace("'./contracts'",repr(model))
        target=root/folder/(name+ext)
        if '--check' in sys.argv:
            if not target.exists() or target.read_text()!=output: raise SystemExit('学生高校接口不同步: '+str(target))
        else: target.write_text(output)
print('学生高校Repository及HTTP实现已同步到两端')

for name,folder in [('StudentSchoolService','services'),('SchoolScopedTransport','repository')]:
    source=(root/'shared'/f'{name}.ts').read_text()
    for base,ext,model in [('admin-web/src','.ts','../models/contracts'),('student-app/entry/src/main/ets','.ets','../models/Contracts')]:
        output=source.replace("'./contracts'",repr(model))
        if folder=='services':
            output=output.replace("'./StudentSchoolRepository'","'../repository/StudentSchoolRepository'").replace("'./RepositoryError'","'../repository/RepositoryError'")
        else: output=output.replace("'./StudentSchoolService'","'../services/StudentSchoolService'")
        target=root/base/folder/(name+ext)
        if '--check' in sys.argv:
            if not target.exists() or target.read_text()!=output: raise SystemExit('高校范围服务不同步: '+str(target))
        else: target.write_text(output)
print('高校上下文与过时响应保护已同步到两端')
