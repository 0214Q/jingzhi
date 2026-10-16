const fs=require('node:fs'),fsp=fs.promises,path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const {runInspector}=require('./ImportInspector.cjs');
const backend=path.resolve(__dirname,'..');
const defaultPython=path.join(backend,'.venv-ocr',process.platform==='win32'?'Scripts/python.exe':'bin/python');
function unavailable(message){return Object.assign(Error(message),{failureCode:'识别服务不可用'});}
function runWorker({python=defaultPython,images=[],check=false,signal,timeoutMs=300000,worker=path.join(backend,'ocr/worker.py')}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(Error('任务已取消'));
  const child=spawn(python,['-u',worker,...(check?['--check']:[])],{cwd:backend,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONUTF8:'1',OMP_NUM_THREADS:'2'}});
  let output=[],size=0,failure;const stop=e=>{failure=e;child.kill('SIGKILL');};
  const abort=()=>stop(Error('任务已取消'));signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>stop(unavailable('本地OCR超时，请拆分材料后重试')),timeoutMs);
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
  child.stdout.on('data',chunk=>{size+=chunk.length;if(size>2*1024*1024)stop(unavailable('本地OCR输出过大，请拆分材料'));else output.push(chunk);});
  child.stderr.on('data',chunk=>{if(check)process.stderr.write(chunk);});child.stdin.on('error',()=>{});
  child.once('error',()=>{cleanup();reject(unavailable('本地OCR未安装或Python路径无效，请在工程根目录运行 npm run ocr:setup'));});
  child.once('close',code=>{cleanup();if(failure)return reject(failure);let data;try{data=JSON.parse(Buffer.concat(output).toString('utf8'));}catch{return reject(unavailable('本地OCR启动失败，请运行 npm run ocr:check 检查环境'));}
   if(code!==0||!data.ok)return reject(unavailable(data.message||'本地OCR运行失败，请重新安装识别环境'));
   if(!check&&(!Array.isArray(data.texts)||data.texts.length!==images.length||data.texts.some(t=>typeof t!=='string'||t.length>30000)))return reject(unavailable('本地OCR结果格式无效'));
   resolve(data);
  });
  child.stdin.end(JSON.stringify({images}));
 });
}
async function recognizeLocalPages(targets,{config,signal}){
 const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'jingzhi-ocr-'));await fsp.chmod(dir,0o700);const images=[];
 try{
  for(let i=0;i<targets.length;i++){
   if(signal?.aborted)throw Error('任务已取消');
   const {file,pageNumber}=targets[i];const image=await runInspector({path:file.path,action:'render',pageNumber},{signal});
   const bytes=Buffer.from(image.imageBase64,'base64');if(bytes.length>12*1024*1024)throw unavailable('识别图片过大');
   const filename=path.join(dir,i+'.png');await fsp.writeFile(filename,bytes,{mode:0o600});images.push(filename);
  }
  return (await runWorker({python:config.python,images,signal,timeoutMs:config.timeoutMs})).texts;
 }finally{await fsp.rm(dir,{recursive:true,force:true});}
}
module.exports={runWorker,recognizeLocalPages,defaultPython};
