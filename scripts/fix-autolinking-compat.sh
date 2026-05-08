#!/bin/bash

echo "Fixing expo-modules-autolinking Gradle 7.x compatibility..."

# Fix 1: SettingsManager.kt - import statement
sed -i 's|import org.gradle.internal.extensions.core.extra|import org.gradle.api.plugins.ExtraPropertiesExtension\nimport org.gradle.kotlin.dsl.the|' node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt

# Fix 2: SettingsManager.kt - project.extra.set -> project.the<ExtraPropertiesExtension>().set
sed -i 's|project\.extra\.set("coreFeatures"|project.the<ExtraPropertiesExtension>().set("coreFeatures"|' node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt

# Fix 3: SettingsManager.kt - settings.gradle.extensions.create -> settings.extensions.create
sed -i 's|settings\.gradle\.extensions\.create("expoGradle"|settings.extensions.create("expoGradle"|' node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt

# Fix 4: ExpoAutolinkingSettingsPlugin.kt - add imports
sed -i 's|import org.gradle.api.Plugin\nimport org.gradle.api.initialization.Settings\nimport java.io.File|import org.gradle.api.Plugin\nimport org.gradle.api.initialization.Settings\nimport org.gradle.api.plugins.ExtraPropertiesExtension\nimport org.gradle.kotlin.dsl.the\nimport java.io.File|' node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt

# Fix 5: ExpoAutolinkingSettingsPlugin.kt - settings.gradle.extensions.extraProperties.set -> settings.extensions.getByType()
sed -i 's|settings\.gradle\.extensions\.extraProperties\.set("expoAutolinkingSettingsPlugin"|settings.extensions.getByType(ExtraPropertiesExtension::class.java).set("expoAutolinkingSettingsPlugin"|' node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt

echo "Done fixing compatibility issues."
