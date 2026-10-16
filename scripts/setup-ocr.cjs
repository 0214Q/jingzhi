const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),backend=path.join(root,'backend');
const {defaultPython,runWorker}=require('../backend/src/LocalOcr.cjs');
function run(exe,args){return new Promise((resolve,reject)=>{const child=spawn(exe,args,{cwd:root,stdio:'inherit',shell:false,windowsHide:true});child.once('error',reject);child.once('exit',c=>c===0?resolve():reject(Error('安装命令执行失败，请查看上方输出；修复网络或Python后重新运行。')));});}
function pythonCommand(){
 const candidates=process.env.JINGZHI_PYTHON?[[process.env.JINGZHI_PYTHON]]:process.platform==='win32'?[['py','-3.12'],['py','-3.11'],['py','-3.10'],['python']]:[['python3.12'],['python3.11'],['python3.10'],['python3'],['python']];
 for(const [exe,...args] of candidates){const probe=spawnSync(exe,[...args,'-c','import sys; sys.exit(0 if (3,10)<=sys.version_info[:2]<=(3,12) and sys.maxsize>2**32 else 1)'],{stdio:'ignore',windowsHide:true,timeout:10000});if(probe.status===0)return {exe,args};}
 throw Error('请先安装64位 Python 3.12（或3.10/3.11），安装时勾选 Add python.exe to PATH，然后重新打开PowerShell。也可用 JINGZHI_PYTHON 指定 python.exe 完整路径。');
}
(async()=>{
 console.log('准备本地OCR：首次安装需联网下载依赖和随包模型，识别时不联网。');
 if(!fs.existsSync(defaultPython)){const {exe,args}=pythonCommand();await run(exe,[...args,'-m','venv',path.join(backend,'.venv-ocr')]);}
 await run(defaultPython,['-m','pip','install','--disable-pip-version-check','-r',path.join(backend,'ocr/requirements.txt')]);
 console.log('检查模型和CPU推理（禁止运行时网络访问）...');await runWorker({python:defaultPython,check:true,timeoutMs:120000});
 const envPath=path.join(backend,'.env');let env=fs.existsSync(envPath)?fs.readFileSync(envPath,'utf8'):'';
 if(fs.existsSync(envPath))fs.copyFileSync(envPath,envPath+'.before-local-ocr-'+Date.now()+'.bak');
 const updates={IMPORT_OCR_MODE:'local-ocr',IMPORT_OCR_ALLOW_EXTERNAL:'false',IMPORT_OCR_MAX_PAGES:'10',IMPORT_OCR_TIMEOUT_MS:'300000'};
 // Use the project's own venv after installation; don't retain an obsolete machine-specific path.
 env=env.replace(/^\s*(?:export\s+)?IMPORT_OCR_PYTHON\s*=.*(?:\r?\n|$)/gm,'');
 for(const [key,value] of Object.entries(updates)){
  const re=new RegExp('^\\s*(?:export\\s+)?'+key+'\\s*=.*$','gm');
  if(re.test(env))env=env.replace(re,key+'='+value);else env+=(env&&!env.endsWith('\n')?'\n':'')+key+'='+value+'\n';
 }
 fs.writeFileSync(envPath,env);
 console.log('本地OCR安装并启用成功。请重新运行 npm run dev，再上传扫描PDF或图片验证。');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
