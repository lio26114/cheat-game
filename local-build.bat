@echo off
chcp 65001 >nul
REM =====================================
REM QiJu APK Local Build Script
REM =====================================

echo ========================================
echo   QiJu APK Local Build
echo ========================================
echo.

REM Set Node.js path
set "PATH=C:\Users\你的微笑好丑\.workbuddy\binaries\node\versions\22.12.0;%PATH%"

REM Set Java path (Android Studio bundled JBR)
set "JAVA_HOME=D:\.workbuddy\android studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Set Android SDK path
if exist "%LOCALAPPDATA%\Android\Sdk" (
    set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"
)

echo [Env Check]
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
echo.

REM Verify Node.js
echo [1/3] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)
echo Node.js OK
echo.

REM Switch to project android dir
D:
cd \cheat-game\android

REM Check Gradle wrapper
echo [2/3] Checking Gradle...
if not exist gradlew.bat (
    echo ERROR: gradlew.bat not found!
    pause
    exit /b 1
)
echo Gradle OK
echo.

REM Start build
echo [3/3] Building APK...
echo NOTE: First build downloads Gradle, may take 10-30 minutes
echo.

call gradlew.bat assembleRelease --stacktrace

REM Check result
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo ========================================
    echo   BUILD SUCCESS!
    echo ========================================
    echo.
    echo APK: D:\cheat-game\android\app\build\outputs\apk\release\app-release.apk
    echo.
    explorer "app\build\outputs\apk\release"
) else (
    echo.
    echo ========================================
    echo   BUILD FAILED
    echo ========================================
    echo.
    echo Check error messages above
)

echo.
pause
