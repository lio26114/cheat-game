# 欺局 - APK构建指南

## 🚀 快速开始

### 方案1：使用GitHub Actions（推荐）

**优点**：免费、自动化、无需本地环境
**时间**：5-10分钟

#### 步骤：

1. **创建GitHub仓库**
   - 访问 https://github.com/new
   - 仓库名：`cheat-game`
   - 选择 **Public** 或 **Private**
   - 点击 **Create repository**

2. **上传代码**
   ```powershell
   # 打开PowerShell，执行以下命令：
   
   cd D:\cheat-game
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/cheat-game.git
   git push -u origin main
   ```
   
   **注意**：将`你的用户名`替换为你的GitHub用户名

3. **等待自动构建**
   - 推送代码后，自动构建会开始
   - 访问你的仓库，点击 **Actions** 标签页
   - 等待构建完成（通常5-10分钟）
   - 构建完成后，在 **Artifacts** 区域点击下载 `app-release.apk`

---

### 方案2：本地一键构建

**优点**：完全本地控制
**缺点**：需要下载约2GB的SDK，首次构建较慢
**时间**：20-40分钟（取决于网速）

#### 使用步骤：

1. **以管理员身份运行PowerShell**
   - 右键点击 **开始菜单**
   - 选择 **Windows PowerShell (管理员)**

2. **运行构建脚本**
   ```powershell
   # 导航到项目目录
   cd D:\cheat-game
   
   # 运行构建脚本
   .\build-apk.ps1
   ```

3. **等待构建完成**
   - 脚本会自动：
     - 下载并安装Android SDK（约2GB）
     - 配置环境变量
     - 构建APK
   - 首次构建需要20-40分钟
   - 后续构建只需2-5分钟

4. **获取APK**
   - 构建成功后，APK位置：
     ```
     D:\cheat-game\android\app\build\outputs\apk\release\app-release.apk
     ```

---

### 方案3：手动安装Android Studio

如果你打算经常开发Android应用，建议安装完整版Android Studio。

#### 步骤：

1. **下载Android Studio**
   - 访问：https://developer.android.com/studio
   - 下载并安装

2. **安装SDK**
   - 打开Android Studio
   - 点击 **More Actions** -> **SDK Manager**
   - 安装以下组件：
     - ✅ Android SDK Platform 34
     - ✅ Android SDK Build-Tools 34
     - ✅ Android SDK Platform-Tools
     - ✅ NDK (Side by side) 26.1.10909125

3. **配置环境变量**
   ```
   ANDROID_HOME = C:\Users\你的用户名\AppData\Local\Android\Sdk
   ```
   
   添加到PATH：
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   ```

4. **构建APK**
   ```powershell
   cd D:\cheat-game\android
   .\gradlew.bat assembleRelease
   ```

---

## 🔧 常见问题

### Q1: 构建失败，提示"SDK not found"
**解决方法**：
- 确保已安装Android SDK
- 检查环境变量 `ANDROID_HOME` 是否正确设置
- 重启PowerShell使环境变量生效

### Q2: 构建很慢，卡在"Downloading Gradle"
**原因**：Gradle下载速度慢
**解决方法**：
- 使用VPN加速
- 或手动下载Gradle并放到对应目录
- Gradle下载地址会在构建日志中显示

### Q3: 提示"JAVA_HOME not set"
**解决方法**：
```powershell
# 安装Java 17
# 下载：https://www.oracle.com/java/technologies/downloads/#java17

# 设置JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

### Q4: PowerShell执行策略错误
**错误信息**：`无法加载，因为在此系统上禁止运行脚本`
**解决方法**：
```powershell
# 以管理员身份运行PowerShell，执行：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📱 安装APK到手机

### 方法1：直接传输
1. 将 `app-release.apk` 复制到手机
2. 在手机上点击安装
3. 如果提示"未知来源"，允许安装

### 方法2：使用ADB
```powershell
# 连接手机（开启USB调试）
adb install D:\cheat-game\android\app\build\outputs\apk\release\app-release.apk
```

---

## 📦 发布到应用商店

### 生成签名APK（正式版）

1. **生成签名密钥**
   ```powershell
   keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **配置gradle**
   编辑 `D:\cheat-game\android\gradle.properties`：
   ```properties
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=*****
   MYAPP_RELEASE_KEY_PASSWORD=*****
   ```

3. **构建正式版**
   ```powershell
   cd D:\cheat-game\android
   .\gradlew.bat assembleRelease
   ```

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看构建日志中的错误信息
2. 搜索错误信息（通常能找到解决方案）
3. 或者联系我，我会帮你解决

---

**祝你构建顺利！** 🎉
