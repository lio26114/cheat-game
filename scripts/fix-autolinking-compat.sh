#!/bin/bash

echo "Fixing expo-modules-autolinking Gradle 7.x compatibility..."

# File paths
SETTINGS_MANAGER="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt"
SETTINGS_PLUGIN="node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt"

# ==============================================
# Fix SettingsManager.kt
# ==============================================

# Fix 1: Replace the internal import with proper imports
sed -i 's|import org.gradle.internal.extensions.core.extra|import org.gradle.api.plugins.ExtraPropertiesExtension|' "$SETTINGS_MANAGER"

# Fix 2: Add the kotlin dsl import
grep -q "import org.gradle.kotlin.dsl.the" "$SETTINGS_MANAGER" || \
  sed -i '/import org.gradle.api.plugins.ExtraPropertiesExtension/a\import org.gradle.kotlin.dsl.the' "$SETTINGS_MANAGER"

# Fix 3: Replace project.extra.set with project.the<ExtraPropertiesExtension>().set
sed -i 's/project\.extra\.set("coreFeatures"/project.the<ExtraPropertiesExtension>().set("coreFeatures"/' "$SETTINGS_MANAGER"

# Fix 4: Replace settings.gradle.extensions.create with settings.extensions.create
sed -i 's/settings\.gradle\.extensions\.create("expoGradle"/settings.extensions.create("expoGradle"/' "$SETTINGS_MANAGER"

# ==============================================
# Fix ExpoAutolinkingSettingsPlugin.kt
# ==============================================

# Fix 5: Add ExtraPropertiesExtension import if not exists
grep -q "import org.gradle.api.plugins.ExtraPropertiesExtension" "$SETTINGS_PLUGIN" || \
  sed -i '/import org.gradle.api.initialization.Settings/a\import org.gradle.api.plugins.ExtraPropertiesExtension' "$SETTINGS_PLUGIN"

# Fix 6: Add kotlin dsl the import if not exists
grep -q "import org.gradle.kotlin.dsl.the" "$SETTINGS_PLUGIN" || \
  sed -i '/import org.gradle.api.plugins.ExtraPropertiesExtension/a\import org.gradle.kotlin.dsl.the' "$SETTINGS_PLUGIN"

# Fix 7: Replace settings.gradle.extensions.extraProperties.set with proper call
sed -i 's/settings\.gradle\.extensions\.extraProperties\.set("expoAutolinkingSettingsPlugin"/settings.the<ExtraPropertiesExtension>().set("expoAutolinkingSettingsPlugin"/' "$SETTINGS_PLUGIN"

echo "Done fixing compatibility issues."
