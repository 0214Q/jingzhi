# 登录交付与验收

1. 启动进入登录页，输入 student / demo123，成功进入首页。
2. 空账号或错误密码显示错误；连续点击不会重复登录。
3. 首页及赛事列表的“我的”入口显示当前学生身份，退出回登录页并清空路由历史。
4. 首页、列表、详情和我的页面进入时检查会话，过期返回登录。
5. 使用 admin / demo123 在学生端登录会被拒绝。后台仍沿用前一步演示实现，后台登录将在后续实现。

SessionService 不向页面暴露 Token，身份快照复制数组以避免外部修改。authorizationValue 统一生成 tokenType + 空格 + token，拒绝 Token 自带前缀。Web HTTP 提供 configureAuthorization 注入点，未来接入真实 AuthRepository 后使用；目前没有真实服务端认证或持久化凭据存储。

本步增加 9 项登录测试，连同前序 31 项共 40 项。Web 构建用于共享 TypeScript 验证，不等同于 ArkTS/设备验证。已有 preview 目录为前序静态页面参考，不是本步登录运行截图。
