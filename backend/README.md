# 竞知真实后端与SQLite数据库（第十四步联网版）

使用Node.js 24.x，无第三方运行时依赖。交付包包含build目录，直接启动即可；没有自动生成演示账号或演示赛事。

## Windows本地启动（逐项执行）

1. 安装/切换到Node.js 24.x，在PowerShell执行 node --version 核对。
2. 在文件资源管理器进入本包 backend 文件夹，地址栏输入 powershell 打开终端。
3. 首次开发验收，显式执行 npm run seed:demo 初始化空数据库。它建立 student/editor/organizer/admin 四个演示账号，密码demo123及18条标记为演示的赛事。已有账号时拒绝重复初始化，不覆盖真实数据。
4. 执行 npm start。默认API地址 http://127.0.0.1:8787，数据库为backend/data/jingzhi.sqlite。
5. 另开终端按QUICKSTART_WINDOWS.md调用HTTP接口。本版学生App及Web启动入口已改用HttpRepository；跨端步骤见../STEP14_WINDOWS.md。
6. Ctrl+C退出，重新npm start，再查询先前的收藏/反馈，数据应仍然存在。不重复运行seed:demo。

不需要在DevEco工程目录运行npm命令；也不需要在backend执行npm ci（无依赖、没有package-lock）。重新生成build时需要完整包中admin-web已安装TypeScript，执行npm run build。

## 正式初始化

不运行seed:demo，空库启动仅自动建表。新账号通过CLI明确创建：

```powershell
$secret = Read-Host '新账号密码' -AsSecureString
$env:JINGZHI_NEW_USER_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
npm run user:add -- admin HENU 管理员
Remove-Item Env:JINGZHI_NEW_USER_PASSWORD
```

密码长度10至256字符；按需要创建学生、信息整理人员、主办方账号。账号、学校及角色由服务端创建，登录请求不能注入角色或学校。组织管理页面/接口尚未实现，正式创建主办方组织需后续管理功能，不要拿演示组织当正式单位。

## 数据和认证

用户、组织、赛事、版本、审计、公示、审核记录、收藏、反馈及会话各自建表，DTO完整字段以JSON保存在行内；学校、版本状态及账号等常用字段有独立列和索引。收藏(user_id,contest_id)唯一，关系启用外键。审查migrations/001_initial.sql可查看结构。

密码使用随机盐+scrypt哈希；登录返回随机令牌（不是mock-token，也不是JWT），数据库仅保存令牌SHA-256摘要。默认一小时到期，退出删除会话，重启不会丢失有效会话。请求身份从数据库会话解析，所有领域操作继续检查学校/角色/组织权限。

每个写请求在BEGIN IMMEDIATE事务中加载当前领域数据、校验权限和ETag、保存行并提交。进程内串行执行数据库操作，避免异步请求交叉进入同一事务；数据库并发写入由SQLite锁协调。失败回滚，审批冲突409。

领域规则从共享已测试代码构建，服务端DomainStore使用真实系统时间和UUID，不自动构造Mock数据。DemoSeeds仅由显式CLI用于开发。

## 配置与部署边界

.env.example为变量参考，不自动加载。可在PowerShell设置HOST、PORT、DB_PATH、CORS_ORIGINS、SESSION_TTL_SECONDS。默认只监听127.0.0.1；跨设备时后续按服务器部署与HTTPS入口配置，App不能用自身127.0.0.1访问电脑服务。

CORS只允许配置的精确来源，默认localhost/127.0.0.1的5173端口。登录按账号和来源限流；请求体最多256KiB，DTO严格校验未知字段及类型。错误返回traceId，500不回传内部异常。

本阶段实现37个HTTP方法映射（见API.md）。这是小规模、单实例SQLite后端：每次领域操作加载当前数据，写入更新实体并重建收藏等辅助集合；尚未做大规模SQL查询优化或集群部署。通知推送、导入文件、附件上传、AGC登录、账号自助注册/找回、组织管理不在本阶段范围。

## 备份与恢复

```powershell
npm run backup -- .\backups\jingzhi-backup.sqlite
```

使用SQLite VACUUM INTO生成一致性备份，目标文件必须不存在。恢复时停止服务，将备份复制到一个新的数据库路径，再设置DB_PATH并启动，不直接覆盖仍在运行的数据库或只复制WAL主文件。

## 验证

npm test：8项HTTP/SQLite集成测试，覆盖持久化重启、反馈往返、认证注销/过期、密码/令牌摘要、学校权限、并发收藏/审批、回滚、公示、CORS、限流和备份。原52项业务测试继续通过。未部署到用户服务器、未对学生App/Web完成HTTP联调。
