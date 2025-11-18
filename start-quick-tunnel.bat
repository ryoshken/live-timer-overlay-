@echo off
setlocal
set CF_DIR=%~dp0cloudflared
set CF_EXE=%CF_DIR%\cloudflared.exe
if not exist "%CF_DIR%" mkdir "%CF_DIR%"
if not exist "%CF_EXE%" (
  where cloudflared.exe >nul 2>&1
  if "%ERRORLEVEL%"=="0" (
    for /f "tokens=*" %%P in ('where cloudflared.exe 2^>nul') do set CF_EXE=%%P
  ) else (
    winget -v >nul 2>&1
    if "%ERRORLEVEL%"=="0" (
      winget install --id Cloudflare.cloudflared -e --source winget
      where cloudflared.exe >nul 2>&1 && for /f "tokens=*" %%P in ('where cloudflared.exe 2^>nul') do set CF_EXE=%%P
    )
  )
)
if not exist "%CF_EXE%" (
  curl --version >nul 2>&1
  if "%ERRORLEVEL%"=="0" (
    curl -L -o "%CF_EXE%" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  ) else (
    powershell -NoLogo -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u='https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'; Invoke-WebRequest -Uri $u -OutFile '%CF_EXE%'"
  )
)
if not exist "%CF_EXE%" (
  bitsadmin /transfer CloudflaredDownload /download /priority normal https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe "%CF_EXE%" >nul 2>&1
)
if not exist "%CF_EXE%" (
  echo Download failed. Please download cloudflared manually and place it at "%CF_EXE%".
  echo URL: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  exit /b 1
)
set LOG=%CF_DIR%\tunnel.log
if exist "%LOG%" del "%LOG%"
start "cloudflared" "%CF_EXE%" tunnel --url http://localhost --logfile "%LOG%" --loglevel info
echo Starting Quick Tunnel...
set URL=
for /L %%i in (1,1,90) do (
  powershell -NoLogo -NoProfile -Command "$t=Get-Content -Path '%LOG%' -ErrorAction SilentlyContinue; $m=$t | Select-String -Pattern 'https://[^ ]+trycloudflare\.com' | Select-Object -Last 1; if($m){ $u=($m.Matches[0].Value); Write-Output $u }" > "%CF_DIR%\cfurl.txt"
  set /p URL=<"%CF_DIR%\cfurl.txt"
  if not "%URL%"=="" goto found
  timeout /t 1 >nul
)
echo Could not detect tunnel URL. Check "%LOG%" for details.
exit /b 1
:found
del "%CF_DIR%\cfurl.txt" 2>nul
echo Tunnel URL: %URL%
> Timer1-public.url echo [InternetShortcut]
>> Timer1-public.url echo URL=%URL%/timer/?overlay=1^&transparent=1^&timer=1^&size=120
>> Timer1-public.url echo IconIndex=0
> Timer2-public.url echo [InternetShortcut]
>> Timer2-public.url echo URL=%URL%/timer/?overlay=1^&transparent=1^&timer=2^&size=120
>> Timer2-public.url echo IconIndex=0
> Timer3-public.url echo [InternetShortcut]
>> Timer3-public.url echo URL=%URL%/timer/?overlay=1^&transparent=1^&timer=3^&size=120
>> Timer3-public.url echo IconIndex=0
echo Created Timer1-public.url, Timer2-public.url, Timer3-public.url
echo Note: Quick Tunnel links change each run. For permanent links, use a named tunnel.
endlocal