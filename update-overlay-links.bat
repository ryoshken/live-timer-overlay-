@echo off
setlocal
for /f "tokens=*" %%I in ('powershell -NoLogo -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } ^| Sort-Object -Property InterfaceMetric ^| Select-Object -First 1 -ExpandProperty IPAddress)"') do set IP=%%I
if "%IP%"=="" (
  echo Could not detect local IP.
  exit /b 1
)
echo Using IP %IP%
> Timer1.url echo [InternetShortcut]
>> Timer1.url echo URL=http://%IP%/timer/?overlay=1^&transparent=1^&timer=1^&size=120
>> Timer1.url echo IconIndex=0
> Timer2.url echo [InternetShortcut]
>> Timer2.url echo URL=http://%IP%/timer/?overlay=1^&transparent=1^&timer=2^&size=120
>> Timer2.url echo IconIndex=0
> Timer3.url echo [InternetShortcut]
>> Timer3.url echo URL=http://%IP%/timer/?overlay=1^&transparent=1^&timer=3^&size=120
>> Timer3.url echo IconIndex=0
echo Generated Timer1.url, Timer2.url, Timer3.url
endlocal