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
  curl -L -o "%CF_EXE%" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe 2>nul
)
if not exist "%CF_EXE%" (
  powershell -NoLogo -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $u='https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'; Invoke-WebRequest -Uri $u -OutFile '%CF_EXE%'"
)
if not exist "%CF_EXE%" (
  echo cloudflared not found or failed to download.
  echo Download manually: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  echo Place the file at: %CF_EXE%
  exit /b 1
)
set NAME=timer-overlay
if "%1"=="" (
  set /p HOSTNAME=Enter Cloudflare hostname (e.g. timers.yourdomain.com): 
) else (
  set HOSTNAME=%~1
)
if "%HOSTNAME%"=="" (
  echo Hostname is required.
  exit /b 1
)
"%CF_EXE%" tunnel login
"%CF_EXE%" tunnel create %NAME%
for /f "skip=1 tokens=1,2 delims= " %%a in ('"%CF_EXE%" tunnel list 2^>nul"') do (
  if /I "%%b"=="%NAME%" set TUNID=%%a
)
if "%TUNID%"=="" (
  echo Could not find tunnel ID.
  exit /b 1
)
set CFGDIR=%~dp0cloudflared
set CFG=%CFGDIR%\config.yml
set CREDS=%ProgramData%\cloudflared\%TUNID%.json
> "%CFG%" echo tunnel: %TUNID%
>> "%CFG%" echo credentials-file: %CREDS%
>> "%CFG%" echo ingress:
>> "%CFG%" echo 	- hostname: %HOSTNAME%
>> "%CFG%" echo 	  service: http://localhost
>> "%CFG%" echo 	- service: http_status:404
"%CF_EXE%" tunnel route dns %NAME% %HOSTNAME%
echo %HOSTNAME%> "%CFGDIR%\host.txt"
echo Named tunnel configured.
echo To run: run-named-tunnel.bat
> Timer1-public.url echo [InternetShortcut]
>> Timer1-public.url echo URL=https://%HOSTNAME%/timer/?overlay=1^&transparent=1^&timer=1^&size=120
>> Timer1-public.url echo IconIndex=0
> Timer2-public.url echo [InternetShortcut]
>> Timer2-public.url echo URL=https://%HOSTNAME%/timer/?overlay=1^&transparent=1^&timer=2^&size=120
>> Timer2-public.url echo IconIndex=0
> Timer3-public.url echo [InternetShortcut]
>> Timer3-public.url echo URL=https://%HOSTNAME%/timer/?overlay=1^&transparent=1^&timer=3^&size=120
>> Timer3-public.url echo IconIndex=0
endlocal