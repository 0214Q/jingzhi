from pathlib import Path
import subprocess,tempfile,json,html,re
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
 out=Path(temp);(out/'package.json').write_text('{"type":"commonjs"}')
 subprocess.run(['node',str(root/'admin-web/node_modules/typescript/bin/tsc'),'--outDir',temp,'--rootDir',str(root),'--module','commonjs','--target','ES2022','--strict','--skipLibCheck',str(root/'shared/ContestListService.ts'),str(root/'shared/MockRuntime.ts')],check=True)
 script="const {MockRuntime}=require(process.argv[1]);const {ContestListController,defaultListQuery}=require(process.argv[2]);(async()=>{const r=new MockRuntime();await r.auth.login({account:'student',password:'demo123'});const c=new ContestListController(r.contests,()=>{});await c.setQuery(defaultListQuery());process.stdout.write(JSON.stringify(c.snapshot()));})().catch(e=>{console.error(e);process.exit(1)});"
 data=json.loads(subprocess.check_output(['node','-e',script,str(out/'shared/MockRuntime.js'),str(out/'shared/ContestListService.js')],text=True))
preview=root/'preview';(preview/'list-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
base=(preview/'home.html').read_text();style=re.search(r'<style>(.*?)</style>',base,re.S).group(1)
e=html.escape
colors={'报名中':'#1FAA59','公示中':'#18B7C2','评审中':'#7C5CFC','已结束':'#5C6670'}
def card(x):
 v=x['regEnd'];d=v[:10].replace('-','.')+(' '+v[11:16] if 'T' in v else '（原文仅日期）')
 return f'<article class="card"><div class="meta">{e(x["category"])} · {e(x["scopeType"])}<span style="color:{colors.get(x["contestStatus"],"#2C7BE5")}">{e(x["contestStatus"])}</span></div><h3>{e(x["name"])}</h3><strong>报名截止：{e(d)}</strong><p>主办方：{e(x["organizationName"])}</p><p>参赛对象：{e(x["applicableScope"]["applicableNote"])}</p></article>'
header='<div class="section"><small>返回</small><h1 style="font-size:20px">赛事</h1><small>刷新　月份</small></div><div class="search">搜索赛事名称或主办方 <b>搜索</b></div><div style="display:flex;gap:8px;font-size:12px;margin-top:12px"><b style="background:#2C7BE5;color:white;padding:12px;border-radius:22px">全部</b><span style="padding:12px">学科</span><span style="padding:12px">双创</span><span style="padding:12px">文体</span><span style="padding:12px">技能</span><span style="padding:12px">综合</span></div><div style="display:flex;gap:18px;font-size:12px;margin-top:12px"><b style="color:#2C7BE5">全部状态</b><span>报名中</span><span>报名截止</span><span>比赛中</span><span>评审中</span></div><div class="section" style="margin-top:20px"><small>最近更新优先</small><small style="color:#2C7BE5">清除筛选</small></div><p class="demo">演示数据 · 非真实竞赛通知</p>'
body=header+f'<small>共 {data["total"]} 场赛事</small>'+''.join(card(x) for x in data['items'][:4])+'<div class="refresh">加载更多</div>'
page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>竞知列表 · 静态视觉参考</title><style>'+style+'</style><div class="note">静态布局参考 · 非 DevEco 截图 · 截取前4条</div><div class="phone"><main>'+body+'</main><nav class="tabs"><span>首页</span><b>赛事</b><span>消息</span><span>我的</span></nav></div></html>'
(preview/'list.html').write_text(page)
dialog='<div style="position:fixed;inset:0;background:#1F273366;display:flex;align-items:center;justify-content:center"><div style="width:358px;background:white;padding:24px;border-radius:20px"><h2 style="font-size:20px;text-align:center">按月份查看</h2><div class="section" style="margin:24px 0"><small>上一年</small><b>2026 年</b><small>下一年</small></div><div class="section" style="margin:24px 0"><small>上一月</small><b style="font-size:18px">10 月</b><small>下一月</small></div><div class="section"><b style="background:#2C7BE5;color:white;padding:12px;border-radius:22px;font-size:14px">报名时间</b><b style="background:#EEF1F4;padding:12px;border-radius:22px;font-size:14px">比赛时间</b></div><p style="font-size:12px;color:#5A6573;line-height:1.8">按所选月份与时间区间相交筛选；未知时间不推测。</p><div class="section" style="font-size:14px;color:#2C7BE5;margin-top:24px"><span>取消</span><span>清除月份</span><b>确认</b></div></div></div>'
(preview/'month-dialog.html').write_text(page.replace('</html>',dialog+'</html>'))
print('列表与月份弹窗静态参考已生成')
