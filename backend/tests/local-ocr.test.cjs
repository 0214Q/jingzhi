const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {runWorker,defaultPython}=require('../src/LocalOcr.cjs');
const {recognitionConfig,extractPages,buildRecognition}=require('../src/ImportRecognizer.cjs');
const {runInspector}=require('../src/ImportInspector.cjs');
const python=process.env.JINGZHI_TEST_OCR_PYTHON||defaultPython;
const installed=fs.existsSync(python),fixture=name=>path.join(__dirname,'fixtures',name);
test('本地OCR配置不要求外部密钥，拒绝无效超时和页数',()=>{
 const c=recognitionConfig({IMPORT_OCR_MODE:'local-ocr'});a.equal(c.mode,'local-ocr');a.equal(c.timeoutMs,300000);
 a.throws(()=>recognitionConfig({IMPORT_OCR_MODE:'local-ocr',IMPORT_OCR_TIMEOUT_MS:'NaN'}));
 a.throws(()=>recognitionConfig({IMPORT_OCR_MODE:'local-ocr',IMPORT_OCR_MAX_PAGES:'31'}));
});
test('没有Python环境时提示安装，不静默回退云端',async()=>{
 await a.rejects(runWorker({python:path.join(os.tmpdir(),'missing-jingzhi-python'),check:true}),e=>e.failureCode==='识别服务不可用'&&/ocr:setup/.test(e.message));
});
test('页数超限在启动OCR前拒绝；文字层不需要安装Python',async()=>{
 const config={mode:'local-ocr',maxPages:1,python:'does-not-exist'};
 await a.rejects(extractPages([{fileId:'F',pages:['','']}],{config}),/页数/);
 const pages=await extractPages([{fileId:'F',pages:['文字版通知大赛：无需安装识别引擎']}],{config});a.equal(pages[0].ocr,false);
});
test('OCR子进程超时、取消及错误协议均被回收',{skip:!installed},async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ocr-process-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const hung=path.join(dir,'hung.py');fs.writeFileSync(hung,"import time; time.sleep(60)");
 await a.rejects(runWorker({python,worker:hung,timeoutMs:100}),/超时/);
 const c=new AbortController(),pending=runWorker({python,worker:hung,signal:c.signal});setTimeout(()=>c.abort(),100);await a.rejects(pending,/取消/);
 const bad=path.join(dir,'bad.py');fs.writeFileSync(bad,"print('bad-json')");await a.rejects(runWorker({python,worker:bad}),/ocr:check/);
});
test('真实CPU离线识别中文PNG、扫描PDF及混合PDF，证据保留文件和原页码',{skip:!installed},async()=>{
 const config=recognitionConfig({IMPORT_OCR_MODE:'local-ocr',IMPORT_OCR_PYTHON:python});
 const filenames=['ocr-title.png','ocr-scan.pdf','ocr-mixed.pdf'];
 const files=[];for(let i=0;i<filenames.length;i++){const p=fixture(filenames[i]);files.push({fileId:'F'+i,path:p,...await runInspector({path:p})});}
 let external=0;const pages=await extractPages(files,{config,fetchImpl:()=>{external++;throw Error('External OCR forbidden');}});
 a.equal(external,0);a.equal(pages.length,4);a.equal(pages[2].ocr,false);a.match(pages[2].text,/Text page retained/);
 for(const i of [0,1,3]){a.equal(pages[i].ocr,true);a.match(pages[i].text,/中国高校计算机大赛/);}
 a.equal(pages[3].pageNumber,2);const result=buildRecognition({jobId:'J',schoolId:'HENU',etag:'E'},pages);
 a.ok(result.candidates.some(c=>c.field==='name'));const mixed=buildRecognition({jobId:'J',schoolId:'HENU',etag:'E'},pages.filter(p=>p.fileId==='F2'));a.ok(mixed.evidence.some(e=>e.fileId==='F2'&&e.pageNumber===2&&e.textOrigin.includes('OCR')));
});
test('纯空白图片返回无可识别文本，不生成赛事',{skip:!installed},async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ocr-blank-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const p=path.join(dir,'blank.png');
 await require('sharp')({create:{width:500,height:300,channels:3,background:'white'}}).png().toFile(p);
 await a.rejects(extractPages([{fileId:'F',pages:[''],path:p}],{config:{mode:'local-ocr',maxPages:10,python}}),e=>e.failureCode==='无可识别文本');
});
