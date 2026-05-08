# 简化版APK构建脚本
Set-StrictMode -Off

$SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$CMD_TOOLS_VERSION = "11076708"
$CMD_TOOLS_URL = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$TEMP_ZIP = "$env:TEMP\cmdline-tools.zip"

Write-Host "[1/5] 检查Android SDK..." -ForegroundColor Yellow

if (-not (Test-Path $SDK_ROOT)) {
    Write-Host "  Android SDK未安装，开始安装..." -ForegroundColor Yellow
    
    New-Item -ItemType Directory -Force -Path "$SDK_ROOT\cmdline-tools" | Out-Null
    
    Write-Host "  下载Android SDK Command Line Tools..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $CMD_TOOLS_URL -OutFile $TEMP_ZIP
    
    Write-Host "  解压文件..." -ForegroundColor Yellow
    Expand-Archive -Path $TEMP_ZIP -DestinationPath "$SDK_ROOT\cmdline-tools\temp" -Force
    Move-Item -Path "$SDK_ROOT\cmdline-tools\temp\cmdline-tools\*" -Destination "$SDK_ROOT\cmdline-tools\latest" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$SDK_ROOT\cmdline-tools\temp" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $TEMP_ZIP -Force -ErrorAction SilentlyContinue
    
    Write-Host "  SDK下载完成 ✓" -ForegroundColor Green
}

$env:ANDROID_HOME = $SDK_ROOT
$env:ANDROID_SDK_ROOT = $SDK_ROOT
$env:PATH += ";$SDK_ROOT\cmdline-tools\latest\bin;$SDK_ROOT\platform-tools"

Write-Host "[2/5] 安装SDK组件..." -ForegroundColor Yellow

$sdkmanager = "$SDK_ROOT\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkmanager) {
    Write-Host "  接受许可协议..." -ForegroundColor Yellow
    echo "y" | & $sdkmanager --licenses 2>&1 | Out-Null
    
    Write-Host "  安装构建工具..." -ForegroundColor Yellow
    & $sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
} else {
    Write-Host "  警告: sdkmanager未找到" -ForegroundColor Yellow
}

Write-Host "[3/5] 检查项目配置..." -ForegroundColor Yellow

if (-not (Test-Path "D:\cheat-game\android\gradlew.bat")) {
    Write-Host "  错误: 未找到android目录" -ForegroundColor Red
    exit 1
}
Write-Host "  项目配置检查通过 ✓" -ForegroundColor Green

Write-Host "[4/5] 开始构建APK..." -ForegroundColor Yellow

Set-Location "D:\cheat-game\android"

.\gradlew.bat clean 2>&1 | Out-Null
.\gradlew.bat assembleRelease

Write-Host "[5/5] 检查构建结果..." -ForegroundColor Yellow

$APK_PATH = "D:\cheat-game\android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $APK_PATH) {
    Write-Host ""
    Write-Host "========================================`n  构建成功！`n========================================" -ForegroundColor Green
    Write-Host "APK位置: $APK_PATH" -ForegroundColor Cyan
    Write-Host "文件大小: $((Get-Item $APK_PATH).length / 1MB) MB" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================`n  构建失败`n========================================" -ForegroundColor Red
}