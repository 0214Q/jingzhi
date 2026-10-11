const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),os=require('node:os'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),children=[];let stopping=false;
function command(name,args,cwd){return process.platform==='win32'?spawn(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`${name} ${args.join(' ')}`],{cwd,stdio:'inherit',env:process.env}):spawn(name,args,{cwd,stdio:'inherit',env:process.env});}
function run(name,args,cwd){return new Promise((resolve,reject)=>{const child=command(name,args,cwd);child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(`${name} ${args.join(' ')} failed (${code})`)));});}
function portFree(port){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',()=>reject(Error(`Port ${port} is occupied. Stop the existing backend/web window before starting this project.`)));s.listen(port,'0.0.0.0',()=>s.close(resolve));});}
function stop(code=0){if(stopping)return;stopping=true;console.log('\nStopping project services...');const jobs=children.map(c=>new Promise(resolve=>{if(c.exitCode!==null)return resolve();if(process.platform==='win32'){const killer=spawn('taskkill',['/PID',String(c.pid),'/T','/F'],{stdio:'ignore'});killer.once('error',resolve);killer.once('exit',resolve);}else{c.once('exit',resolve);c.kill('SIGTERM');}}));Promise.all(jobs).then(()=>process.exit(code));setTimeout(()=>{for(const c of children)c.kill('SIGKILL');process.exit(code);},4000).unref();}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
async function wait(url){for(let i=0;i<100;i++){if(stopping)throw Error('Startup stopped');try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error('Service startup timed out: '+url);}
(async()=>{
 if(Number(process.versions.node.split('.')[0])!==24)throw Error('This project requires Node.js 24.x.');
 const db=path.join(root,'backend/data/jingzhi.sqlite');if(!fs.existsSync(db))throw Error('Missing backend/data/jingzhi.sqlite. Restore the supplied database; do not seed demo data.');
 await portFree(8787);await portFree(5173);
 const web=path.join(root,'admin-web');if(!fs.existsSync(path.join(web,'node_modules/typescript/lib/typescript.js'))||!fs.existsSync(path.join(web,'node_modules/vite/bin/vite.js'))){console.log('Installing admin-web dependencies (first run)...');await run('npm',fs.existsSync(path.join(web,'package-lock.json'))?['ci']:['install'],web);}
 await run('node',['scripts/build.cjs'],path.join(root,'backend'));
 const backend=spawn(process.execPath,['src/server.cjs'],{cwd:path.join(root,'backend'),stdio:'inherit',env:{...process.env,HOST:'0.0.0.0',PORT:'8787',DB_PATH:db,CORS_ORIGINS:'http://localhost:5173,http://127.0.0.1:5173'}});children.push(backend);
 const frontend=spawn(process.execPath,[path.join(web,'node_modules/vite/bin/vite.js'),'--host','0.0.0.0','--port','5173','--strictPort'],{cwd:web,stdio:'inherit',env:{...process.env,VITE_API_BASE_URL:'http://127.0.0.1:8787'}});children.push(frontend);
 for(const c of children){c.once('error',e=>{console.error(e.message);stop(1);});c.once('exit',code=>{if(!stopping){console.error('A project service exited: '+code);stop(1);}});}
 await Promise.all([wait('http://127.0.0.1:8787/health'),wait('http://localhost:5173/')]);
 console.log('\nReady: admin http://localhost:5173/ | API http://127.0.0.1:8787/health');
 for(const list of Object.values(os.networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&!n.internal)console.log('Phone network candidate: http://'+n.address+':8787');
 console.log('Keep this window open. Press Ctrl+C to stop both services.');
 if(process.platform==='win32'&&!process.env.JINGZHI_NO_BROWSER){const browser=spawn(process.env.ComSpec||'cmd.exe',['/d','/c','start','""','http://localhost:5173/'],{stdio:'ignore'});browser.on('error',()=>{});}
})().catch(e=>{console.error(e.message);stop(1);});
