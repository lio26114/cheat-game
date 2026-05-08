#!/bin/bash

echo "Fixing expo-modules-autolinking Gradle 7.x compatibility..."

# File paths
SETTINGS_MANAGER="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt"
SETTINGS_PLUGIN="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt"

# ==============================================
# Fix SettingsManager.kt
# ==============================================

echo "Fixing SettingsManager.kt..."

# Fix: Replace project.the<ExtraPropertiesExtension>() with project.extensions.getByType()
sed -i 's/project\.the<ExtraPropertiesExtension>()/project.extensions.getByType(ExtraPropertiesExtension::class.java)/g' "$SETTINGS_MANAGER"

# Fix: Remove kotlin dsl the import
sed -i '/import org.gradle.kotlin.dsl.the/d' "$SETTINGS_MANAGER"

# ==============================================
# Fix ExpoAutolinkingSettingsPlugin.kt
# ==============================================

echo "Fixing ExpoAutolinkingSettingsPlugin.kt..."

# Fix: Remove kotlin dsl the import
sed -i '/import org.gradle.kotlin.dsl.the/d' "$SETTINGS_PLUGIN"

# Fix: Replace settings.the<ExtraPropertiesExtension>() with settings.extensions.getByType()
sed -i 's/settings\.the<ExtraPropertiesExtension>()/settings.extensions.getByType(ExtraPropertiesExtension::class.java)/g' "$SETTINGS_PLUGIN"

echo "Done fixing compatibility issues."
