# 第五步 · 学生端首页

## 实现范围

student-app/entry/src/main/ets/pages/Index.ets 为 ArkUI 首页，components/ContestCard.ets 为可复用赛事卡片，common/Theme.ets 统一状态颜色。HomeService 只依赖 ContestRepository，通过 Provider 取得接口；页面没有引用 Mock、HTTP 或网络库。

界面按搜索 → 即将截止 → 分类 → 最新赛事 → 公告排列，底部固定首页/赛事/消息/我的。页面使用浅色背景、蓝色主色、白色14圆角卡片、16间距和状态标签。卡片展示赛事类型、归属、名称、状态、报名截止、主办方和参赛对象。

## 当前可用交互

- 输入名称或主办方，点击搜索提交：首页内容按关键词过滤。
- 点击学科/创新创业/文体/技能分类；再次点同分类取消选择。
- 清除筛选、查看全部及刷新赛事。
- 自动加载、加载提示、无结果、无近期截止、读取失败重试。
- 请求编号阻止旧请求覆盖新筛选；离开页面后结果不再写回。

当前只开发首页：赛事、消息、我的和卡片详情入口会提示暂未开放，不跳转空白页。没有列表分页界面或详情页，也没有在线报名。

## 数据规则

- 即将截止：当前仍为报名中，截止时间已公布，未来7个自然日（包含今天），时刻型已过期排除；按截止时间升序取3条。
- 最新赛事：按当前公开版本 updatedAt 降序取4条，不按报名截止排序。Mock listPublished 新增支持 -updatedAt 排序，待审版本不会影响顺序。
- HomeService 经 Repository 分页扫描报名中候选，不仅扫描第一页；日期未知不推测。
- 日期型截止显示“原文仅日期”，时刻型显示日期和时刻；不把日期转换成伪造截止时刻。
- 公告是本地平台说明，并非抓取的学校官方公告。品牌/学校/主色/演示时间集中在 demoHomeConfig，v1 暂无学校配置 Repository。
- 演示仍固定时间 2026-10-10T10:00:00+08:00；种子中3条截止调整为10月11/12/13日，首页可见倒计时。
- 演示数据共18条，公开列表14条；尚未连接后端或导入真实竞赛。

## 在 DevEco 运行

按 student-app/README.md 创建 ArkTS Empty Ability 工程。复制 entry/src/main/ets 下所有文件（包括新增 components/common/services/pages），以及 resources/base/profile/main_pages.json；保留 IDE 自动生成的工程、SDK和签名配置。首页由 pages/Index 启动，EntryAbility 自动注入演示学生 Mock。

当前环境没有 DevEco/SDK，所以 ArkUI组件编译、模拟器运行与安全区域适配尚需本机验收。已验证的是共享业务逻辑与 Web 工程，不能把它们当作 ArkUI 编译结果。

## 交付中的视觉预览

preview/home.html 可直接用浏览器打开，展示首页静态布局和真实 HomeService 返回的演示快照；按钮不响应，是评审用视觉参考，不是学生端运行截图或替代实现。预览数据保存在 preview/home-data.json。

安装 Web 依赖后，可重生成预览：python scripts/build-home-preview.py。

## 验证

```bash
cd admin-web
npm ci
npm run build
cd ..
python scripts/test-repositories.py
python scripts/sync-home.py --check
python scripts/sync-mock.py --check
python scripts/check-boundaries.py
```

17 项测试通过（新增5项首页测试）：截止排序与最新排序、搜索分类与空结果、精度/倒计时、错误传播、跨页候选扫描；此前审核/公开版/留痕测试仍通过。Web 构建通过。首页真实设备显示与点击验收仍需 DevEco。
