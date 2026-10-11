# 竞知统一工程

手机端、后台网页、唯一后端与真实目录数据库已放在一个项目中。此包使用用户上传的 Jingzhi(2).zip 手机工程和 jingzhi-step14(1).zip 后端工程合并；不修改UI。

## 目录

- student-app：你的已联调DevEco工程；DevEco打开这个子目录。
- admin-web：管理网页，包含目录编辑、审核和反馈处理。
- backend：唯一后端；data/jingzhi.sqlite 为当前真实数据库。
- shared：共享契约和业务代码。
- scripts：统一启动、手机接口配置和原有检查工具。
- start-dev.cmd：Windows双击启动入口。

两端始终访问同一个backend，使用同一个数据库。合并不意味着手机自动知道电脑地址，也不会自动完成真机签名。

## 第一次使用（Windows）

1. 解压到一个新目录，例如 C:\Users\16966\Desktop\jingzhi-unified。不要覆盖旧Jingzhi或旧jingzhi-step14，旧项目可保留作备份。
2. 停止旧项目中运行的8787后端和5173网页（在原窗口Ctrl+C）。
3. 确认已经安装Node.js 24.x，node -v显示v24开头。
4. 双击根目录start-dev.cmd。
5. 第一次自动在admin-web安装依赖（需要联网）；之后每次启动会构建后端并启动两项服务。
6. 等出现Ready，浏览器自动打开 http://localhost:5173/。如果没有打开，手动访问。
7. 保持这个窗口运行。按Ctrl+C可停止两项服务，随后关闭窗口。不要直接强制关闭窗口，以便数据库正常关闭。

也可以在根目录PowerShell执行：

```powershell
npm run dev
```

无需先运行根目录npm install；根目录没有额外运行依赖。启动器会检查Node版本、数据库存在和8787/5173端口；冲突时停止，不会结束其他工程的进程。启动器数据库固定为本项目backend/data/jingzhi.sqlite，不受旧DB_PATH影响。不自动导入、发布或播种演示数据。

## 真机/模拟器运行

1. DevEco Studio打开本项目student-app目录，不是整个jingzhi-unified目录。
2. 同步工程；按本机SDK环境配置，配置自己的调试签名（分享包已移除上传工程中的个人签名配置与本机SDK路径）。不要覆盖回带个人签名凭据的旧build-profile。
3. 手机与运行后端的电脑连接同一网络。
4. 用ipconfig查实际Wi-Fi/网线IPv4。启动窗口也列出网络候选地址，其中可能有虚拟网卡，要选择手机可访问的地址。
5. 手机浏览器访问 http://电脑IP:8787/health，确认status为ok。必要时允许Windows防火墙的Node.js/TCP8787入站，不要关闭整个防火墙。
6. 在项目根目录PowerShell执行以下命令（替换示例IP）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-phone-api.ps1 -BaseUrl 'http://192.168.1.105:8787'
```

该脚本备份并只替换student-app/entry/src/main/ets/services/ApiConfig.ets中的地址，不修改入口和网络实现。之后在DevEco重新编译安装。也可以直接编辑该文件；当前保留你原来的10.16.82.242地址，在你原网络中可继续使用。

7. 在DevEco选择已连接设备并运行。使用现有数据库中的学生账号；管理员网页登录使用现有管理员账号。以当前密码为准。

## 团队共用“一个后端”的区别

- 队友自己启动本项目：得到一份独立数据库副本，数据不会自动同步到你的电脑。
- 多个人共享同一份数据：只在一台大家都能访问的电脑/服务器启动backend，所有手机指向该地址。异地通常需要公网后端。

本包实现一个项目内唯一后端、一键启动；尚未替你部署公网服务器。

## 常用命令

在项目根目录执行：

```powershell
npm run dev
npm run build
npm test
```

build需先完成依赖安装，可以先启动一次项目。test使用独立临时数据库，不修改真实数据库。

备份真实数据库，在backend目录运行（先停止服务更容易操作）：

```powershell
cd .\backend
$backupFile = ".\data\backups\manual-$(Get-Date -Format 'yyyyMMdd-HHmmss').sqlite"
npm run backup -- $backupFile
```

不要执行npm run seed:demo，当前已有184条真实公开目录。

## 保留与验证

- 原数据库完整性检查ok，catalog_imports184条，公开赛事184条。已有账号、收藏、反馈、版本和审核记录保留。
- 保留手机端HTTP接入、PATCH兼容POST修改和目录文案；未应用按钮美化。
- 移除依赖缓存、编译缓存、旧代码备份、旧数据库备份、本机路径和个人签名配置，backend/build保留且启动可重新生成。签名需本机配置，IDE/依赖缓存自动重建。
- 管理网页TypeScript/Vite生产构建通过；后端上传工程中的15项测试通过；页面边界及24个非UI原生源文件已知规则检查通过。
- 统一启动在当前环境验证两个服务就绪、重复端口保护和Ctrl+C停止两项服务。测试环境不提供网卡枚举，集成测试仅以本地回环替代网卡枚举；实际LAN地址显示需在Windows确认。
- Windows.cmd/PowerShell、DevEco实际编译和真机签名未在当前环境执行，需按上述步骤本机验收。

原子项目内旧文档可能包含旧的分目录路径；统一工程启动以本README为准。迁移后不要再启动旧目录服务，否则端口冲突或看到旧数据。
