// app/index.tsx
// 主菜单 + 剧情线性推进 v4 — 视觉升级

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Platform, Dimensions } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useProgressStore } from '../src/store/progressStore';
import { getLevelById, LEVELS } from '../src/data/levels';
import { getEnemyById } from '../src/data/enemies';

const { width: SCREEN_W } = Dimensions.get('window');

interface HomeProps {
  navigation: NavigationProp<any>;
}

export default function Home({ navigation }: HomeProps) {
  const { currentLevel, completedLevels, unlockedLevels, resetProgress } = useProgressStore();
  const [showIntro, setShowIntro] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  // 秘技：首页按~键直接全通关（仅web，调试用）
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        const allIds = LEVELS.map(l => l.id);
        const store = useProgressStore.getState();
        store._hydrate();
        useProgressStore.setState({
          currentLevel: LEVELS.length + 1,
          completedLevels: allIds,
          unlockedLevels: allIds,
        });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // 获取当前关卡信息
  const currentLevelData = getLevelById(currentLevel);
  const currentEnemy = currentLevelData ? getEnemyById(currentLevelData.enemyId) : null;

  // 是否全通关
  const isAllComplete = completedLevels.length >= LEVELS.length;
  // 是否曾经通关（所有关卡都已解锁，即使重新挑战后仍可自由选关）
  const hasEverCompleted = unlockedLevels.length >= LEVELS.length;

  // 开始当前关卡
  const handleStartLevel = () => {
    if (!currentLevelData) return;
    navigation.navigate('Battle', { levelId: currentLevelData.id });
  };

  // 继续上次进度
  const handleContinue = () => {
    handleStartLevel();
  };

  // 重新开始（重置到第1关，回到首页初始状态）
  const handleRestart = () => {
    resetProgress();
  };

  // 渲染关卡选择器
  const renderLevelSelect = () => (
    <View style={styles.levelSelectOverlay}>
      <Text style={styles.levelSelectTitle}>选择关卡</Text>
      <ScrollView contentContainerStyle={styles.levelSelectList}>
        {LEVELS.map((lvl) => {
          const enemy = getEnemyById(lvl.enemyId);
          const isUnlocked = unlockedLevels.includes(lvl.id);
          const isCompleted = completedLevels.includes(lvl.id);
          return (
            <TouchableOpacity
              key={lvl.id}
              style={[
                styles.levelSelectItem,
                !isUnlocked && styles.levelSelectLocked,
                isCompleted && styles.levelSelectCompleted,
              ]}
              onPress={() => {
                if (isUnlocked) {
                  setShowLevelSelect(false);
                  navigation.navigate('Battle', { levelId: lvl.id, skipStory: true });
                }
              }}
              disabled={!isUnlocked}
            >
              <View style={styles.levelSelectInfo}>
                <Text style={[styles.levelSelectName, !isUnlocked && styles.levelSelectNameLocked]}>
                  第{lvl.id}局 · {lvl.name}
                </Text>
                <Text style={styles.levelSelectEnemy}>
                  {isUnlocked ? (enemy?.name ?? '???') : '未解锁'}
                </Text>
              </View>
              {isCompleted && <View style={styles.levelSelectDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        style={styles.levelSelectClose}
        onPress={() => setShowLevelSelect(false)}
      >
        <Text style={styles.levelSelectCloseText}>返回</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染开场背景介绍
  const renderIntro = () => (
    <View style={styles.introOverlay}>
      <ScrollView contentContainerStyle={styles.introContent}>
        <Text style={styles.introTitle}>背景</Text>

        <View style={styles.introSection}>
          <Text style={styles.introSubtitle}>「牌局会」</Text>
          <Text style={styles.introText}>
            在城市的暗处，有一个名为"牌局会"的神秘组织。没有人知道它存在了多久，
            也没有人知道它的真正目的。唯一确定的是——欠了债的人，都会被带到这里。
          </Text>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSubtitle}>规则</Text>
          <Text style={styles.introText}>
            牌局会的规则很简单：{'\n'}
            · 每局你和对手各持6张牌，同时出牌{'\n'}
            · 根据出牌的组合结算伤害{'\n'}
            · 先把对方的HP打到0的人获胜{'\n'}
            · 手牌打完后补发3张（对方可见你的补牌）{'\n'}
            · 赢满十二局，你就可以离开{'\n'}
            · 输了……你不会想知道后果的
          </Text>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSubtitle}>你</Text>
          <Text style={styles.introText}>
            你不记得自己是怎么来到这里的。醒来时，面前只有一张牌桌，
            和一个自称"引路人"的蒙面者。{'\n'}
            {'\n'}
            你欠下的债不是金钱——而是一份你从未签过的契约。{'\n'}
            {'\n'}
            唯一的选择就是：赢。
          </Text>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introSubtitle}>牌</Text>
          <Text style={styles.introText}>
            ⚔ 攻击 — 克防御，但被陷阱反杀{'\n'}
            🛡 防御 — 挡攻击，但被读心穿透{'\n'}
            👁 读心 — 猜中对方出什么就爆发高伤害{'\n'}
            💣 陷阱 — 等对方出攻击才触发{'\n'}
            🃏 蓄力 — 放弃本回合，下回合获得2张手牌（双方可见）{'\n'}
            {'\n'}
            关键：你和对手同时出牌。{'\n'}
            猜透对方的意图，才是赢的关键。
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.introCloseButton}
        onPress={() => setShowIntro(false)}
      >
        <Text style={styles.introCloseText}>我已了解，返回</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 背景暗纹 */}
      <View style={styles.bgPattern} />

      {/* 标题区 */}
      <View style={styles.titleContainer}>
        <Text style={styles.subtitle}>牌 局 会</Text>
        <Text style={styles.title}>欺 局</Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.tagline}>猜透对手，才能活下去</Text>
      </View>

      {/* 剧情推进区域 */}
      <View style={styles.storySection}>
        {isAllComplete ? (
          <View style={styles.completeCard}>
            <Text style={styles.completeEmoji}>🏆</Text>
            <Text style={styles.completeTitle}>全关通关</Text>
            <Text style={styles.completeSub}>你已逃出牌局会</Text>
          </View>
        ) : currentLevelData ? (
          <View style={styles.levelHint}>
            <Text style={styles.levelHintText}>
              第 {currentLevelData.id} 局 · {currentLevelData.name}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 进度条 */}
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>
          进度 {completedLevels.length}/{LEVELS.length}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(completedLevels.length / LEVELS.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        {isAllComplete ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRestart}>
              <Text style={styles.primaryButtonText}>重新挑战</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowLevelSelect(true)}>
              <Text style={styles.secondaryButtonText}>选择关卡</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonText}>
                {completedLevels.length === 0 ? '开 始 游 戏' : '继 续 前 进'}
              </Text>
            </TouchableOpacity>
            {hasEverCompleted && (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowLevelSelect(true)}>
                <Text style={styles.secondaryButtonText}>选择关卡</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.ghostButton}
          onPress={() => setShowIntro(true)}
        >
          <Text style={styles.ghostButtonText}>世界观与规则</Text>
        </TouchableOpacity>
      </View>

      {/* 开场背景介绍覆盖层 */}
      {showIntro && renderIntro()}

      {/* 关卡选择覆盖层 */}
      {showLevelSelect && renderLevelSelect()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // 背景暗纹
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 用径向渐变模拟暗角 + 微光中心
    backgroundColor: '#0a0a0a',
    // @ts-ignore web only
    background: 'radial-gradient(ellipse at 50% 35%, rgba(241,196,15,0.06) 0%, transparent 60%)',
  },
  // 标题区
  titleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  subtitle: {
    color: '#f1c40f',
    fontSize: 11,
    letterSpacing: 8,
    marginBottom: 6,
    opacity: 0.7,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 14,
    textShadowColor: 'rgba(241, 196, 15, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  titleUnderline: {
    width: 60,
    height: 1,
    backgroundColor: '#f1c40f',
    marginTop: 10,
    opacity: 0.5,
  },
  tagline: {
    color: '#555',
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 3,
  },
  // 剧情推进区域
  storySection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelHint: {
    backgroundColor: 'rgba(241, 196, 15, 0.06)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(241, 196, 15, 0.15)',
  },
  levelHintText: {
    color: '#f1c40f',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 3,
    fontWeight: '500',
  },
  completeCard: {
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 56,
  },
  completeTitle: {
    color: '#f1c40f',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 4,
    textShadowColor: 'rgba(241, 196, 15, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  completeSub: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 2,
  },
  // 进度条
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressLabel: {
    color: '#555',
    fontSize: 10,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f1c40f',
    borderRadius: 2,
    // @ts-ignore web only — 进度条尾部发光
    boxShadow: '2px 0 8px rgba(241,196,15,0.5)',
  },
  // 按钮
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#f1c40f',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 6,
    width: '80%',
    alignItems: 'center',
    // @ts-ignore web only — 按钮微光
    boxShadow: '0 2px 16px rgba(241,196,15,0.3)',
  },
  primaryButtonText: {
    color: '#0a0a0a',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(241, 196, 15, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 6,
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 196, 15, 0.05)',
  },
  secondaryButtonText: {
    color: '#f1c40f',
    fontSize: 14,
    letterSpacing: 2,
  },
  ghostButton: {
    paddingVertical: 8,
    paddingHorizontal: 50,
    width: '80%',
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#444',
    fontSize: 12,
    letterSpacing: 1,
  },
  // 开场背景介绍
  introOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
  },
  introContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 80,
  },
  introTitle: {
    color: '#f1c40f',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 4,
  },
  introSection: {
    backgroundColor: '#111',
    borderRadius: 6,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  introSubtitle: {
    color: '#f1c40f',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 2,
  },
  introText: {
    color: '#bbb',
    fontSize: 13,
    lineHeight: 22,
  },
  introCloseButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#f1c40f',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  introCloseText: {
    color: '#0a0a0a',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  // 关卡选择器
  levelSelectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
  },
  levelSelectTitle: {
    color: '#f1c40f',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 16,
    letterSpacing: 4,
  },
  levelSelectList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  levelSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 6,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  levelSelectLocked: {
    opacity: 0.35,
  },
  levelSelectCompleted: {
    borderColor: 'rgba(241, 196, 15, 0.15)',
  },
  levelSelectInfo: {
    flex: 1,
  },
  levelSelectName: {
    color: '#eee',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  levelSelectNameLocked: {
    color: '#444',
  },
  levelSelectEnemy: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  levelSelectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1c40f',
    // @ts-ignore web only
    boxShadow: '0 0 6px rgba(241,196,15,0.5)',
  },
  levelSelectClose: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#f1c40f',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  levelSelectCloseText: {
    color: '#0a0a0a',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
