param([Parameter(Mandatory=$true)][string]$FilePath,[string]$Account='admin',[string]$SchoolId='HENU',[string]$TargetContestId,[string]$ApiBase='http://127.0.0.1:8787',[switch]$Recognize,[switch]$AllowExternalOcr)
$ErrorActionPreference='Stop'
$source=(Resolve-Path -LiteralPath $FilePath).Path
if(!(Test-Path -LiteralPath $source -PathType Leaf)){throw 'Select an existing PDF, DOCX or image.'}
$types=@{'.pdf'='application/pdf';'.docx'='application/vnd.openxmlformats-officedocument.wordprocessingml.document';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.png'='image/png';'.webp'='image/webp'}
$type=$types[[IO.Path]::GetExtension($source).ToLowerInvariant()]
if(!$type){throw 'Unsupported file extension.'}
$size=(Get-Item -LiteralPath $source).Length
if($size -lt 1 -or $size -gt 20MB){throw 'File size must be 1 byte to 20 MiB.'}
$sha=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
$base=$ApiBase.TrimEnd('/')
$secure=Read-Host 'Enter your current management password (hidden)' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$token=$null
try{
 $password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 $login=Invoke-RestMethod -Uri ($base+'/auth/login') -Method Post -ContentType 'application/json; charset=utf-8' -Body (@{account=$Account;password=$password}|ConvertTo-Json -Compress) -TimeoutSec 20
 $password=$null
 $token=$login.data.token
 $headers=@{Authorization=('Bearer '+$token)}
 $target=$null;if($TargetContestId){$target=$TargetContestId}
 $uploadInput=@{schoolId=$SchoolId;targetContestId=$target;originalName=[IO.Path]::GetFileName($source);declaredMediaType=$type;byteSize=$size;sha256=$sha;idempotencyKey=[guid]::NewGuid().ToString()}
 $ticket=(Invoke-RestMethod -Uri ($base+'/manage/import-files') -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ($uploadInput|ConvertTo-Json -Compress) -TimeoutSec 20).data
 Write-Host ('Upload ticket: '+$ticket.fileId)
 Invoke-RestMethod -Uri ($base+$ticket.uploadPath) -Method Put -Headers $headers -ContentType 'application/octet-stream' -InFile $source -TimeoutSec 60|Out-Null
 $file=(Invoke-RestMethod -Uri ($base+'/manage/import-files/'+$ticket.fileId+'/complete') -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body (@{expectedSha256=$sha;expectedByteSize=$size}|ConvertTo-Json -Compress) -TimeoutSec 20).data
 Write-Host ('Uploaded: '+$file.fileId+' | '+$file.detectedMediaType+' | pages: '+$file.pageCount)
 if($Recognize){
  $capabilities=(Invoke-RestMethod -Uri ($base+'/manage/import-capabilities?schoolId='+[uri]::EscapeDataString($SchoolId)) -Headers $headers -TimeoutSec 20).data
  if($file.requiresOcr -and $capabilities.externalOcrEnabled -and !$AllowExternalOcr){throw 'External OCR is configured. Review the data transfer, then explicitly add -AllowExternalOcr if intended.'}
  $job=(Invoke-RestMethod -Uri ($base+'/manage/import-jobs') -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body (@{schoolId=$SchoolId;targetContestId=$target;fileIds=@($file.fileId);allowExternalOcr=[bool]$AllowExternalOcr;idempotencyKey=[guid]::NewGuid().ToString()}|ConvertTo-Json -Compress) -TimeoutSec 20).data
  for($i=0;$i -lt 180;$i++){
   if($job.status -notin @('排队中','识别中')){break}
   Start-Sleep -Milliseconds 500
   $job=(Invoke-RestMethod -Uri ($base+'/manage/import-jobs/'+$job.jobId) -Headers $headers -TimeoutSec 20).data
  }
  Write-Host ('Job: '+$job.jobId+' | '+$job.status)
  if($job.status -eq '待确认'){
   $result=(Invoke-RestMethod -Uri ($base+'/manage/import-jobs/'+$job.jobId+'/result') -Headers $headers -TimeoutSec 20).data
   Write-Host ('Candidates: '+@($result.candidates).Count+' | evidence: '+@($result.evidence).Count+' | issues: '+@($result.issues).Count)
   Write-Host 'Recognition only. No draft, submission or publication was created.'
  }elseif($job.failureMessage){Write-Host $job.failureMessage}
 }
}finally{
 $password=$null
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
 if($token){try{Invoke-RestMethod -Uri ($base+'/auth/logout') -Method Post -Headers @{Authorization=('Bearer '+$token)} -ContentType 'application/json' -Body '{}' -TimeoutSec 10|Out-Null}catch{}}
 $token=$null;$headers=$null
}
