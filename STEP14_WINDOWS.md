# 第14步：Windows / DevEco 联网与验收

## 1. 保留并启动数据库

先停止旧后端，使用第13步备份命令备份原库。更新原backend目录的src、build、scripts、tests和package.json，保留data。或用新目录并将DB_PATH指向旧库绝对路径。只保留一个后端进程。

在backend目录使用PowerShell（Node24.x）：

```powershell
node --version
$env:DB_PATH = 'C:\你的实际路径\backend\data\jingzhi.sqlite'
$env:HOST = '0.0.0.0'
npm start
```

DB_PATH替换为真实路径；原目录使用默认data位置可省略。只有首次空开发库才在启动前执行npm run seed:demo，生成student/editor/organizer/admin，密码demo123。已有库不要运行seed。backend无需npm ci；.env.example不会自动加载。

电脑浏览器访问http://127.0.0.1:8787/health，确认正常。

## 2. 管理端

另开PowerShell，进入admin-web：

```powershell
npm ci
npm run dev
```

打开http://localhost:5173，用项目管理员账号登录。默认API为http://127.0.0.1:8787。更改时复制.env.example到.env.local，修改VITE_API_BASE_URL，重启Vite。固定5173端口，被占用先停止旧进程；更改主机/端口时同步backend的CORS_ORIGINS。刷新需重新登录，数据库记录保留，不再自动登录/生成示例反馈。

## 3. DevEco增量合并

保留C:\Users\16966\Jingzhi的签名、构建配置、module.json5、EntryBackupAbility及已修复ArkTS页面，不覆盖整工程。

复制student-app/entry/src/main/ets中的repository/HttpProtocol.ets、HttpRepositories.ets、ArkHttpTransport.ets以及services/ApiConfig.ets到现有对应目录。

EntryAbility.ets参考交付版合并：MockRuntime换成ArkHttpTransport和HttpAuth/Contest/Favorite/FeedbackRepository，配置原SessionProvider、Repositories、InteractionProvider。保留自己的其他生命周期逻辑。DTO、接口、SessionService应与第13步契约一致。Login/My仅合并联网提示文本。

在现有module.json5的module对象中添加网络权限；已有数组时追加缺失项目，保留其他权限和能力：

```json
"requestPermissions": [
  { "name": "ohos.permission.INTERNET" }
]
```

## 4. 设备访问地址

电脑执行ipconfig，取当前适配器IPv4。services/ApiConfig.ets修改为实际地址，例如：

```typescript
export const API_BASE_URL: string = 'http://192.168.1.20:8787';
```

替换示例IP。127.0.0.1指App运行设备，0.0.0.0是监听地址，两者不能作为真机访问电脑的地址。真机和电脑需能互访；模拟器使用其实际能访问电脑的地址，不假设固定网关。

先用设备浏览器访问http://电脑IP:8787/health。失败时检查HOST、网络隔离、VPN及防火墙，只在开发私有网络放行Node或TCP8787。然后DevEco同步、编译、运行。NetworkKit类型报错时提供完整日志和SDK版本；TypeScript检查不能代替ArkTS编译。

## 5. 跨端验收

| 操作 | 验收结果 |
| --- | --- |
| App登录student并收藏公开赛事 | 收藏可查，后端重启并重新登录后仍在 |
| App提交带独特文字的反馈 | Web管理员刷新反馈列表能看见同一记录 |
| Web处理反馈并填写回复 | App重新进入我的反馈可看见结果 |
| Web审核通过待审赛事 | App重新加载首页和列表后公开版本可查，详情可打开 |
| 旧etag重复审核 | 返回409；刷新详情，不覆盖他人更新 |
| 正常联网退出 | 界面退出，后端旧令牌失效 |
| 停止后端再读取 | 连接失败，不回退Mock |
| 后端重启再登录 | 收藏、反馈、审核数据保留 |

开发库可用待审演示赛事DEMO-17。自动测试覆盖编辑派生、修改、提交、审核以及学生读取新公开版本；当前Web主要为审核工作台，完整编辑页面属于后续功能。没有跨端自动推送，审核和处理后需重新请求。演示记录不是实际学校通知。

## 6. 自动检查

先在admin-web安装依赖，再在项目根目录执行：

```powershell
python scripts/sync-http.py --check
python scripts/check-boundaries.py
python scripts/test-repositories.py
python scripts/test-native-services.py
node scripts/check-arkts-known-rules.cjs
```

backend目录执行npm test，admin-web执行npm run build。客户端联调测试依赖admin-web的TypeScript；后端服务启动不需要该依赖。NetworkKit传输从TypeScript原生副本测试排除，必须DevEco及设备验收。下一阶段为正式服务器、HTTPS、生产账号和备份部署。
