> 此为第三步接口设计说明。第四步已注入 Mock，当前运行情况以 MOCK_GUIDE.md 为准。

# Repository 使用和实现约定

## 当前范围

8 组接口、50 个异步方法覆盖登录、公开赛事、草稿、审核、版本、公示、导入、附件、收藏、反馈和提醒。用户/组织/学校后台维护接口未在第三步加入；本次以第一批联调与赛事闭环为主，不声称覆盖接口 V2 全部端点。

页面 → services 中的 Provider → Repository 接口 → 后续 Mock/Http 实现。

Web 使用 services/repositories.ts；学生端使用 services/Repositories.ets。两端演示页点击“检查数据源”会经 Provider 调用 listPublished。当前未注入实现，页面会明确显示未配置提示；不返回伪造空列表、不发送网络请求。

下一步在应用启动入口（Web main.ts / ArkTS EntryAbility）创建实现并调用 contestRepositoryProvider.configure(repository)。页面不导入 MockRepository、HttpRepository 或 fetch。其他 Repository 已定义接口，使用时同样通过 services 注入；本步没有预设实现。

## 一致性

所有方法返回 Promise<业务DTO>；HTTP ApiResponse 包装由网络实现解包，页面不处理 code/data 外壳。失败统一抛 RepositoryError，保留 code、currentEtag、fieldErrors、traceId。

关键方法 listPublished/getPublicVersion 只读 publishedVersionId；getPublicAuditLog 只返回 PublicAuditLog；getInternalAuditLog 显式分开，权限在实现层校验。

updateDraft 是整体保存：请求中未传内容字段在后续实现里按整体保存规范处理，不暗自套用 PATCH；建议表单传全量当前内容，清空 nullable 字段显式传 null。草稿允许不完整，提交时按主体进行完整性检查。

updateDraft/deriveVersion/submitReview/restoreVersion 必须显式传 ConcurrencyHeaders.ifMatch，后续 HTTP 实现映射 If-Match。派生/恢复锁取来源版本 etag；审核使用请求体 etag。提交与审核完成后重新读取工作版本获取新 etag，不沿用旧值。

reviewApprove 只允许待审核版本并切换 publishedVersionId；reviewReject 保持驳回且旧公开指针不变。这里定义签名与约束，第四步才实现状态机。

公示 create 只产生草稿，submitReview 后才能由管理员 reviewApprove。update 的允许状态统一约定草稿/驳回，已发布内容需要派生版本；V2 公示派生端点未明确，暂不提供绕过审核的便捷写法，后续实现时补齐端点。

附件上传的 ArrayBuffer 由实现层组装 multipart；返回完整 Attachment 是 Repository 的业务返回，若服务端只返回 attachmentId/url，Http 实现需调用详情补全。导入 template 返回 FileResource，避免 UI 依赖浏览器 Blob；后续导入与下载实现负责控制文件大小。

反馈 handle 对应 PATCH。下架请求保留 V2 scope=全部/仅公示，不擅自加入聚合 etag（文档没有提供聚合锁）；赛事版本写操作仍需要 etag。

## 本步骤增加的 DTO

PageQuery、ManagedContestPage、PendingReviewItem/Page、ReasonRequest、RejectReasonRequest、UpdatePublicityRequest、FavoritePage、FeedbackFilter、HandleFeedbackRequest、NotificationFilter、UpdateNotificationSettings、UploadFile、FileResource、TakedownRequest/TakedownScope。

这些为第二步缺少的签名形状补充；不会改变已有 DTO 字段。PendingReviewItem.incompleteFields 支撑审核台缺材料列。接口 V2 未提供完整成功响应的端点，其返回类型是本项目补充约定，需后续后端同步采用。

## 验证与运行

```bash
python scripts/sync-contracts.py --check
python scripts/sync-repositories.py --check
cd admin-web
npm ci
npm run build
cd ..
python scripts/test-repositories.py
```

scripts/check-boundaries.py 防止页面直接引用网络/具体实现。shared/repository-check.ts 检查接口强制锁及公开字段隔离。tests/provider.test.ts 验证未配置提示和注入替换。当前没有 DevEco SDK，ArkTS 编译仍需本机验证。
