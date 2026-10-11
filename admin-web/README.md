# 竞知管理员审核端

运行 npm ci 后 npm run dev；打开终端显示的地址，admin / demo123登录。

赛事审核支持待审分页/搜索、版本对比、内部审计、通过和带原因驳回。公示审核支持待审查询和审核；反馈处理支持状态筛选、填写学生可见说明。

npm run build验证TypeScript/Vue并生成dist；npm run preview预览构建结果。当前为内存Mock，刷新重置，未部署后端。学生端Mock进程与此端独立，联调规则通过共享MockStore的自动测试验证。
