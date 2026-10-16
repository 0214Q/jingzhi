# 文件接收、任务存储和识别服务——第二步

2026-10-15。后端、共享HTTP客户端与管理网页上传/原文对照确认页已接入。页面使用与验收见admin-web/FILE_IMPORT_UI.md；本文件保留后端配置和API说明。

## 已实现的流程

1. 管理员/负责人按已有高校和赛事授权创建票据。
2. PUT上传原始字节（非base64 JSON、非multipart），限制20MiB，重新计算SHA-256；在独立worker中检查真实格式和内容。
3. complete后文件变为已接收，才能建立识别任务。
4. SQLite队列后台运行。文本PDF和DOCX本地提取，照片/扫描页通过显式配置的视觉OCR转录，再用保守规则生成候选、原文片段和问题。
5. 待确认结果持久化。前端逐字段/阶段人工确认后调用confirm，原子创建或派生普通草稿。导入不自动提交/审核/公开。
6. 同幂等键同请求返回同一结果；同键不同请求409；不同键再次确认同一任务也409。已有工作版本不覆盖。

004迁移新建import_files、import_jobs、import_job_files、import_draft_links、import_idempotency五张表，不改原用户、赛事、收藏、反馈及高校授权。文件私有保存于活动数据库旁的import-files目录（可用IMPORT_STORAGE_DIR指定绝对目录），数据库只存文件元数据和受限原文片段。

## 本地解析和限制

- PDF：使用pdfjs-dist，提取文字层，不访问PDF外部URL，不执行脚本；含JavaScript动作或嵌入文件拒绝接收；加密无法解析文件拒绝。
- DOCX：使用yauzl逐项读取，校验解压尺寸、条目数及压缩比，拒绝宏/嵌入可执行内容/实体声明；只抽取文档文字。每3000字符为稳定的规范化文本页，页面明确标为“并非Word打印页码”，没有声称还原Word排版。Word里的扫描图片尚不提取为OCR页，需另传图片或扫描PDF。
- JPEG/PNG/WebP：sharp验证格式、单帧和像素尺寸，最多2000万像素；云端OCR前压缩为受限PNG，扫描PDF单页渲染最多约200万像素。
- 单文件20MiB，每任务40MiB、100页；一份文档或最多10张图片。解析worker有256MiB JS堆上限和30秒超时（不是操作系统级沙箱或杀毒认证）。识别任务120秒总超时，外部OCR默认最多10页、可配置1—30页。
- 每账号每小时最多20个上传票据、同时最多3个排队/运行任务；每高校未过期临时材料额度200MiB。已引用原件需另按长期存储规划。
- 单个上传未成功可重传同票据；声明类型与实际类型不一致需新建正确票据。无引用失败票据可DELETE清理。一次识别最多100个候选/问题，字段始终需人工检查。

本地提取规则是辅助定位：可识别部分中文标题、届次、主办方、HTTPS来源及明确日期，不保证复杂表格、多个赛事、横排海报、跨行区间或复杂时区自动理解正确。范围含糊时生成阶段候选或保留未知，不作语义推测；识别到多项赛事应拆任务。日期含缺失年份/时区/上下午含义不确定时要求人工填写，月份不会变为具体某一天。所有候选置信度低于0.85，默认需要原文核对说明。

## OCR配置

默认IMPORT_OCR_MODE=local：普通文字PDF/DOCX可识别；照片或扫描页明确失败并提示配置OCR，不返回演示文字。不会把材料发往第三方。

后端主进程启动时读取backend/.env（仅本地，不提交到仓库、不打包分享）。参考.env.import.example；若已有.env，只追加IMPORT_项，不覆盖其他配置：

```dotenv
IMPORT_OCR_MODE=openai-compatible
IMPORT_OCR_ALLOW_EXTERNAL=true
IMPORT_OCR_ENDPOINT=https://你的服务商HTTPS地址/compatible-mode/v1/chat/completions
IMPORT_OCR_MODEL=你的控制台支持的视觉模型名称
IMPORT_OCR_API_KEY=你的私有密钥
IMPORT_OCR_MAX_PAGES=10
```

