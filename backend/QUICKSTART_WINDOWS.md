# Windows HTTP验收

先在backend终端执行npm run seed:demo（只执行一次），再npm start。下面命令放到另一个PowerShell终端逐项运行。

## 1. 检查服务

```powershell
$base = 'http://127.0.0.1:8787'
Invoke-RestMethod "$base/health"
```

返回code=200，data.status=ok。

## 2. 学生登录并收藏

```powershell
$studentBody = @{ account = 'student'; password = 'demo123' } | ConvertTo-Json
$studentLogin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $studentBody
$studentHeaders = @{ Authorization = "Bearer $($studentLogin.data.token)" }
Invoke-RestMethod -Uri "$base/contests" -Headers $studentHeaders
$favoriteBody = @{ contestId = 'DEMO-1' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/favorites" -Headers $studentHeaders -ContentType 'application/json' -Body $favoriteBody
Invoke-RestMethod -Uri "$base/favorites" -Headers $studentHeaders
```

重复收藏不增加记录。令牌仅加一次Bearer，DTO位于响应data内。

## 3. 提交反馈

```powershell
$feedbackBody = @{ contestId = 'DEMO-1'; type = 'information-correction'; desc = 'Please verify the source notice.' } | ConvertTo-Json
$submitted = Invoke-RestMethod -Method Post -Uri "$base/feedback" -Headers $studentHeaders -ContentType 'application/json' -Body $feedbackBody
$feedbackId = $submitted.data.id
```

示例使用英文内容以避免Windows PowerShell 5.1请求字符串的中文编码差异；type契约是string，页面接入后使用中文分类。

## 4. 管理员处理，学生读取结果

```powershell
$adminBody = @{ account = 'admin'; password = 'demo123' } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $adminBody
$adminHeaders = @{ Authorization = "Bearer $($adminLogin.data.token)" }
Invoke-RestMethod -Uri "$base/manage/feedback" -Headers $adminHeaders
$handledBody = @{ status = '已处理'; note = 'Verified the source notice.' } | ConvertTo-Json
$handledBytes = [System.Text.Encoding]::UTF8.GetBytes($handledBody)
Invoke-RestMethod -Method Patch -Uri "$base/manage/feedback/$feedbackId/handle" -Headers $adminHeaders -ContentType 'application/json; charset=utf-8' -Body $handledBytes
Invoke-RestMethod -Uri "$base/feedback/mine" -Headers $studentHeaders
```

学生读取data.list中自己的处理说明。这是同一真实数据库上的HTTP往返，不是之前两个客户端独立Mock。

## 5. 审核一条待审赛事

```powershell
$pending = Invoke-RestMethod -Uri "$base/manage/review/pending" -Headers $adminHeaders
$row = $pending.data.list[0]
Invoke-RestMethod -Uri "$base/manage/contests/$($row.contestId)/versions/$($row.versionId)" -Headers $adminHeaders
$approveBody = @{ versionId = $row.versionId; etag = $row.etag } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/manage/review/$($row.contestId)/approve" -Headers $adminHeaders -ContentType 'application/json' -Body $approveBody
Invoke-RestMethod -Uri "$base/contests/$($row.contestId)" -Headers $studentHeaders
```

第一次通过后公开版本应更新。重复使用旧etag审批返回409，PowerShell会将非2xx响应显示为错误，这是预期的冲突保护。

## 6. 验证重启持久化

服务终端Ctrl+C退出，再npm start。另一终端再次读取favorites及feedback/mine，之前记录应保留；会话未过期时旧令牌仍然有效。

## 7. 退出登录

```powershell
Invoke-RestMethod -Method Post -Uri "$base/auth/logout" -Headers $studentHeaders -ContentType 'application/json' -Body '{}'
Invoke-RestMethod -Uri "$base/auth/me" -Headers $studentHeaders
```

最后一条应返回401，表示旧令牌已失效。
