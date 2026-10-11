# 第七步 · 赛事详情页

## 已完成

新增 pages/ContestDetail.ets 与共享 ContestDetailService / Controller。首页最新卡片、即将截止卡片及列表卡片均携带 contestId 跳转详情；main_pages.json 注册路由。详情只调 ContestRepository.getPublicVersion 一次取得公开快照，不调用后台版本接口，不另行拼接可能来自不同版本的来源、公示和日志。

布局：赛事名称/归属/状态/截止 → 待补充橙色提示 → 常驻来源区 → 可折叠分区 → 修改记录 → 公示。基本信息、适用对象、时间安排、参赛要求、奖项/第二课堂和报名方式默认展开；评审规则、修改记录默认折叠。时间区显示当前阶段并用状态色强调，不凭日期猜测评审或公示。

来源区含单位、标题、原文发布时间、采集/核对时间、原通知链接和未授权声明。真实 HTTP(S) 链接尝试唤起系统浏览器，失败可长按复制。example.invalid 演示链接只提示，不尝试打开真实网站。

修改记录支持全部/原通知变更/平台纠错，以蓝/红区分，展示操作人、时间、字段中文名称、前后值和原因。只记录平台自身更新过程，后台审核备注和草稿日志不公开。复杂变更值保留JSON文字，不作为HTML执行。

公示区支持当前/历史；当前含获奖名单/评审办法/评分标准三个子项。底部“看公示”切换到同页公示专注视图，“返回详情”回正文；不是新的独立公示页面。历史只展示当前contestId的旧公示版本，不冒充历届赛事。

缺失字段用真正null，显示原通知未公布；第二课堂显示适用性、依据和待确认说明，不作加分承诺。附件不调用管理端上传/详情接口；仅提示在原通知中查看。

加载、刷新、临时失败重试、未发布、无权限、未登录、缺少ID均有状态。切换请求和离开页面不会让旧响应覆盖当前内容。下架快照只读保留并显示原因；不提供报名按钮。反馈按钮明确提示暂未开放，收藏/反馈/消息登录界面未在本步扩展。

## 运行与演示数据

按 student-app/README.md 创建 DevEco Empty Ability 工程，复制所有ets源码，并覆盖 resources/base/profile/main_pages.json；保留IDE配置、SDK和签名。

可检验的记录：

| ID | 情况 |
|---|---|
| DEMO-1 | 两类公开修改记录、公开历史版本和内部日志隔离 |
| DEMO-3 | 缺少评审规则和奖项的橙色提示 |
| DEMO-11 | 虚构获奖名单、当前评审办法、旧版公示及待审评分标准隔离 |
| DEMO-15 | 下架只读内容，列表不展示；可从本机临时路由进入检查 |
| DEMO-16 | 草稿，不可公开访问 |

所有赛事/获奖团队均为演示，不是真实河大通知或名单。Mock仍使用固定时间和内存数据，两端不跨进程同步。

## 验证

```bash
cd admin-web
npm ci
npm run build
cd ..
python scripts/test-repositories.py
python scripts/sync-detail.py --check
python scripts/sync-mock.py --check
python scripts/check-boundaries.py
```

31项测试通过，新增7项详情测试覆盖：只读公开快照、来源一致、空值/日期/中文缺失项、两类日志、待审公示隔离、历史公示、下架/权限/未发布、乱序及销毁回调、错误重试和来源链接处理。此前24项仍通过。Web构建与同步检查通过。

当前没有DevEco SDK，ArkUI编译、系统浏览器唤起、原生路由/折叠点击和不同设备适配未验证；上述逻辑测试不等同于原生UI运行结果。

## 预览

preview/detail.html、detail-logs.html、detail-publicity.html、detail-takedown.html 为静态布局参考，不是DevEco截图，也不能交互。数据来自同一服务与Repository，可用 python scripts/build-detail-preview.py 重生成。日志预览专门展开修改记录以便检查，实际页面默认折叠。

后续接真实后端时仍通过Repository；品牌/演示声明按运行配置调整。公网部署和生产鉴权不在本步骤中。
