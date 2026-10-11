from pathlib import Path
import subprocess,tempfile,json,html,re
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
 out=Path(temp);(out/'package.json').write_text('{"type":"commonjs"}')
 subprocess.run(['node',str(root/'admin-web/node_modules/typescript/bin/tsc'),'--outDir',temp,'--rootDir',str(root),'--module','commonjs','--target','ES2022','--strict','--skipLibCheck',str(root/'shared/ContestDetailService.ts'),str(root/'shared/MockRuntime.ts')],check=True)
 script="const {MockRuntime}=require(process.argv[1]);const service=require(process.argv[2]);(async()=>{const r=new MockRuntime();await r.auth.login({account:'student',password:'demo123'});const result=[];for(const id of ['DEMO-3','DEMO-1','DEMO-11','DEMO-15']){const d=await r.contests.getPublicVersion(id);result.push({id,detail:d,sections:service.detailSections(d),warning:service.incompleteText(d),logs:service.publicLogs(d,null).map(x=>({...x,label:service.fieldLabel(x.field),before:service.auditValue(x.oldValue),after:service.auditValue(x.newValue)})),publicity:service.publicityTabText(d.publicity,'winners')});}process.stdout.write(JSON.stringify(result));})().catch(e=>{console.error(e);process.exit(1)});"
 data=json.loads(subprocess.check_output(['node','-e',script,str(out/'shared/MockRuntime.js'),str(out/'shared/ContestDetailService.js')],text=True))
preview=root/'preview';(preview/'detail-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
e=html.escape
style=re.search(r'<style>(.*?)</style>',(preview/'home.html').read_text(),re.S).group(1)
style+=' .block{background:white;border-radius:14px;padding:16px;margin-top:12px}.block h2{margin-bottom:12px}.block p{font-size:14px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}.block small{white-space:pre-wrap;line-height:1.8}.warn{background:#FFF4EA;color:#A64B08;border-radius:14px;padding:16px;font-size:12px;line-height:1.8}.log{border-left:2px solid #2C7BE5;padding-left:12px;margin:16px 0}.bottom{position:fixed;bottom:0;left:50%;transform:translateX(-50%);background:white;width:390px;max-width:100%;padding:12px;display:flex;justify-content:space-around;color:#2C7BE5;border-top:1px solid #ECEFF3}'
def date(v):return '原通知未公布' if not v else v[:10].replace('-','.')+(' '+v[11:16] if 'T' in v else '（原文仅日期）')
for item in data:
 d=item['detail'];source=d['source']
 header='<div class="section"><small>返回</small><h1 style="font-size:20px">赛事详情</h1><small>刷新</small></div>'
 hero=f'<div class="block"><div class="meta">{e(d["data"]["category"])} · {e(d["data"]["scopeType"])}<span style="color:#1FAA59">{e(d["contestStatus"])}</span></div><h3 style="font-size:20px">{e(d["data"]["name"])}</h3><strong style="font-size:14px;color:#A64B08">报名截止：{e(date(d["data"]["regEnd"]))}</strong><p class="demo">演示数据 · 非真实竞赛通知</p></div>'
 warning=f'<div class="warn">{e(item["warning"])}</div>' if item['warning'] else ''
 takedown=f'<div class="warn" style="background:#FFF0F0;color:#B32E34">该赛事已下架，内容仅供参考。<br>原因：{e(d["takedown"]["reason"])}</div>' if d['takedown'] else ''
 src=f'<div class="block"><h2>信息来源</h2><p>来源：{e(source["sourceOrg"] or "原通知未公布")}<br>{e(source["sourceTitle"] or "原通知未公布")}</p><small>原文发布时间：{e(date(source["sourcePublishedAt"]))}<br>信息采集：{e(date(source["collectedAt"]))}<br>最近核对：{e(date(source["lastVerifiedAt"]))}</small><p style="font-size:12px;color:#2C7BE5">原通知链接：{e(source["sourceUrl"] or "原通知未公布")}</p><div class="refresh">查看原通知</div><p style="font-size:12px;color:#5A6573">平台由竞知项目团队维护，尚未取得学校官方授权；平台审核仅表示信息核对，不代表学校官方认证。</p></div>'
 sections=''
 for section in item['sections']:
  collapsed=section['key']=='rules'
  sections+=f'<div class="block"><div class="section"><h2>{e(section["title"])}</h2><small>{"展开" if collapsed else "收起"}</small></div>'+('' if collapsed else f'<p>{e(section["text"])}</p>')+'</div>'
 logs='<div class="block"><div class="section"><h2>修改记录</h2><small>展开</small></div></div>'
 if item['id']=='DEMO-1':
  logs='<div class="block"><h2>修改记录（展开参考）</h2><small>仅证明平台自身更新过程</small>'+''.join(f'<div class="log" style="border-color:{"#2C7BE5" if x["changeType"]=="原通知变更" else "#E5484D"}"><b style="font-size:14px">{e(x["changeType"])} · {e(x["label"])}</b><small><br>{e(date(x["time"]))} · 操作人：{e(x["operator"])}</small><p>修改前：{e(x["before"])}<br>修改后：{e(x["after"])}<br>原因：{e(x["reason"])}</p></div>' for x in item['logs'])+'</div>'
 publicity='<div class="block"><h2>结果公示</h2><div class="section"><b style="font-size:14px;color:#2C7BE5">当前公示</b><small>历史公示</small></div><div class="section" style="margin-top:16px"><b style="font-size:12px;color:#2C7BE5">获奖名单</b><small>评审办法</small><small>评分标准</small></div><p>'+e(item['publicity'])+'</p></div>'
 body=header+takedown+hero+warning+src+sections+logs+publicity
 page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>竞知详情 · 静态参考</title><style>'+style+'</style><div class="note">静态布局参考 · 非 DevEco 截图</div><div class="phone"><main>'+body+'</main><div class="bottom"><span>提反馈</span><b>看公示</b></div></div></html>'
 filename={'DEMO-3':'detail.html','DEMO-1':'detail-logs.html','DEMO-11':'detail-publicity.html','DEMO-15':'detail-takedown.html'}[item['id']]
 (preview/filename).write_text(page)
print('详情、修改记录、公示与下架静态参考已生成')