适配器使用OpenAI兼容Chat Completions图片消息协议，支持按该协议接收base64图片的服务。视觉能力、模型名、接口地址、区域、额度由所选服务商账户决定，不存在可通用的免费密钥。配置示例不代表已开通服务。服务商密钥仅后端读取，不发给网页或学生端。

除了服务器显式启用，含扫描页/照片的任务还必须提交allowExternalOcr=true，表示本次材料已确认发给配置的服务；否则拒绝且不调用OCR。GET /manage/import-capabilities只返回是否启用、模型名和限额，不返回密钥或地址。PowerShell测试需要显式加-AllowExternalOcr。即使任务排队后服务器配置改变，未确认外发的任务也不会自动外发。

不自动重试外部服务请求，防止重复计费；网络失败、429、超时或结果截断会使任务失败。手动重试最多3次，可能再次按服务商规则计费。已经成功的前几页也可能计费。通过“只转录原文”的提示请求OCR，结果仍可能错字/幻觉，所以只形成低置信度候选，不视作官方事实。

核对协议的官方文档：
- https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions
- https://www.alibabacloud.com/help/en/model-studio/qwen-vl-compatible-with-openai
- https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html
- https://github.com/thejoshwolfe/yauzl
- https://sharp.pixelplumbing.com/api-constructor/

尚未使用用户真实OCR账户、密钥或真实照片调用第三方；已通过替身接口测试协议、图片传输、失败分支及低置信度标记。

## 权限、私有访问和生命周期

校级管理员新建本校任务；负责人仅给已分配赛事上传和导入。文件/任务访问、轮询、下载、确认、重试、取消每次重新鉴权。学生、无有效授权、跨校、已撤销授权均拒绝；不把学生浏览高校当管理权限。

文件ID随机生成，不使用原文件名拼磁盘路径。下载需Bearer权限，作为附件返回，带nosniff和sandbox。文件原件、OCR文本、结果证据都不是公开学生接口。

任务首次绑定目标。补充已有赛事要求当前公开etag匹配，且没有草稿/驳回/待审工作版，不可覆盖原编辑进度。自动生成的描述性主办单位仅记录人工确认的来源名，标记未认证、owners为空，不赋予组织账号权限。

后台每5秒检查队列/到期。未完成任务和无已转草稿引用的材料72小时到期后清理原件，保留必要任务元数据；取消任务丢弃晚到结果。已转草稿的原材料被保留，不受临时TTL自动删除，DELETE有引用文件返回409。失败票据和取消任务的材料不自动转成公开附件。

重启后排队任务继续；识别中断任务标失败，不自动重复外部请求；已完成结果/草稿关联保留。任务确认、版本、原件关联和幂等响应在同一SQLite事务提交；测试注入中途失败时所有草稿更改回滚。

当前为一个Node后端进程管理一个SQLite库，不支持多个实例同时启动队列；生产多实例需要独立租约/worker协调，不能直接复制进程。

## HTTP API

沿用code/message/data/traceId信封。完整签名见shared/ImportRepository.ts和HttpImportRepository.ts。

|方法|路径|用途|
|---|---|---|
|GET|/manage/import-capabilities?schoolId=HENU|格式、限额、OCR模式|
|POST|/manage/import-files|JSON创建上传票据|
|PUT|/manage/import-files/:fileId/content|application/octet-stream原始二进制|
|POST|/manage/import-files/:fileId/complete|JSON核对大小/摘要|
|GET|/manage/import-files/:fileId|文件元数据|
|GET|/manage/import-files/:fileId/content|受权限控制下载原件|
|DELETE|/manage/import-files/:fileId|删除无引用临时材料|
|POST|/manage/import-jobs|创建识别任务|
|GET|/manage/import-jobs?schoolId=HENU|当前权限分页查询|
|GET|/manage/import-jobs/:jobId|任务状态|
|GET|/manage/import-jobs/:jobId/result|候选、证据和重复提示|
|POST|/manage/import-jobs/:jobId/confirm|确认后转普通草稿|
|POST|/manage/import-jobs/:jobId/retry|失败任务手动重试|
|POST|/manage/import-jobs/:jobId/cancel|取消非终态任务|

CreateImportJobRequest增加可选allowExternalOcr逐任务外发确认；confirm仍使用第一步确认契约。对已有赛事须从确认页加载原payload、明确合并后传入。服务端保留已有附件和未显式修改的结构化适用对象/学分字段。草稿schedule不允许直接注入，阶段只能用stageConfirmations确认。没有公开来源的阶段保留在简介和内部证据，不冒充官方链接。

