# Android SDK 自动下载安装脚本
# 使用方法：右键点击 -> 以管理员身份运行PowerShell

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Android SDK 自动安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置变量
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$cmdToolsVersion = "11076708"
$cmdToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$tempZip = "$env:TEMP\cmdline-tools.zip"

# 检查是否已安装
if (Test-Path $sdkRoot) {
    Write-Host "[✓] Android SDK已安装在: $sdkRoot" -ForegroundColor Green
    Write-Host "按任意键退出..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

try {
    # 1. 下载Command Line Tools
    Write-Host "[1/4] 下载Android SDK Command Line Tools..." -ForegroundColor Yellow
    Write-Host "  来源: dl.google.com" -ForegroundColor Gray
    Write-Host "  大小: 约150MB" -ForegroundColor Gray
    Write-Host ""
    
    try {
        Invoke-WebRequest -Uri $cmdToolsUrl -OutFile $tempZip -ErrorAction Stop
        Write-Host "[✓] 下载完成" -ForegroundColor Green
    }
    catch {
        Write-Host "[✗] 下载失败！" -ForegroundColor Red
        Write-Host "  错误: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "可能的原因：" -ForegroundColor Yellow
        Write-Host "  1. 网络连接问题" -ForegroundColor Yellow
        Write-Host "  2. 无法访问Google服务器（需使用VPN）" -ForegroundColor Yellow
        Write-Host "  3. 防火墙阻止" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "建议方案：" -ForegroundColor Cyan
        Write-Host "  1. 开启VPN后重试" -ForegroundColor White
        Write-Host "  2. 或手动下载Android Studio: https://developer.android.com/studio" -ForegroundColor White
        Write-Host ""
        pause
        exit 1
    }
    
    # 2. 解压
    Write-Host "[2/4] 解压文件..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "$sdkRoot\cmdline-tools" | Out-Null
    Expand-Archive -Path $tempZip -DestinationPath "$sdkRoot\cmdline-tools\temp" -Force
    Move-Item -Path "$sdkRoot\cmdline-tools\temp\cmdline-tools\*" -Destination "$sdkRoot\cmdline-tools\latest" -Force
    Remove-Item -Path "$sdkRoot\cmdline-tools\temp" -Recurse -Force
    Remove-Item -Path $tempZip -Force
    Write-Host "[✓] 解压完成" -ForegroundColor Green
    
    # 3. 配置环境变量
    Write-Host "[3/4] 配置环境变量..." -ForegroundColor Yellow
    $env:ANDROID_HOME = $sdkRoot
    $env:ANDROID_SDK_ROOT = $sdkRoot
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
    [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
    
    $sdkPaths = "$sdkRoot\cmdline-tools\latest\bin", "$sdkRoot\platform-tools"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    foreach ($p in $sdkPaths) {
        if ($currentPath -notlike "*$p*") {
            $currentPath = "$currentPath;$p"
            Write-Host "  添加PATH: $p" -ForegroundColor Gray
        }
    }
    [Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
    Write-Host "[✓] 环境变量已配置" -ForegroundColor Green
    
    # 4. 安装SDK组件
    Write-Host "[4/4] 安装SDK组件（这可能需要10-30分钟）..." -ForegroundColor Yellow
    Write-Host "  提示：首次下载需要较长时间" -ForegroundColor Gray
    Write-Host ""
    
    $sdkmanager = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"
    
    # 接受许可
    Write-Host "  接受许可协议..." -ForegroundColor Gray
    echo "y" | & $sdkmanager --licenses 2>&1 | Out-Null
    
    # 安装必要组件
    Write-Host "  安装: platform-tools..." -ForegroundColor Gray
    & $sdkmanager "platform-tools" 2>&1 | Out-Null
    
    Write-Host "  安装: platforms;android-34..." -ForegroundColor Gray
    & $sdkmanager "platforms;android-34" 2>&1 | Out-Null
    
    Write-Host "  安装: build-tools;34.0.0..." -ForegroundColor Gray
    & $sdkmanager "build-tools;34.0.0" 2>&1 | Out-Null
    
    Write-Host "  安装: ndk;26.1.10909125..." -ForegroundColor Gray
    & $sdkmanager "ndk;26.1.10909125" 2>&1 | Out-Null
    
    Write-Host "[✓] SDK组件安装完成" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  安装成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Android SDK 位置: $sdkRoot" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "接下来的步骤：" -ForegroundColor Yellow
    Write-Host "  1. 重启PowerShell使环境变量生效" -ForegroundColor White
    Write-Host "  2. 下载并安装Java JDK 17: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor White
    Write-Host "  3. 安装完JDK后，运行: D:\cheat-game\local-build.bat" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "[✗] 安装失败！" -ForegroundColor Red
    Write-Host "  错误: $_" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "按任意键退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
