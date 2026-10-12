param([string]$Account='admin')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$previous=Get-Location
try {
 Set-Location (Join-Path $root 'backend')
 $env:DB_PATH=Join-Path (Get-Location) 'data\jingzhi.sqlite'
 node src/bootstrap-platform.cjs --user $Account
 if($LASTEXITCODE -ne 0){throw 'Platform initialization check failed.'}
 $backupFile=".\data\backups\before-platform-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff').sqlite"
 npm run backup -- $backupFile
 if($LASTEXITCODE -ne 0){throw 'Database backup failed.'}
 $secure=Read-Host 'Enter the existing administrator password (hidden)' -AsSecureString
 $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try{$env:JINGZHI_BOOTSTRAP_PASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr);node src/bootstrap-platform.cjs --user $Account --apply;if($LASTEXITCODE -ne 0){throw 'Platform initialization failed.'}}
 finally{Remove-Item Env:JINGZHI_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue;[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
} finally {Set-Location $previous}
