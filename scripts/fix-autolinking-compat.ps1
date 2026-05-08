Write-Host "Fixing expo-modules-autolinking Gradle 7.x compatibility..."

# Fix 1: SettingsManager.kt - line 112: project.the<ExtraPropertiesExtension>()
$settingsManagerPath = "node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt"
$content = Get-Content $settingsManagerPath -Raw
$content = $content -replace 'project\.the<ExtraPropertiesExtension>\(\)', 'project.extensions.getByType(ExtraPropertiesExtension::class.java)'
Set-Content $settingsManagerPath $content -NoNewline

# Fix 2: SettingsManager.kt - line 159: settings.extensions.create
$content = Get-Content $settingsManagerPath -Raw
$content = $content -replace 'settings\.extensions\.create', 'settings.extensions.create("expoAutolinking", ExpoAutolinkingSettingsExtension::class.java)'
Set-Content $settingsManagerPath $content -NoNewline

# Fix 3: ExpoAutolinkingSettingsPlugin.kt - line 11: settings.extensions.getByType
$pluginPath = "node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt"
$content = Get-Content $pluginPath -Raw
$content = $content -replace 'settings\.extensions\.getByType\(ExtraPropertiesExtension::class\.java\)', 'settings.extensions.findByName("ext") as ExtraPropertiesExtension'
Set-Content $pluginPath $content -NoNewline

Write-Host "Done fixing compatibility issues."
