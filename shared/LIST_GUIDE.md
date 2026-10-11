# 第六步 · 学生端赛事列表与筛选

## 当前范围

新增 ArkUI pages/ContestList.ets、components/MonthPickerDialog.ets 和 services/ContestListService.ets。首页的搜索提交、分类入口、底部“赛事”和“查看全部”通过 router.pushUrl 携带条件进入列表。pages/Index 仍为首页，main_pages.json 已登记列表路由。

列表卡片继续复用第五步 ContestCard，展示类型/归属、状态、名称、截止、主办方与参赛对象。列表只读取公开版；草稿、待审核、驳回和下架记录不进入列表。

## 可用交互

- 搜索赛事名称/主办方；提交后应用关键词。
- 分类：全部、学科、双创、文体、技能、综合。
- 赛事状态：全部、未开始、报名中、报名截止、比赛中、评审中、公示中、已结束。不会混入审核状态。
- 月份弹窗：年、月切换；报名时间/比赛时间模式；取消、确认、单独清除月份。支持2000—2100年，月份跨年翻动。
- 时间区间与月份相交筛选，缺失时间不推测。年月标题与模式随筛选同步变化。
- 最近更新/报名截止排序切换；一键清除所有筛选；刷新。
- 首次加载10条，点击加载更多；空结果返回全部；请求失败重试；下一页失败保留前页并重试同一页。
- 首页/返回键回到首页；消息、我的与赛事详情仍提示暂未开放，没有提前实现第七步。

## 分层

页面 → ContestListController → ContestRepository.listPublished。

ListQuery 使用明确可空字段，toFilter 映射到第二步 DTO；routeQuery 验证首页路由参数；列表不导入 Mock 或网络封装。Controller 管理加载状态、分页和请求序号，切换筛选清空旧列表并重置页码，旧请求和页面销毁后的回调不再覆盖当前结果。重复点击加载更多不创建并行请求；重复contestId不重复追加。

shared/ContestListService.ts 为两端服务逻辑单一来源，执行 python scripts/sync-list.py 同步。Web 同步文件用于类型检查和测试，不增加管理端列表界面。

## 本机运行

按 student-app/README.md 创建 DevEco 工程，复制本包 entry/src/main/ets 全部文件，并覆盖 resources/base/profile/main_pages.json。保留 IDE 工程配置、SDK和签名。启动首页后依次验证：关键词搜索跳转、分类跳转、月份弹窗确认/取消、清除筛选、加载更多与返回。

当前没有 DevEco SDK，ArkUI 编译、组件运行、不同设备安全区域和字号适配尚未验证。Web 构建及共享逻辑测试不等同于 ArkUI 编译。

## 测试与预览

```bash
cd admin-web
npm ci
npm run build
cd ..
python scripts/test-repositories.py
python scripts/sync-list.py --check
python scripts/check-boundaries.py
```

24项测试通过，包含新增7项列表测试：分页与重复加载、条件联合传递/重置、空月份、下一页失败重试、乱序请求、页面销毁和路由参数校验。此前17项首页/公开版本/审核/日志测试仍通过。

preview/list.html、preview/month-dialog.html 为静态布局参考，按钮不能交互，不是 DevEco 截图。列表预览只截取前4条；preview/list-data.json 保存同一 Controller 返回的首屏10条快照。安装依赖后可运行 python scripts/build-list-preview.py 重生成。第五步 home.html 是此前布局参考，不代表当前路由交互。

数据依然全为演示，固定时间2026-10-10、内存重置、不跨端同步，不提供真实竞赛或在线报名。
