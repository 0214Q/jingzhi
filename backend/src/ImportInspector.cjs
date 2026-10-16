const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const DOCX='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
function error(message){throw Error(message);}
function xmlText(s){if(/<!DOCTYPE|<!ENTITY/i.test(s))error('材料不安全');return s.replace(/<w:(?:br|lastRenderedPageBreak)\b[^>]*\/?\s*>/g,'\n').replace(/<\/w:p\s*>/g,'\n').replace(/<w:tab\b[^>]*\/>/g,'\t').replace(/<[^>]*>/g,'').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return v<=0x10ffff?String.fromCodePoint(v):'';}).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');}
async function docx(buffer){
 const yauzl=require('yauzl');let xml=null,contentType=null;
 await new Promise((resolve,reject)=>yauzl.fromBuffer(buffer,{lazyEntries:true,validateEntrySizes:true,strictFileNames:true},(err,zip)=>{
  if(err)return reject(Error('文件损坏' ));let count=0,total=0;const seen=new Set();const bad=e=>{zip.close();reject(e);};zip.on('error',bad);zip.on('end',resolve);
  zip.on('entry',entry=>{try{
   if(++count>1000||entry.generalPurposeBitFlag&1||seen.has(entry.fileName)||/vbaProject|embeddings\/|activeX\/|\.exe$/i.test(entry.fileName))error('材料不安全');seen.add(entry.fileName);total+=entry.uncompressedSize;
   if(total>64*1024*1024||entry.uncompressedSize>8*1024*1024||entry.uncompressedSize>Math.max(1024*1024,entry.compressedSize*200))error('材料不安全');
   if(!['word/document.xml','[Content_Types].xml'].includes(entry.fileName)){zip.readEntry();return;}
   zip.openReadStream(entry,(e,stream)=>{if(e)return bad(e);let size=0,chunks=[];stream.on('error',bad);stream.on('data',chunk=>{size+=chunk.length;if(size>8*1024*1024){stream.destroy();bad(Error('材料不安全'));}else chunks.push(chunk);});stream.on('end',()=>{if(entry.fileName==='word/document.xml')xml=Buffer.concat(chunks).toString('utf8');else contentType=Buffer.concat(chunks).toString('utf8');zip.readEntry();});});
  }catch(e){bad(e);}});zip.readEntry();}));
 if(!xml||!contentType||!/wordprocessingml.document.main\+xml/.test(contentType)||/macroEnabled/i.test(contentType))error('格式不支持');
 const text=xmlText(xml);if(text.length>300000)error('材料不安全');const pages=[];for(let i=0;i<text.length;i+=3000)pages.push(text.slice(i,i+3000));return {pages:pages.length?pages:[''],pageLabel:'DOCX规范化文本页（每3000字符，并非Word打印页码）',mime:DOCX};
}
async function pdf(buffer,renderPage){
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const pdfRoot=path.dirname(require.resolve('pdfjs-dist/package.json')).split(path.sep).join('/');
const task=getDocument({
  cMapUrl:pdfRoot+'/cmaps/',
  cMapPacked:true,
  standardFontDataUrl:pdfRoot+'/standard_fonts/',
  wasmUrl:pdfRoot+'/wasm/',
  data:new Uint8Array(buffer),
  isEvalSupported:false,
  disableFontFace:true,
  useSystemFonts:false,
  useWorkerFetch:false,
  stopAtErrors:true,
  verbosity:0
});
 let doc;try{doc=await task.promise;if(doc.numPages>100)error('材料页数超限');if(await doc.getJSActions()||await doc.getAttachments())error('材料不安全');
  if(renderPage){if(renderPage<1||renderPage>doc.numPages)error('页码无效');const page=await doc.getPage(renderPage),v=page.getViewport({scale:1}),scale=Math.min(2,Math.sqrt(2000000/(v.width*v.height)));const viewport=page.getViewport({scale});const {createCanvas}=require('@napi-rs/canvas');const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;return {imageBase64:canvas.toBuffer('image/png').toString('base64'),mime:'image/png'};}
  const pages=[];let total=0;for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);const text=await p.getTextContent();const value=text.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('');total+=value.length;if(total>300000)error('材料文本过长');pages.push(value);p.cleanup();}return {pages,pageLabel:'PDF原页码',mime:'application/pdf'};
 }catch(e){if(e.name==='PasswordException')error('加密文件暂不支持');throw e;}finally{await task.destroy();}
}
async function inspect(input){
 const buffer=fs.readFileSync(input.path);if(!buffer.length||buffer.length>20*1024*1024)error('文件过大');
 const sha256=crypto.createHash('sha256').update(buffer).digest('hex');
 if(input.action==='render'){if(buffer.subarray(0,5).toString()==='%PDF-')return pdf(buffer,input.pageNumber);const sharp=require('sharp');return {mime:'image/png',imageBase64:(await sharp(buffer,{limitInputPixels:20000000,failOn:'warning',animated:false}).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).png().toBuffer()).toString('base64')};}
 let result;
 if(buffer.subarray(0,5).toString()==='%PDF-')result=await pdf(buffer);
 else if(buffer.subarray(0,4).equals(Buffer.from([80,75,3,4])))result=await docx(buffer);
 else{const sharp=require('sharp'),s=sharp(buffer,{limitInputPixels:20000000,failOn:'warning',animated:false}),m=await s.metadata();const mime={jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[m.format];if(!mime||!m.width||!m.height||m.width*m.height>20000000||m.pages>1)error('格式不支持');await s.resize({width:32,height:32,fit:'inside'}).raw().toBuffer();result={mime,pages:[''],pageLabel:'图片上传顺序'};}
 return {...result,sha256,byteSize:buffer.length,pageCount:result.pages.length,requiresOcr:result.pages.some(t=>t.trim().length<10)};
}
function runInspector(input,{timeoutMs=30000,signal}={}){return new Promise((resolve,reject)=>{const worker=new Worker(__filename,{workerData:input,resourceLimits:{maxOldGenerationSizeMb:256}});let done=false;const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();err?reject(err):resolve(value);};const abort=()=>finish(Error('任务已取消'));const timer=setTimeout(()=>finish(Error('文件解析超时')),timeoutMs);worker.once('message',r=>r.ok?finish(null,r.data):finish(Error(r.message)));worker.once('error',()=>finish(Error('文件损坏或解析资源超限')));worker.once('exit',code=>{if(!done)finish(Error('文件解析进程退出'));});if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});});}
if(!isMainThread)inspect(workerData).then(data=>parentPort.postMessage({ok:true,data}),e=>parentPort.postMessage({ok:false,message:['材料不安全','文件过大','格式不支持','材料页数超限','加密文件暂不支持','材料文本过长'].includes(e.message)?e.message:'文件损坏或不支持解析'}));
module.exports={runInspector,DOCX};
