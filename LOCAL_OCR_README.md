# 竞知本地 OCR

本次补齐管理端“通知文件导入”的本地识别：图片和扫描 PDF 由后端所在电脑的 CPU 识别，文字 PDF/DOCX 继续提取文字层。识别结果仍须人工核对，再转草稿、提交审核。

## Windows 首次启用

需要现有 Node.js 24，以及 **64位 Python 3.12**（也支持3.10/3.11）。Python安装时勾选 Add python.exe to PATH，完成后重新打开PowerShell。官方下载：https://www.python.org/downloads/windows/

1. 停止原工程：在正在运行的窗口按 Ctrl+C。
2. 推荐使用单独提供的 `jingzhi-local-ocr-patch.zip` 更新现有工程，按补丁包说明执行。完整工程包包含上传时的数据库快照，不能用旧快照覆盖正在使用的数据库。
3. 在现有工程根目录执行：

```powershell
cd "$env:USERPROFILE\Desktop\jingzhi-unified"
npm run ocr:setup
npm run ocr:check
npm run dev
```

`ocr:setup` 首次需要联网安装依赖，使用独立的 `backend/.venv-ocr`，模型随 rapidocr 安装包一起安装。它会先实际加载模型并运行CPU推理，通过后才将 `backend/.env` 中的模式设置为 `local-ocr`；其他配置保留，原配置文件另行备份。后续启动只需 `npm run dev`。

如果Python安装在自定义位置：

```powershell
$env:JINGZHI_PYTHON = 'C:\你的路径\python.exe'
npm run ocr:setup
```

`ocr:check` 成功时显示“OCR检查通过”。安装过程若网络失败，修复网络后可重复执行安装命令。

## 验收

登录管理端，打开通知文件导入，上传 JPG/PNG/WebP 通知图片或扫描 PDF。页面应显示“已启用本地OCR”，创建任务不需要勾选外部发送同意。任务最终进入“待确认”，核对赛事名称、日期和原图。原先因缺少 OCR 失败的任务，可在材料未过期且重试次数未耗尽时点重试，或重新上传。

补丁内 `backend/tests/fixtures/ocr-title.png`、`ocr-scan.pdf` 和 `ocr-mixed.pdf` 可用于验证。样例只含标题，用于识别验收；请勿将其作为正式赛事发布。

纯空白图片应提示“无可识别文本”；OCR 未安装或启动失败会给出安装/检查提示，不会生成演示内容。

## 运行与限制

- 本地指运行后端的电脑/服务器，不是每个管理员的浏览器或学生手机。文件会从管理端上传到你自己的后端，再由本地引擎处理。
- 无第三方 OCR 请求、API 密钥或按次接口费用。Python工作进程禁用网络连接，只加载已安装的本地模型；依赖安装、浏览器、原有业务请求仍按原工程方式运行。
- 使用 RapidOCR 3.9.2 + ONNX Runtime 1.24.4 CPU，引擎每个任务加载一次，同一任务多页复用。暂未支持跨任务常驻模型。
- 默认每任务最多10个需要OCR的页面，总材料仍遵循原有100页/40MiB限制。文字页不计入OCR额度。需要时在 `backend/.env` 设置 `IMPORT_OCR_MAX_PAGES=30`（最大30），然后重启后端；也可以拆分文件。
- 默认识别时限5分钟，耗时取决于CPU、页数和清晰度。可设置 `IMPORT_OCR_TIMEOUT_MS`，允许1000至600000毫秒。取消任务、停止后端、超时会终止工作进程并清除临时渲染图片。
- 文字层少于10个非空白字符的页面进入OCR；存在不完整文字层的混合排版、复杂表格、印章遮挡、倾斜模糊图片仍可能漏识别。当前输出按文字行供现有字段规则处理，不还原表格结构。
- OCR候选保持低置信度并标记“未核对”；所有赛事日期、资格等仍须人工核对。
- 切换到其他电脑或服务器后需重新安装依赖，不应复制 Windows 的虚拟环境到 Linux。
- 如需停用，在 `backend/.env` 中设置 `IMPORT_OCR_MODE=local` 并重启；此时仅提取文字层。

## 开发验证

```powershell
npm run build
npm test
npm run test:ocr
```

已在 Linux、Node.js 24.19、Python 3.12 环境完成管理端/后端构建和81项测试，包括真实中文OCR及上传接口。Windows脚本已实现但尚未在你的电脑上执行，最终以本机 `ocr:setup`、`ocr:check` 和上传验收为准。未安装OCR时，测试中的真实识别项会跳过；安装后再运行会实际执行。

参考：https://github.com/RapidAI/RapidOCR
