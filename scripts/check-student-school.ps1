param([string]$Account='student',[string]$BaseUrl='http://127.0.0.1:8787')
$ErrorActionPreference='Stop'
$BaseUrl=$BaseUrl.TrimEnd('/')
$secure=Read-Host 'Enter the current student password (hidden)' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$token=$null
try {
 $password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 $body=@{account=$Account;password=$password}|ConvertTo-Json -Compress
 $login=Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
 $token=$login.data.token
 $headers=@{Authorization="Bearer $token"}
 $context=Invoke-RestMethod -Method Get -Uri "$BaseUrl/student/school-context" -Headers $headers
 $schools=Invoke-RestMethod -Method Get -Uri "$BaseUrl/student/schools?page=1&pageSize=100" -Headers $headers
 $context.data|ConvertTo-Json -Depth 6
 Write-Host "Selectable school total: $($schools.data.total)"
 if($context.data.selectedSchool){
  $contests=Invoke-RestMethod -Method Get -Uri "$BaseUrl/contests?page=1&pageSize=1" -Headers $headers
  Write-Host "Published contest total in selected school: $($contests.data.total)"
 }else{Write-Host 'School selection required. No public-data query performed.'}
} finally {
 if($token){try{Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/logout" -Headers @{Authorization="Bearer $token"} -ContentType 'application/json' -Body '{}'|Out-Null}catch{Write-Warning 'Temporary verification session could not be revoked; it will expire automatically.'}}
 $password=$null;$body=$null;$token=$null;$headers=$null
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
