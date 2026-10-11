# 第四步 · Mock 数据与实现

本次实现 MockAuthRepository、MockContestRepository（20 个方法）与 MockPublicityRepository（6 个方法），共 29 个接口方法，验证登录、赛事只读、草稿/审核/公开版本、来源和留痕、公示重审。收藏、反馈、提醒、导入和附件 Mock 尚未实现，沿用第三步接口，后续各步骤再接入。没有增加业务页面。

## 运行

```bash
cd admin-web
npm ci
npm run dev
```

页面点击“检查数据源”，预期显示 14 条公开赛事。初始数据共 18 条：15 条已发布（其中 1 条下架）、1 条草稿、1 条待审核、1 条驳回。所有名称均带演示标识，来源 URL 使用 example.invalid，不是真实竞赛通知。

Web 启动时自动登录演示管理员；学生端 EntryAbility 自动登录演示学生。演示账号 student/editor/organizer/admin，统一密码 demo123。这仅用于本地模拟，不用于正式认证。

时间固定为 2026-10-10T10:00:00+08:00，使演示状态可复现；MockStore.now() 是替换演示时钟的位置。登录过期按实际时间计算。所有数据只保存在内存，刷新/重启重新生成；没有接网络，两端数据不跨进程同步。

## 验证

安装 Web 依赖后，在项目根目录运行：

```bash
python scripts/sync-contracts.py --check
python scripts/sync-repositories.py --check
python scripts/sync-mock.py --check
python scripts/check-boundaries.py
python scripts/test-repositories.py
```

12 项测试涵盖完整审核循环、公开指针稳定、驳回重提、etag 冲突、角色/组织/学校限制、快照拷贝、空缺项与日期校验、公示审核和旧版保留、历史恢复、下架与筛选、登录过期，以及 Provider 注入替换。Web 生产构建已通过。

ArkTS 文件与同一源文件同步，尚未经过 DevEco SDK 编译。学生端仍需按 student-app/README.md 创建工程并复制 models、repository、services、pages 和 EntryAbility，保留本机 SDK 配置。

## 已实现规则

- 学生仅查询 publishedVersionId 指向的已发布快照，待审/驳回不影响公开指针。
- 驳回后保持驳回，可编辑并重新提交；每次提交/编辑/审核刷新 etag。
- 已发布内容不能原地编辑；派生新版本再审核。仅允许一个未发布工作版本。
- 修改公共记录在审核通过时从旧公开快照生成净差异；草稿中间编辑和审核状态记录留在 internal。初次发布生成首录记录。
- 公共详情明确构造 source、公示和公共日志，不返回 reviewNote、内部快照和 etag。方法返回深拷贝，调用方不能修改内存源数据。
- 审核产生 ReviewRecord；公示操作另存内部 publicityActions；下架/重新上架留日志，保留数据。
- 信息整理人员只编辑自己创建的团队整理赛事；主办方只编辑其组织资源；审核只允许管理员，跨校请求拒绝。
- 日期仅日期与精确时刻保持原精度，不补午夜；公示/评审状态不从日期凭空推断。月份按时间区间相交筛选，未知区间不猜测。
- 团队整理允许未公布规则/奖项，null 和 incompleteFields 体现缺失；主办方缺规则、奖项、要求或报名期不可提交。
- creditApplicable=是 时要求依据；待确认可缺依据，但必须填 creditNote，并标记 incompleteFields。该决定解决接口 V2 表格与示例冲突。
- 草稿内容保留 DTO 必需字段的占位默认值，但未选择 category/scopeType/entryType 会独立记录并阻止提交，避免把占位值当真实信息。
- updateDraft 按整体表单保存，未传字段回到空值/占位，不当作 PATCH；使用者应提交完整当前表单。
- 公示 create 生成草稿；修改已发布公示通过再次 create 同类型新版本，然后提交审核，旧版持续可见；通过后旧版进入 history。
- 获奖名单 Mock 要求结构化 winners；评审办法/评分标准可使用纯文本。原接口允许文本获奖名单，但 current.winners 无法表达，当前明确拒绝，避免丢失内容。
- 撤回公示隐藏该赛事的整个公示类型，不自动回退更旧的结果；新审核通过可重新公开。该标记仅在 MockStore 内部，未擅自添加公共审核状态。
- scope=仅公示 的赛事下架请求目前明确返回 422，使用 PublicityRepository.withdraw；没有假装支持该分支。

## 实现边界

Mock 权限只验证逻辑，不能作为上线安全边界。运行时校验覆盖关键发布条件、枚举、核心长度和日期，不声称完整验证所有 DTO。用户与组织仅演示预置，不含管理界面。版本恢复实现可供测试调用，没有回滚页面。下一步继续学生端首页，不扩展导入/推送等功能。
