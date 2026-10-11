# 已实现的HTTP接口

统一返回ApiResponse：code为HTTP状态码，成功DTO在data，失败说明在message，错误细节在data，所有响应带traceId。无返回值操作返回200/data=null。
版本编辑/提交/派生、公示写入使用If-Match请求头；赛事审批etag位于请求体，沿用共享契约。

| Repository | 方法 | HTTP映射 |
| --- | --- | --- |
| AuthRepository | login | POST /auth/login |
| AuthRepository | logout | POST /auth/logout |
| AuthRepository | getCurrentUser | GET /auth/me |
| ContestRepository | listPublished | GET /contests |
| ContestRepository | getPublicVersion | GET /contests/:id |
| ContestRepository | getPublicAuditLog | GET /contests/:id/audit-logs |
| ContestRepository | getPublicity | GET /contests/:id/publicity |
| ContestRepository | getMonths | GET /contests/months |
| ContestRepository | listManaged | GET /manage/contests |
| ContestRepository | getManaged | GET /manage/contests/:id |
| ContestRepository | createDraft | POST /manage/contests |
| ContestRepository | updateDraft | PUT /manage/contests/:id/versions/:vid |
| ContestRepository | deriveVersion | POST /manage/contests/:id/versions |
| ContestRepository | submitReview | POST /manage/contests/:id/versions/:vid/submit |
| ContestRepository | reviewApprove | POST /manage/review/:id/approve |
| ContestRepository | reviewReject | POST /manage/review/:id/reject |
| ContestRepository | listPending | GET /manage/review/pending |
| ContestRepository | listVersions | GET /manage/contests/:id/versions |
| ContestRepository | getVersion | GET /manage/contests/:id/versions/:vid |
| ContestRepository | getInternalAuditLog | GET /manage/contests/:id/audit-logs |
| ContestRepository | restoreVersion | POST /manage/contests/:id/versions/:vid/restore |
| ContestRepository | takedown | POST /manage/contests/:id/takedown |
| ContestRepository | restorePublication | POST /manage/contests/:id/restore |
| PublicityRepository | create | POST /manage/publicity |
| PublicityRepository | update | PUT /manage/publicity/:id |
| PublicityRepository | submitReview | POST /manage/publicity/:id/submit |
| PublicityRepository | reviewApprove | POST /manage/review/publicity/:id/approve |
| PublicityRepository | reviewReject | POST /manage/review/publicity/:id/reject |
| PublicityRepository | withdraw | DELETE /manage/publicity/:id |
| PublicityRepository | listPending | GET /manage/review/publicity/pending |
| FavoriteRepository | listMine | GET /favorites |
| FavoriteRepository | add | POST /favorites |
| FavoriteRepository | remove | DELETE /favorites/:contestId |
| FeedbackRepository | create | POST /feedback |
| FeedbackRepository | listMine | GET /feedback/mine |
| FeedbackRepository | listManaged | GET /manage/feedback |
| FeedbackRepository | handle | PATCH /manage/feedback/:id/handle |

公开赛事接口沿用前序规则：需要登录；仅返回本校已发布快照，下架详情仍可只读查看。草稿/待审不会进入公开列表。

未实现的Repository组：Notification/Import/Attachment。本阶段没有这些页面的数据联调，不能把404当成已实现。
