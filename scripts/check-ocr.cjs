const path=require('node:path');
const {runWorker}=require('../backend/src/LocalOcr.cjs');
(async()=>{
 try{process.loadEnvFile(path.resolve(__dirname,'../backend/.env'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const result=await runWorker({python:process.env.IMPORT_OCR_PYTHON||undefined,check:true,timeoutMs:120000});
 console.log('OCR检查通过：'+result.engine+'；本地模型和CPU推理正常，运行时网络访问已禁用。');
 console.log('后端配置模式：'+(process.env.IMPORT_OCR_MODE||'local')+'。'+(process.env.IMPORT_OCR_MODE==='local-ocr'?'请重启正在运行的后端以加载配置。':'请运行 npm run ocr:setup 启用本地OCR。'));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
