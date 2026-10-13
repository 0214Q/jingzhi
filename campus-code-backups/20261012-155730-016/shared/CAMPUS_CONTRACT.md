# 高校、学院、负责人：第一步契约

本文件规范下一阶段管理API与页面的实现。当前仅交付模型、数据库迁移、Repository接口及纯权限参考实现；尚未提供高校管理HTTP端点，也未替换旧业务路由中的权限判断。

## 实体关系

| 实体 | 关键关系与字段 |
|---|---|
| CampusSchool | id稳定、name展示名、code唯一、status启用/停用、etag、时间戳 |
| CampusCollege | schoolId必填、校内code/name唯一、status、etag |
| CampusMember | userId关联已有登录账号；role、schoolId、collegeId、displayName、duty、status、etag |
| ContestMaintenance | 每项赛事一条当前维护归属：schoolId、collegeId、responsibleMemberId、etag、assignedBy/At |
| CampusAuditLog | 管理操作记录：真实会话actorUserId、目标高校/学院/实体、动作、修改前后JSON、时间 |

成员授权约束：平台管理员schoolId/collegeId均为空；校级管理员schoolId必填、collegeId为空；学院负责人两项均必填。一个账号可有多条明确授权，一个学院可有多个负责人，一条授权可以负责多个赛事。不能重复创建同一账号/角色/高校/学院组合。

用户姓名未知时，迁移的校级管理员displayName暂用账号ID；后续可编辑，不冒充真实姓名。不储存账号密码到成员实体。学院、负责人不从目录的参赛对象或主办方自动推断。

“主办方Organization”“负责维护的学院”“学生可以参加的范围ApplicableScope”是不同关系。原Organization和参赛范围不变，学院负责人负责全校赛事时，全校仍可浏览。

## 权限矩阵

| 操作 | 平台管理员 | 校级管理员 | 学院负责人 |
|---|---|---|---|
| 新增/修改/停用高校 | 可以 | 不可以 | 不可以 |
| 授予/停用校级、平台管理员 | 可以 | 不可以 | 不可以 |
| 管理学院与负责人 | 指定启用高校内 | 本校 | 不可以 |
| 分配赛事维护归属 | 须另有本校校级授权 | 本校 | 不可以 |
| 查看/编辑草稿/提交审核 | 须另有本校校级授权 | 本校，包括待分配赛事 | 仅分配给本人且学院启用的赛事 |
| 审核通过/驳回、下架、处理赛事反馈 | 须另有本校校级授权 | 本校 | 不可以 |

权限按数据库CampusMember授权计算，不以旧User.role='管理员'推定全平台权限。校级角色没有跨校权力；负责人不能靠传入别人的collegeId/contestId获得访问。停用高校撤销该校业务管理权限，停用学院撤销该学院负责人的维护权限，停用授权立即失效。平台管理员可管理停用高校，以便恢复启用。

“审核赛事”同时用于通过和驳回，仅本校校级授权可执行。一个账号若同时有校级和负责人授权，会拥有这两条授权的并集；当前契约未引入“提交者不能审核自己的版本”的额外规则。角色变更需要新建授权并停用旧授权，不能直接修改userId、schoolId、collegeId和role。

原User.role保留登录兼容；新管理功能接入时Session需加载当前有效授权。每次后端请求重新确认授权和父级状态，不能只依靠客户端缓存或隐藏按钮。CampusActor.userId只能来自服务端会话，accountSchoolId是账号原有学校信息，不能替代授权。target.schoolId、collegeId应从数据库赛事/学院解析，不信任客户端声称的归属。

## 写入与并发契约

- name去掉首尾空格后1—100字；高校/学院code1—50字，校号全局唯一、学院代码校内唯一；duty最多500字。ID不可修改，停用替代删除。
- 成员用户必须存在；负责人collegeId必须属于schoolId；赛事归属schoolId必须等于既有Contest.schoolId。
- 校级管理员只能管理本校学院负责人，不能调用“管理负责人”来创建平台/校级角色；此类创建必须分别校验专用能力“管理平台管理员”“管理校级管理员”。
- 更新高校、学院、成员使用ConcurrencyHeaders.ifMatch；数据库etag不匹配返回409，输入错误422，未登录401，无权限403，范围内不存在404。前端保留输入，不静默覆盖。
- 首次分配赛事使用CampusAssignmentLock.expectedEtag=null，表示必须仍未分配；已有分配必须携带其当前etag。不允许用null覆盖已存在分配。
- 授权、归属写入、etag更新和CampusAuditLog应处于同一事务；服务端生成ID、etag、assignedBy/At和操作时间。前端不能指定审核人、状态或权限结果。
- 负责人不能更改赛事维护归属；重新分配不改变赛事ID、收藏、反馈和当前公开版本。是否可编辑仍须同时检查既有版本状态（草稿/驳回）、etag和来源规则。
- 负责人提交后只读；校级管理员审核通过才切换学生端公开版本，驳回保留旧版本。CampusPermissions不能替代原有版本/公开/来源规则。
- 后续GET树/列表要按有效授权过滤；不能返回全平台快照让前端过滤。分页page>=1，pageSize1—100；keyword最多200字。

## Repository与下一阶段HTTP映射（尚未实现）

| 接口方法 | 计划路径 | 权限依据 |
|---|---|---|
| listSchools/getSchoolTree | GET /manage/campus/schools；GET /manage/campus/schools/:id/tree | 平台全部；校级本校；负责人仅本人必要树信息 |
| createSchool/updateSchool | POST /manage/campus/schools；PUT /manage/campus/schools/:id | 管理高校 |
| listColleges/createCollege/updateCollege | /manage/campus/colleges | 本校学院范围；写入校验管理学院 |
| listMembers/createMember/updateMember | /manage/campus/members | 读取按授权裁剪；写入按目标角色选能力 |
| getMaintenance/assignMaintenance | /manage/campus/contests/:id/maintenance | 查看维护赛事 / 分配赛事 |

两端调用CampusRepository；HTTP实现和管理界面在下一步提供。学院负责人仅获取自身必要信息，不得读取其他人员账号资料。接口已固定DTO/枚举、归属、并发和错误规则，页面不得自行推断权限。

## 迁移兼容边界

002迁移新增独立表，不重写旧User、Contest、Organization、版本、目录授权凭据、收藏、反馈。首次迁移将旧学校登记为高校：HENU名称河南大学且启用；其他旧校号先标为“待登记高校（校号）”且停用。首次迁移仅将已有旧管理员登记为对应学校的校级管理员，不自动授予任何平台角色。重复迁移不再转换后来新增的旧角色账号，以免隐式扩权。

没有可信学院归属的赛事不写ContestMaintenance，视为待分配。首次新增高校管理页面时，需要明确配置平台管理员授权；当前数据库未自动赋予此权限。

本阶段不等于多校推广上线：后续仍需管理API/页面接入、学生学校入口、负责人登录/维护入口、通用目录规则与学校文案改造，才能对其他高校开放。
