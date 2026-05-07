@echo off
D:
cd \cheat-game

echo Testing node...
D:\cheat-game\tools\node.exe --version
echo.

echo Setting up network...
echo Please make sure your VPN is on (Global Mode)
echo.

echo Running EAS build (skipping VCS check)...
set EAS_NO_VCS=1

REM If you have a proxy, uncomment the next line and set your proxy
REM set HTTP_PROXY=http://127.0.0.1:your_proxy_port
REM set HTTPS_PROXY=http://127.0.0.1:your_proxy_port

D:\cheat-game\tools\node.exe node_modules\eas-cli\bin\run build --platform android --profile preview --clear-cache
echo.
echo Build process completed.
pause
