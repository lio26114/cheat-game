@echo off
REM 欺局 APK构建脚本 - 通过EAS云端构建
REM 使用方法：双击运行此文件

echo ========================================
echo   欺局 APK EAS云端构建
echo ========================================
echo.

REM 设置Node.js路径
set PATH=C:\Users\你的微笑好丑\.workbuddy\binaries\node\versions\22.12.0;%PATH%

REM 验证Node.js
echo [1/4] 检查Node.js...
node --version
if errorlevel 1 (
    echo 错误：Node.js未找到！
    pause
    exit /b 1
)
echo Node.js OK

REM 切换到项目目录
echo.
echo [2/4] 进入项目目录...
D:
cd \cheat-game

REM 验证EAS CLI
echo.
echo [3/4] 检查EAS CLI...
call node_modules\.bin\eas.cmd --version
if errorlevel 1 (
    echo 错误：EAS CLI未找到，正在安装...
    call npm install -g eas-cli
)
echo EAS CLI OK

REM 开始构建
echo.
echo [4/4] 开始EAS云端构建...
echo.
echo 正在提交构建请求...
echo 请确保VPN已开启（全局模式）
echo.

call node_modules\.bin\eas.cmd build --platform android --profile preview --clear-cache

echo.
echo ========================================
echo 构建请求已提交！
echo 请在浏览器中查看构建进度
echo ========================================
echo.
pause
