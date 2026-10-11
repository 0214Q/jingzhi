param([Parameter(Mandatory=$true)][string]$BaseUrl)
$ErrorActionPreference='Stop'
$uri=$null
if(![Uri]::TryCreate($BaseUrl,[UriKind]::Absolute,[ref]$uri) -or $uri.Scheme -notin @('http','https') -or $uri.UserInfo -or $uri.Query -or $uri.Fragment -or $BaseUrl -match "['\r\n]"){throw 'Use an HTTP/HTTPS base URL without credentials, query or fragment.'}
$root=Split-Path $PSScriptRoot
$file=Join-Path $root 'student-app\entry\src\main\ets\services\ApiConfig.ets'
$utf8=New-Object System.Text.UTF8Encoding($false)
$old=[IO.File]::ReadAllText($file,$utf8)
$pattern="export const API_BASE_URL: string = '[^']*';"
if([regex]::Matches($old,$pattern).Count -ne 1){throw 'ApiConfig export not recognized; file unchanged.'}
$new=[regex]::Replace($old,$pattern,[System.Text.RegularExpressions.MatchEvaluator]{param($m) "export const API_BASE_URL: string = '"+$BaseUrl.TrimEnd('/')+"';"})
$backup=Join-Path $root ('local-backups\ApiConfig-'+(Get-Date -Format 'yyyyMMdd-HHmmss-fff')+'.ets')
New-Item -ItemType Directory -Force -Path (Split-Path $backup)|Out-Null
[IO.File]::WriteAllText($backup,$old,$utf8);[IO.File]::WriteAllText($file,$new,$utf8)
Write-Host "Phone API updated: $BaseUrl. Rebuild and install in DevEco."
