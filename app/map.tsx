// app/map.tsx
// 关卡地图页面

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { LEVELS, Level } from '../src/data/levels';
import { ENEMIES } from '../src/data/enemies';
import { useProgressStore } from '../src/store/progressStore';
import { useAudioStore } from '../src/store/audioStore';

interface MapProps {
  navigation: NavigationProp<any>;
}

export default function Map({ navigation }: MapProps) {
  const { unlockedLevels, completedLevels, currentLevel } = useProgressStore();
  const audioStore = useAudioStore();

  // 播放菜单BGM
  useEffect(() => {
    audioStore.init();
    audioStore.playBGM('menu');
  }, []);

  const handleLevelPress = (level: Level) => {
    if (!unlockedLevels.includes(level.id)) return;
    const enemy = ENEMIES.find((e) => e.id === level.enemyId);
    if (enemy) {
      navigation.navigate('Battle', { levelId: level.id });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>◂ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关卡地图</Text>
        <Text style={styles.progressText}>
          {completedLevels.length} / {LEVELS.length}
        </Text>
      </View>

      {/* 关卡列表 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {LEVELS.map((level) => {
          const enemy = ENEMIES.find((e) => e.id === level.enemyId);
          const isUnlocked = unlockedLevels.includes(level.id);
          const isCompleted = completedLevels.includes(level.id);

          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                isUnlocked ? styles.levelUnlocked : styles.levelLocked,
                isCompleted && styles.levelCompleted,
              ]}
              onPress={() => handleLevelPress(level)}
              disabled={!isUnlocked}
              activeOpacity={0.7}
            >
              <View style={styles.levelLeft}>
                {/* 关卡编号 */}
                <View
                  style={[
                    styles.levelNumber,
                    isCompleted && styles.levelNumberCompleted,
                  ]}
                >
                  <Text style={styles.levelNumberText}>{level.id}</Text>
                </View>
              </View>

              <View style={styles.levelInfo}>
                <Text style={[styles.levelName, !isUnlocked && styles.lockedText]}>
                  {isUnlocked ? level.name : '???'}
                </Text>
                {isUnlocked && enemy && (
                  <Text style={styles.enemyName}>
                    vs {enemy.name} · {enemy.title}
                  </Text>
                )}
                {!isUnlocked && (
                  <Text style={styles.lockedHint}>🔒 通关上一关解锁</Text>
                )}
                {isCompleted && (
                  <Text style={styles.completedBadge}>✅ 已通关</Text>
                )}
              </View>

              <View style={styles.levelRight}>
                {isUnlocked && (
                  <Text style={styles.hpInfo}>
                    ❤️{level.playerHP} vs ❤️{level.enemyHP}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    color: '#f1c40f',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelUnlocked: {
    backgroundColor: '#1a1a2e',
    borderColor: '#333',
  },
  levelLocked: {
    backgroundColor: '#111',
    borderColor: '#222',
    opacity: 0.5,
  },
  levelCompleted: {
    borderColor: '#f1c40f',
  },
  levelLeft: {
    marginRight: 14,
  },
  levelNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumberCompleted: {
    backgroundColor: '#f1c40f',
  },
  levelNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  enemyName: {
    color: '#999',
    fontSize: 12,
  },
  lockedText: {
    color: '#444',
  },
  lockedHint: {
    color: '#444',
    fontSize: 12,
  },
  completedBadge: {
    color: '#f1c40f',
    fontSize: 12,
    marginTop: 2,
  },
  levelRight: {
    alignItems: 'flex-end',
  },
  hpInfo: {
    color: '#e74c3c',
    fontSize: 12,
  },
});
