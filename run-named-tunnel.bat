@echo off
setlocal
set CF_DIR=%~dp0cloudflared
set CF_EXE=%CF_DIR%\cloudflared.exe
if not exist "%CF_EXE%" (
  where cloudflared.exe >nul 2>&1
  if "%ERRORLEVEL%"=="0" (
    for /f "tokens=*" %%P in ('where cloudflared.exe 2^>nul') do set CF_EXE=%%P
  ) else (
    echo cloudflared not found. Run setup-named-tunnel.bat first.
    exit /b 1
  )
)
set NAME=timer-overlay
set CFG=%CF_DIR%\config.yml
if not exist "%CFG%" (
  echo config.yml not found. Run setup-named-tunnel.bat first.
  exit /b 1
)
start "cloudflared" "%CF_EXE%" tunnel run %NAME% --config "%CFG%"
set HOST=
if exist "%CF_DIR%\host.txt" (
  set /p HOST=<"%CF_DIR%\host.txt"
)
if not "%HOST%"=="" (
  > Timer1-public.url echo [InternetShortcut]
  >> Timer1-public.url echo URL=https://%HOST%/timer/?overlay=1^&transparent=1^&timer=1^&size=120
  >> Timer1-public.url echo IconIndex=0
  > Timer2-public.url echo [InternetShortcut]
  >> Timer2-public.url echo URL=https://%HOST%/timer/?overlay=1^&transparent=1^&timer=2^&size=120
  >> Timer2-public.url echo IconIndex=0
  > Timer3-public.url echo [InternetShortcut]
  >> Timer3-public.url echo URL=https://%HOST%/timer/?overlay=1^&transparent=1^&timer=3^&size=120
  >> Timer3-public.url echo IconIndex=0
)
endlocal