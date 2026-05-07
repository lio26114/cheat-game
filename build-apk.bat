@echo off
REM 欺局 APK本地构建脚本（WorkBuddy后台版）

set PATH=C:\Users\你的微笑好丑\.workbuddy\binaries\node\versions\22.12.0;%PATH%
set JAVA_HOME=D:\.workbuddy\android studio\jbr
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%JAVA_HOME%\bin;%PATH%

echo [1/3] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found
    exit /b 1
)

echo [2/3] Checking Gradle...
D:
cd \cheat-game\android
if not exist gradlew.bat (
    echo ERROR: gradlew.bat not found
    exit /b 1
)

echo [3/3] Building APK...
call gradlew.bat assembleRelease --stacktrace

if exist "app\build\outputs\apk\release\app-release.apk" (
    echo BUILD SUCCESS
    echo APK: D:\cheat-game\android\app\build\outputs\apk\release\app-release.apk
) else (
    echo BUILD FAILED
)