## 安装与本机验证

本包合并第一步契约，不必先装第一步小包。停止start-dev.cmd和DevEco任务，先按已有方法备份数据库。

```powershell
cd C:\Users\16966\Desktop\file-import-backend-patch
powershell -NoProfile -ExecutionPolicy Bypass -File .\apply-import-backend.ps1 -ProjectRoot 'C:\Users\16966\Desktop\jingzhi-unified'
# 看到Preview only且无冲突后，加-Apply
powershell -NoProfile -ExecutionPolicy Bypass -File .\apply-import-backend.ps1 -ProjectRoot 'C:\Users\16966\Desktop\jingzhi-unified' -Apply
cd C:\Users\16966\Desktop\jingzhi-unified\backend
npm ci
$env:DB_PATH = Join-Path (Get-Location) 'data\jingzhi.sqlite'
node src/migrate-file-import.cjs
# 确认预览已回滚，旧业务保持，再实际迁移
node src/migrate-file-import.cjs --apply
```

004迁移要求先有003；实际迁移前自动备份SQLite。不要重导原赛事或重新审核200条目录。npm ci需要网络下载依赖及对应Windows原生组件；Node24.x，一键启动也会检查缺失依赖并安装。当前环境只验证Linux，Windows预编译组件与PowerShell脚本需本机验收。

双击统一工程start-dev.cmd，健康接口应schemaVersion=4。可在管理端“文件导入”上传，也可用脚本拿一份无敏感信息、包含清楚文字的PDF或DOCX测试：

```powershell
cd C:\Users\16966\Desktop\jingzhi-unified
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-file-import.ps1 -Account admin -FilePath 'C:\你的目录\赛事通知.docx' -Recognize
```

脚本隐藏输入现有密码，不输出令牌，结束注销临时验证会话。输出Uploaded、Job状态、候选/证据/问题数量。仅生成识别任务，不生成赛事，不提交审核；人工确认请进入管理端“文件导入”打开该任务。负责人需额外指定-TargetContestId，且必须是已分配赛事。

照片/扫描件在配置OCR后用同一脚本，并在确认允许外发该材料时加-AllowExternalOcr。服务配置未完成时应明确失败，不应出现虚构结果。不要向聊天发送密码或API Key。

## 完整备份与恢复

有上传材料后，仅npm run backup生成SQLite不再是完整备份。停止服务，运行：

```powershell
cd C:\Users\16966\Desktop\jingzhi-unified\backend
$destination = '.\data\backups\with-import-files-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
node src/backup-import-state.cjs --output $destination
```

输出目录包含jingzhi.sqlite、import-files和manifest.json，源文件按摘要校验；目录已存在或有效原件缺失会拒绝完成，不覆盖备份。应连同私有材料妥善保存，不打包发给无权限的人。

恢复时停止服务，把备份SQLite恢复到实际DB_PATH，把import-files恢复到实际IMPORT_STORAGE_DIR（默认数据库旁）；用相同版本代码和依赖，再启动。不要只恢复其中一半。原件标识与版本引用保持不变。

## 验证覆盖

真实DOCX/PDF接收、真实格式校验、扫描照片未配置错误、私有下载、学校/负责人边界与撤销授权、任务落库及重启恢复、取消和晚到结果、确认幂等与事务回滚、已有工作版冲突、手动重试上限、外部OCR请求协议及逐任务确认、恶意PDF脚本/XML实体拒绝、完整备份以及共享HTTP客户端路径。

管理网页已接入；真实材料识别准确率、浏览器页面操作与完整人工审核仍须在本机验收。

## 管理页面新增查询

- GET /manage/import-files/:id/pages：带身份的原材料规范化文字页。复用下载的访问与到期检查；不返回磁盘路径。
- GET /manage/import-drafts/:versionId/origin：确认时保存的来源、逐字段/阶段决定、识别结果与原材料元数据。普通版本返回404；仅当前有效管理权限可读，不对学生开放。
- 证据textOrigin区分材料文字层与未核对OCR转录，不能把识别片段当作已认证的原文。
