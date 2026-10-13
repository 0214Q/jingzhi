# 学生所属高校与浏览高校规则（数据与学生端页面）

## 业务定义

| 概念 | 数据来源 | 允许学生修改 | 用途 |
|---|---|---|---|
| 所属高校 | User.schoolId（账号已有归属） | 否，本步没有转校或学籍认证接口 | 保留账号身份及原有管理授权依据 |
| 当前浏览高校 | student_school_preferences.selected_school_id | 是，只能选已启用高校 | 首页、赛事、收藏、反馈当前数据范围 |
| 赛事高校 | Contest.schoolId | 否 | 每条赛事唯一所属目录范围 |
| 反馈高校 | Feedback.schoolId | 否，由后端写入 | 固定提交时归属，避免随浏览切换漂移 |

选择另一高校只是查看其公开目录，不代表变更学籍、确认参赛资格或获得管理权限。是否能参赛仍以具体赛事适用范围和当年官方通知为准。本步不实现学生注册、学校身份认证或转校。

## 默认值和有效性

1. 已有河南大学学生首次默认HENU。其他账号默认其User.schoolId，仅当该高校登记且启用。
2. 可选列表返回所有启用高校，登录后仅学生可查询；字段只有id/name/code/status，不含学院、人员或账号资料。列表允许无赛事高校，此时公开赛事列表为0条，不回退到河南大学。
3. 未登记、停用或缺少默认高校时，selectedSchool为null、state为“需重新选择”。高校查询和选择仍可用，赛事/收藏/反馈业务请求返回409。
4. 选择已停用或不存在高校返回422。高校停用后保留原selectedSchoolId，绝不自动替换浏览范围。重新启用可恢复原选择，或由学生主动选择另一启用高校。
5. 选择持久化到账号，重新登录仍保留，跨设备共用；不会写User.schoolId、Role或CampusMember。
6. 所属高校展示可能返回停用的homeSchool摘要；不代表可选。高校改名会使用最新摘要。

## 数据范围

- 赛事列表、搜索、月份、详情、公示和公开修改记录使用后端保存的当前浏览高校；只展示该高校已公开且未下架的赛事。
- 详情及关联接口仍逐条校验Contest.schoolId，知道其他高校赛事ID也不能绕过当前选择。
- 收藏按所选高校筛选后分页；其他高校收藏保存但不进入当前列表，切回后恢复。下架收藏仍显示失效。取消收藏只能操作当前高校赛事。
- 学生反馈列表按当前高校筛选后分页；切换不会删除其他高校反馈。
- 赛事反馈归属赛事高校，并须符合当前选择；无关联赛事反馈归属当前浏览高校。CreateFeedbackRequest不接受schoolId，防止伪造。旧记录迁移按关联赛事高校、或原账号所属高校补充归属。
- 管理反馈查询及处理以反馈固定高校为准；跨校浏览学生的反馈进入正确校级管理员范围。既有管理角色和赛事分配授权不受浏览高校影响。
- 不新增自动跨校公开策略。其他学校必须在后台录入并发布自己的赛事；河南大学184条公开目录不会自动复制过去。

## DTO 和 Repository

StudentSchool、StudentSchoolQuery、StudentSchoolPage、StudentSchoolContext、SelectStudentSchoolRequest在shared/contracts.schema.json统一定义；Feedback新增可选schoolId用于读取旧数据兼容，迁移和新提交写入该字段。
StudentSchoolState枚举：默认所属高校／已选择高校／需重新选择。
StudentSchoolContext包含homeSchoolId/homeSchool、selectedSchoolId/selectedSchool、state、etag。

| 接口 | Repository方法 | 规则 |
|---|---|---|
| GET /student/schools | listSchools | 学生认证；keyword/page/pageSize，pageSize最多100 |
| GET /student/school-context | getContext | 返回所属与当前浏览高校，禁止额外查询参数 |
| PUT /student/school-selection | selectSchool | {schoolId,expectedEtag}；仅学生，拒绝额外字段 |

HTTP实现和范围服务已同步到两端。学生端首页与“我的”增加选择入口；SchoolSelection页面经StudentSchoolService调用Repository，EntryAbility配置真实HTTP及范围保护。ArkTS端使用PUT，未引入不受支持的RequestMethod.PATCH。

## 并发、错误和页面接入约定

- 选择带expectedEtag。旧版本返回409；重复选择同一高校且etag匹配不产生新日志或etag。
- 所有操作在既有SQLite串行事务内完成。选择变更同时写student_school_audit_logs。
- 学生端加载StudentSchoolContext，再按快照发送X-Student-School。与服务器当前选择不一致返回409，阻止旧页面将一般反馈写到新高校。该头仅用于检测过时页面，不能授予访问权限。
- 未更新的旧客户端仍兼容使用服务器当前选择，但不具备跨校刷新页面的能力；跨校使用应更新到本补丁的客户端。
- 切换成功后通过replaceUrl回首页并clear导航栈；重新进入列表、详情、收藏及反馈时重置旧数据并读取当前范围。SchoolScopedTransport捕获账号/高校版本，拒绝晚到的旧响应。离开页面的请求不能再次写入组件状态。
- 登录返回和/auth/me继续返回原User.schoolId。页面不得把它覆盖为浏览高校，管理请求仍走独立Campus权限。
- 未迁移003时新学生高校接口返回503，旧业务保持原高校行为；正式应用003后开启上述范围规则。

## 迁移与保留边界

003新增student_school_preferences和student_school_audit_logs；初始化学生默认选择；旧反馈JSON只补充schoolId，不改正文、状态、关联或回复。不改变users、contests、versions、收藏记录、成员授权和赛事分配。
迁移需先有002，支持预览回滚、应用前备份和重复执行。后续新增学生在首次读取上下文或业务请求时初始化默认选择。

本阶段已包含高校选择页面与动态高校目录提示，不包含学生学校认证。河南大学原目录与所有历史业务记录保留。

## 学生端接入补充

- 首页和“我的”均可进入选择页；显示账号所属高校、当前浏览高校、搜索及分页。保存期间禁止重复提交和返回；冲突后重新读取并要求确认，不自动覆盖另一设备的选择。
- 未选择或停用高校时引导选择页；网络或未迁移错误明确显示并提供重试。登录身份失效返回登录页，不保留高校上下文。
- 收藏/反馈标题显示当前高校；切回原高校可读取既有记录。草稿不会被带到另一个高校提交。
- 校外赛事的旧枚举值仍保持兼容，学生端改为中性的“校外赛事（适用范围见详情）”显示；原通知的适用对象文本保持原文，不自动改写资格。
- 首页截止提示使用当前时间，不再使用固定演示日期。学校没有公开赛事时显示空列表。
- 管理端工作高校头和学生浏览高校头各自独立；学生选择不会影响校级审核权限。
