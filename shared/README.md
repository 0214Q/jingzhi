# 共享数据契约 · 第 2 步

单一来源：contracts.schema.json；contracts.ts 和两端模型由 scripts/sync-contracts.py 自动生成，不要分别手改。

```bash
python scripts/sync-contracts.py
python scripts/sync-contracts.py --check
```

源码使用同样的字符串枚举值；例如 Role.Value0 = 学生，ContestStatus.Value1 = 报名中。JSON 仍发送中文字符串，不发送数字枚举索引。字段采用 camelCase。

## 对接口 V2 的对齐与补充决定

| 项目 | 本契约约定 |
|---|---|
| 赛事聚合 | Contest 为管理端聚合，publishedVersionId 未发布时为 null；学生详情为 PublicContest，指针必有值 |
| 列表与详情 | ContestSummary 为卡片摘要，ContestPage 分页；PublicContest 含 data/source/publicity/auditLogs |
| 审核状态 | 仅在 ContestVersion.status / Publicity.reviewStatus；赛事状态在 Contest.contestStatus |
| 草稿 | CreateDraftRequest / UpdateDraftRequest 内容可缺项；reason/changeType 必填，提交审核再按主体校验 |
| 空值 | 完整响应 DTO 缺失内容为 null；请求的可选属性可不传。undefined 不发送到 JSON |
| 学校归属 | schoolId 只在响应/服务端模型出现，创建草稿和公示请求不能上传 |
| 并发 | 编辑、派生、提交使用 HTTP If-Match；审核按接口 V2 在请求体传 versionId/etag。ConcurrencyHeaders.ifMatch 由后续网络层映射 |
| 登录 | LoginRequest 二选一：account+password 或 agcToken；token 为纯 Token，tokenType 按响应拼请求头 |
| 时间 | date 字符串 YYYY-MM-DD，datetime 带时区；Asia/Shanghai。regEndHasTime 为服务端推导，不允许日期补成午夜 |
| 源数据 | 来源字段同时出现在 payload/source，服务端必须从同一公开版本构造，不允许彼此不一致 |
| 公共日志 | PublicAuditLog 的 visibility 只能 public；不包含审核备注。旧已发布版本日志可保留，待审日志不得公开 |
| 公示 | 学生 PublicityResult = current + history，不包含内部备注/etag；current 用 winners/rule/standard |
| 公示内容 | V2 允许 text/json；定义 string 或 PublicityContent（text+winners），具体获奖字段为本步骤补充约定 |
| 下架 | takedown 与审核状态独立，内容可只读返回，收藏 available=false |
| 导入 | taskId 始终保持原值，不追加“已冻结”字样；冻结/提交状态在 ImportTask 上，提交后不可再次消费 |
| 错误 | fieldErrors 为 Record<string,string>，保留 V2 JSON 形状；409 数据包含 currentEtag，可补 differences |
| 分页 | page 从 1 开始，pageSize 默认 20、最大 100；本步骤只定义类型，不实现验证逻辑 |
| 过滤 | ContestFilter 的 category 等由后续请求层映射 filter.category；month=YYYY-MM，monthMode=reg/contest |
| 组织 | organizationName 是服务端展示字段，不能由创建请求伪造；权限由后端校验，类型不能替代鉴权 |

文档存在的歧义处理：creditApplicable=待确认 时示例没有 creditBasis，但表格要求非“否”必填；类型保留 nullable，提交校验是否允许未公布依据将在 Repository 步骤明确。regStart 表格必填但公开通知可能未公布，草稿/完整响应仍允许 null，不编造日期。缺失字段在 incompleteFields 标注，界面显示“原通知未公布”。

V2 未穷举 Feedback.type、Attachment.type、Organization.type、device platform，因此保留 string，避免自造枚举；ImportState、Winner、SchoolConfig、ManagedContest 与分页资源结构为实现补充，需在后端实现时同步采用。尚未实现公示编辑状态机及运行时 DTO 校验。

## 字段字典

详见 FIELD_DICTIONARY.md：每个 DTO 的字段、类型和可选规则逐项列出。

## 验证边界

TypeScript 类型检查、契约同步与 Web 构建可在当前环境验证。ArkTS 采用命名接口、字符串枚举、显式可空字段，不使用 Partial/Pick 或索引签名；但没有 DevEco SDK，未声称 ArkTS 编译通过。将 Contracts.ets 复制到第 1 步创建的工程后，需在本机检查。

第 3 步补充的 DTO 与 Repository 使用说明见 REPOSITORY_GUIDE.md。当前总计 74 个 DTO、19 组枚举。
