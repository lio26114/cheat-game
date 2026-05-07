# Android构建环境配置脚本
# 使用方法：右键点击 -> 以管理员身份运行PowerShell

Write-Host "=== Android构建环境配置 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 查找Android SDK路径
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$sdkPath = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        break
    }
}

if ($sdkPath) {
    Write-Host "[1/3] 找到Android SDK: $sdkPath" -ForegroundColor Green
} else {
    Write-Host "[1/3] 未找到Android SDK" -ForegroundColor Red
    Write-Host "请先安装Android Studio" -ForegroundColor Yellow
    pause
    exit 1
}

# 2. 查找Java路径
$javaPaths = @(
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "$env:ProgramFiles\Java\jdk-*"
)

$javaPath = $null
foreach ($path in $javaPaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $javaPath = $resolved[0].Path
        break
    }
}

if ($javaPath) {
    Write-Host "[2/3] 找到Java: $javaPath" -ForegroundColor Green
} else {
    Write-Host "[2/3] 未找到Java JDK" -ForegroundColor Yellow
    Write-Host "将尝试使用Android Studio自带的JRE..." -ForegroundColor Yellow
    $javaPath = "$sdkPath\..\..\Android Studio\jbr"
    if (-not (Test-Path $javaPath)) {
        Write-Host "未找到Java，请先安装JDK 17" -ForegroundColor Red
        pause
        exit 1
    }
}

# 3. 配置环境变量（用户级别）
Write-Host "[3/3] 配置环境变量..." -ForegroundColor Yellow

[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkPath, "User")

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPathEntries = @(
    "$sdkPath\platform-tools",
    "$sdkPath\cmdline-tools\latest\bin",
    "$sdkPath\tools\bin"
)

foreach ($entry in $newPathEntries) {
    if ($currentPath -notlike "*$entry*") {
        $currentPath = "$currentPath;$entry"
        Write-Host "  添加: $entry" -ForegroundColor Gray
    }
}

if ($javaPath) {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "User")
    if ($currentPath -notlike "*$javaPath\bin*") {
        $currentPath = "$currentPath;$javaPath\bin"
        Write-Host "  添加: $javaPath\bin" -ForegroundColor Gray
    }
}

[Environment]::SetEnvironmentVariable("Path", $currentPath, "User")

Write-Host ""
Write-Host "=== 配置完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "环境变量已配置（需要重启PowerShell才能生效）" -ForegroundColor Yellow
Write-Host ""
Write-Host "接下来的步骤：" -ForegroundColor Cyan
Write-Host "1. 关闭并重新打开PowerShell" -ForegroundColor White
Write-Host "2. 执行： cd D:\cheat-game\android" -ForegroundColor White
Write-Host "3. 执行： .\gradlew.bat assembleRelease" -ForegroundColor White
Write-Host ""
pause
