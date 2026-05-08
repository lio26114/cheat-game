#!/bin/bash

echo "Fixing expo-modules-autolinking Gradle 7.x compatibility..."

# File paths
SETTINGS_MANAGER="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt"
SETTINGS_PLUGIN="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt"

# ==============================================
# Fix SettingsManager.kt
# ==============================================

echo "Fixing SettingsManager.kt..."

# Fix 1: Replace the internal import with proper import
sed -i 's|import org.gradle.internal.extensions.core.extra|import org.gradle.api.plugins.ExtraPropertiesExtension|' "$SETTINGS_MANAGER"

# Fix 2: Remove any broken kotlin dsl import
sed -i '/import org.gradle.kotlin.dsl.the/d' "$SETTINGS_MANAGER"

# Fix 3: Replace project.the<ExtraPropertiesExtension>() with project.extensions.getByType()
sed -i 's/project\.the<ExtraPropertiesExtension>()/project.extensions.getByType(ExtraPropertiesExtension::class.java)/' "$SETTINGS_MANAGER"

# Fix 4: Replace settings.gradle.extensions.create with settings.extensions.create
sed -i 's/settings\.gradle\.extensions\.create("expoGradle"/settings.extensions.create("expoGradle"/' "$SETTINGS_MANAGER"

# ==============================================
# Fix ExpoAutolinkingSettingsPlugin.kt
# ==============================================

echo "Fixing ExpoAutolinkingSettingsPlugin.kt..."

# Fix 5: Add ExtraPropertiesExtension import if not exists
grep -q "import org.gradle.api.plugins.ExtraPropertiesExtension" "$SETTINGS_PLUGIN" || \
  sed -i '/import org.gradle.api.initialization.Settings/a\import org.gradle.api.plugins.ExtraPropertiesExtension' "$SETTINGS_PLUGIN"

# Fix 6: Remove any broken kotlin dsl import
sed -i '/import org.gradle.kotlin.dsl.the/d' "$SETTINGS_PLUGIN"

# Fix 7: Replace settings.the<ExtraPropertiesExtension>() with settings.extensions.getByType()
sed -i 's/settings\.the<ExtraPropertiesExtension>()/settings.extensions.getByType(ExtraPropertiesExtension::class.java)/' "$SETTINGS_PLUGIN"

echo "Done fixing compatibility issues."
