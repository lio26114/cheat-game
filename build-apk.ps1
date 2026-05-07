# APK构建脚本 - 自动下载SDK并构建
# 使用方法：右键点击 -> 使用PowerShell运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  欺局 APK 自动构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置变量
$SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$CMD_TOOLS_VERSION = "11076708"  # Command Line Tools 11.0
$CMD_TOOLS_URL = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$TEMP_ZIP = "$env:TEMP\cmdline-tools.zip"

# 函数：检查是否以管理员运行
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查PowerShell版本
Write-Host "[1/6] 检查环境..." -ForegroundColor Yellow
$psVersion = $PSVersionTable.PSVersion.Major
if ($psVersion -lt 5) {
    Write-Host "错误：需要PowerShell 5.0或更高版本" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  PowerShell版本: $psVersion ✓" -ForegroundColor Green

# 检查Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误：未安装Node.js，请先安装Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "  Node.js已安装 ✓" -ForegroundColor Green

# 检查项目目录
if (-not (Test-Path "D:\cheat-game\android\gradlew.bat")) {
    Write-Host "错误：未找到android目录，请确保在项目根目录运行此脚本" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  项目目录检查通过 ✓" -ForegroundColor Green

# 安装Android SDK
Write-Host ""
Write-Host "[2/6] 检查Android SDK..." -ForegroundColor Yellow

if (-not (Test-Path $SDK_ROOT)) {
    Write-Host "  Android SDK未安装，开始安装..." -ForegroundColor Yellow
    
    # 创建SDK目录
    New-Item -ItemType Directory -Force -Path $SDK_ROOT | Out-Null
    New-Item -ItemType Directory -Force -Path "$SDK_ROOT\cmdline-tools" | Out-Null
    
    # 下载Command Line Tools
    Write-Host "  下载Android SDK Command Line Tools..." -ForegroundColor Yellow
    Write-Host "  （这可能需要几分钟，请耐心等待）" -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $CMD_TOOLS_URL -OutFile $TEMP_ZIP
    } catch {
        Write-Host "  下载失败，请检查网络连接" -ForegroundColor Red
        Write-Host "  错误: $_" -ForegroundColor Red
        pause
        exit 1
    }
    
    # 解压
    Write-Host "  解压文件..." -ForegroundColor Yellow
    Expand-Archive -Path $TEMP_ZIP -DestinationPath "$SDK_ROOT\cmdline-tools\temp" -Force
    Move-Item -Path "$SDK_ROOT\cmdline-tools\temp\cmdline-tools\*" -Destination "$SDK_ROOT\cmdline-tools\latest" -Force
    Remove-Item -Path "$SDK_ROOT\cmdline-tools\temp" -Recurse -Force
    Remove-Item -Path $TEMP_ZIP -Force
    
    Write-Host "  SDK下载完成 ✓" -ForegroundColor Green
} else {
    Write-Host "  Android SDK已安装 ✓" -ForegroundColor Green
}

# 设置环境变量
Write-Host ""
Write-Host "[3/6] 配置环境变量..." -ForegroundColor Yellow

$env:ANDROID_HOME = $SDK_ROOT
$env:ANDROID_SDK_ROOT = $SDK_ROOT
$env:PATH += ";$SDK_ROOT\cmdline-tools\latest\bin;$SDK_ROOT\platform-tools"

# 永久设置环境变量
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $SDK_ROOT, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $SDK_ROOT, "User")
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$SDK_ROOT*") {
    [Environment]::SetEnvironmentVariable("Path", $currentPath + ";$SDK_ROOT\cmdline-tools\latest\bin;$SDK_ROOT\platform-tools", "User")
}

Write-Host "  环境变量已配置 ✓" -ForegroundColor Green

# 安装SDK组件
Write-Host ""
Write-Host "[4/6] 安装SDK组件（这可能需几分钟）..." -ForegroundColor Yellow

$sdkmanager = "$SDK_ROOT\cmdline-tools\latest\bin\sdkmanager.bat"

# 接受许可
Write-Host "  接受许可协议..." -ForegroundColor Yellow
echo "y" | & $sdkmanager --licenses 2>&1 | Out-Null

# 安装必要组件
Write-Host "  安装构建工具..." -ForegroundColor Yellow
& $sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;26.1.10909125"

Write-Host "  SDK组件安装完成 ✓" -ForegroundColor Green

# 构建APK
Write-Host ""
Write-Host "[5/6] 开始构建APK..." -ForegroundColor Yellow
Write-Host "  （首次构建需要下载Gradle，可能需要10-30分钟）" -ForegroundColor Yellow
Write-Host ""

Set-Location "D:\cheat-game\android"

# 清理之前的构建
Write-Host "  清理旧的构建文件..." -ForegroundColor Yellow
.\gradlew.bat clean

# 构建Release APK
Write-Host "  开始构建..." -ForegroundColor Yellow
.\gradlew.bat assembleRelease --stacktrace

# 检查构建结果
Write-Host ""
Write-Host "[6/6] 检查构建结果..." -ForegroundColor Yellow

$APK_PATH = "D:\cheat-game\android\app\build\outputs\apk\release\app-release.apk"

if (Test-Path $APK_PATH) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  构建成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK位置: $APK_PATH" -ForegroundColor Cyan
    Write-Host "文件大小: $((Get-Item $APK_PATH).length / 1MB) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "您可以将此APK安装到Android设备上进行测试。" -ForegroundColor Yellow
    Write-Host ""
    
    # 打开APK所在文件夹
    $openFolder = Read-Host "是否打开APK所在文件夹？(Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        Invoke-Item "D:\cheat-game\android\app\build\outputs\apk\release"
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  构建失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查上面的错误信息" -ForegroundColor Yellow
    Write-Host "或者尝试使用GitHub Actions方案（更可靠）" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
