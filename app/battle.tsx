// app/battle.tsx
// 卡牌对决页面（核心）v5 — 特殊规则系统

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { useGameStore, BattlePhase } from '../src/store/gameStore';
import { useProgressStore } from '../src/store/progressStore';

import { getLevelById } from '../src/data/levels';
import { getEnemyById } from '../src/data/enemies';
import { getStoryById } from '../src/data/story';
import { Card, CardType } from '../src/data/cards';
import CardComponent from '../src/components/Card/CardComponent';
import FlipCard from '../src/components/Card/FlipCard';
import HPBar from '../src/components/HPBar/HPBar';
import PressureBar from '../src/components/PressureBar/PressureBar';
import DialogBox from '../src/components/DialogBox/DialogBox';
import BattleResult from '../src/components/BattleResult/BattleResult';
import ShakeView from '../src/components/Effects/ShakeView';

const BASE_TIME_LIMIT = 25;   // 基础出牌时限（秒）
const MIN_TIME_LIMIT = 12;    // 最低出牌时限（压力满时）
const PRESSURE_TIME_PENALTY = BASE_TIME_LIMIT - MIN_TIME_LIMIT;

function getTimeLimit(pressure: number): number {
  return Math.round(BASE_TIME_LIMIT - (pressure / 100) * PRESSURE_TIME_PENALTY);
}

interface BattleProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any, 'Battle'>;
}

export default function Battle({ navigation, route }: BattleProps) {
  const levelId = route.params?.levelId || 1;
  const skipStory = route.params?.skipStory || false;
  const level = getLevelById(levelId)!;
  const enemy = getEnemyById(level.enemyId)!;

  const [showStory, setShowStory] = useState(!skipStory);
  const [storyKey, setStoryKey] = useState<string>(level.storyBeforeId);
  const [selectedGuess, setSelectedGuess] = useState<CardType | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [isPostBattleStory, setIsPostBattleStory] = useState(false);

  // 浮动伤害数字
  const [floatDamages, setFloatDamages] = useState<{ id: number; value: number; isPlayer: boolean }[]>([]);
  const floatIdRef = useRef(0);

  // 倒计时相关
  const [timeLeft, setTimeLeft] = useState(BASE_TIME_LIMIT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 低时间闪烁
  const timerFlashAnim = useRef(new Animated.Value(1)).current;

  const gameStore = useGameStore();
  const progressStore = useProgressStore();

  // 初始化对局
  useEffect(() => {
    gameStore.initBattle(level, enemy, progressStore.playerDeck);
    // 注入跨关出牌画像（镜像局+高级AI用）
    if (progressStore.playerProfile) {
      gameStore.setPlayerProfile(progressStore.playerProfile);
    }
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (gameStore.phase === 'select' && !showStory && !gameStore.ruleChangeNotification) {
      const timeLimit = getTimeLimit(gameStore.playerPressure);
      setTimeLeft(timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStore.phase, gameStore.currentTurn, showStory, gameStore.ruleChangeNotification]);

  // 结算阶段触发震屏 + 浮动伤害数字
  useEffect(() => {
    if (gameStore.phase === 'resolve' && gameStore.lastRoundResult) {
      const { playerDamage, enemyDamage } = gameStore.lastRoundResult;
      // 震屏
      if (playerDamage > 0) {
        setTimeout(() => setShakeTrigger(prev => prev + 1), 600);
      }
      // 浮动伤害
      const newDamages: { id: number; value: number; isPlayer: boolean }[] = [];
      if (playerDamage > 0) {
        newDamages.push({ id: floatIdRef.current++, value: playerDamage, isPlayer: true });
      }
      if (enemyDamage > 0) {
        newDamages.push({ id: floatIdRef.current++, value: enemyDamage, isPlayer: false });
      }
      if (newDamages.length > 0) {
        setTimeout(() => {
          setFloatDamages(newDamages);
          // 1.5秒后清除
          setTimeout(() => setFloatDamages([]), 1500);
        }, 400);
      }
    }
  }, [gameStore.phase]);

  // 秘技：按~键（Esc下方）直接获胜（仅web）
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        gameStore.cheatWin();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [gameStore]);

  // 倒计时低时间闪烁
  useEffect(() => {
    const timeLimit = getTimeLimit(gameStore.playerPressure);
    if (timeLeft <= 5 && timeLeft > 0 && gameStore.phase === 'select') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerFlashAnim, { toValue: 0.2, duration: 300, useNativeDriver: true }),
          Animated.timing(timerFlashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      timerFlashAnim.setValue(1);
      timerFlashAnim.stopAnimation();
    }
  }, [timeLeft, gameStore.phase]);


  const handleTimeUp = useCallback(() => {
    if (gameStore.phase !== 'select') return;
    if (gameStore.playerSelectedCard) {
      gameStore.confirmPlay();
    } else if (gameStore.playerHand.length > 0) {
      // 过滤掉被禁用的牌
      const availableCards = gameStore.playerHand.filter(
        c => !gameStore.disabledCardTypes.includes(c.type) &&
             !(gameStore.echoPhase && gameStore.usedCardTypes.includes(c.type))
      );
      if (availableCards.length === 0) {
        // 手牌全部被禁用，不应强制出牌，等待丢弃补牌逻辑处理
        return;
      }
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      gameStore.selectCard(randomCard);
      if (randomCard.type === 'mindread') {
        const types: CardType[] = ['attack', 'defense', 'mindread', 'trap', 'skip'];
        const randomGuess = types[Math.floor(Math.random() * types.length)];
        setSelectedGuess(randomGuess);
        gameStore.setPlayerGuess(randomGuess);
      } else {
        setTimeout(() => gameStore.confirmSelection(), 300);
      }
    }
  }, [gameStore]);

  // 剧情完成
  const handleStoryComplete = () => {
    if (isPostBattleStory) {
      setIsPostBattleStory(false);
      navigation.navigate('Home');
    } else {
      setShowStory(false);
      // Story完成后，第一轮出牌前弹出关卡规则通知
      const rules = level.specialRules || [];
      if (rules.length > 0) {
        const hasImitate = rules.some(r => r.type === 'imitate');
        gameStore.showRuleNotification({
          title: '⚡ 特殊规则生效',
          message: rules.map(r => r.description).join('\n'),
          onDismiss: () => {
            // 镜子关卡：规则提示关闭后，立即显示模仿本能提示
            if (hasImitate) {
              setTimeout(() => {
                gameStore.showRuleNotification({
                  title: '🪞 模仿本能',
                  message: '镜子正在学习你的出牌……初始准确率约30%',
                });
              }, 400);
            }
            // 预言关卡：规则提示关闭后，显示预言提示
            if (rules.some(r => r.type === 'prophecy') && gameStore.prophecyCard) {
              const cardTypeLabels: Record<string, string> = { attack: '攻击', defense: '防御', mindread: '读心', trap: '陷阱', skip: '蓄力' };
              const label = cardTypeLabels[gameStore.prophecyCard] ?? gameStore.prophecyCard;
              setTimeout(() => {
                gameStore.showRuleNotification({
                  title: '🔮 预言',
                  message: `影预言你将出：${label}`,
                });
              }, 400);
            }
          },
        });
        // 如果是镜子关卡，立即标记已显示，避免prepareNextTurn重复显示
        if (hasImitate) {
          gameStore.setHasShownImitateNotification(true);
        }
      }
    }
  };

  // 出牌选择
  const handleCardPress = (card: Card) => {
    if (gameStore.phase !== 'select') return;
    gameStore.selectCard(card);
  };

  // 确认出牌
  const confirmPlay = () => {
    if (!gameStore.playerSelectedCard) return;
    gameStore.confirmPlay();
  };

  // 读心猜测确认
  const handleGuessSelect = (guess: CardType) => {
    setSelectedGuess(guess);
    gameStore.setPlayerGuess(guess);
  };

  // 结算完成
  const handleNextTurn = () => {
    setSelectedGuess(null);
    gameStore.nextTurn();
  };

  // 胜利处理
  const handleVictory = () => {
    progressStore.completeLevel(level.id, level.rewardCards);
    progressStore.updateProfile(level.id, gameStore.battleLog);
    // 从关卡选择器进来的，跳过胜利剧情直接回首页
    if (skipStory) {
      navigation.navigate('Home');
      return;
    }
    const winStory = getStoryById(level.storyWinId);
    if (winStory) {
      setStoryKey(level.storyWinId);
      setIsPostBattleStory(true);
      setShowStory(true);
    } else {
      navigation.navigate('Home');
    }
  };

  // 失败处理
  const handleDefeat = () => {
    progressStore.updateProfile(level.id, gameStore.battleLog);
    const loseStory = getStoryById(level.storyLoseId);
    if (loseStory) {
      setStoryKey(level.storyLoseId);
      setIsPostBattleStory(true);
      setShowStory(true);
    } else {
      navigation.navigate('Home');
    }
  };

  // 重试
  const handleRetry = () => {
    gameStore.initBattle(level, enemy, progressStore.playerDeck);
    setShowStory(false);
    setSelectedGuess(null);
    setTimeLeft(BASE_TIME_LIMIT);
    setShakeTrigger(0);
    setIsPostBattleStory(false);
  };

  // 返回
  const handleBack = () => {
    navigation.navigate('Home');
  };

  // 倒计时颜色
  const getTimerColor = () => {
    const timeLimit = getTimeLimit(gameStore.playerPressure);
    const ratio = timeLeft / timeLimit;
    if (ratio > 0.6) return '#2ecc71';
    if (ratio > 0.3) return '#f1c40f';
    return '#e74c3c';
  };

  // 判断牌是否被禁用
  const isCardDisabled = (card: Card) => {
    if (gameStore.phase !== 'select') return true;
    if (gameStore.disabledCardTypes.includes(card.type)) return true;
    if (gameStore.echoPhase && gameStore.usedCardTypes.includes(card.type)) return true;
    return false;
  };

  // 渲染特殊规则提示条
  const renderRuleHints = () => {
    const rules = gameStore.activeSpecialRules;
    if (rules.length === 0) return null;

    const hints: string[] = [];
    for (const rule of rules) {
      switch (rule.type) {
        case 'peek':
          // 旧版镜像局兼容，不再主动使用
          hints.push('👁️ 镜像：对手分析你的打法');
          break;
        case 'imitate':
          const turnCount = gameStore.currentTurn;
          const imitateAccuracy = turnCount <= 2 ? 30 : turnCount <= 4 ? 50 : 65;
          hints.push(`🪞 模仿：对手模仿你的出牌（${imitateAccuracy}%准确）`);
          break;
        case 'combo_boost':
          hints.push('🔥 连击：连击伤害翻倍');
          break;
        case 'pressure_boost':
          hints.push('⚡ 高压：压力增长翻倍');
          break;
        case 'rule_change':
          hints.push('📜 变规：每3回合规则变更');
          break;
        case 'hidden_card':
          hints.push(gameStore.hiddenCardRevealed ? '🂠 暗牌已揭示' : '🂠 暗牌：第5回合揭示');
          break;
        case 'resonance':
          hints.push('✨ 共鸣：同牌抵消伤害，错开才分胜负');
          break;
        case 'last_stand':
          hints.push('💀 背水：HP<10时攻击+2');
          break;
        case 'prophecy': {
          const prophecyLabels: Record<string, string> = { attack: '攻击', defense: '防御', mindread: '读心', trap: '陷阱', skip: '蓄力' };
          const prophecyLabel = gameStore.prophecyCard ? (prophecyLabels[gameStore.prophecyCard] ?? gameStore.prophecyCard) : '?';
          hints.push(`🔮 预言：影预言你出${prophecyLabel}`);
          break;
        }
        case 'phase_shift': {
          const abilityNames = gameStore.gainedAbilities.length > 0
            ? gameStore.gainedAbilities.map(a => {
                const names: Record<string, string> = { rule_change: '规则扭曲', resonance: '共鸣', last_stand: '背水一战', prophecy: '预言' };
                return names[a] || a;
              }).join('、')
            : '无';
          hints.push(`🎭 庄主阶段 ${gameStore.bossPhase}/3 | 习得：${abilityNames}`);
          break;
        }
      }
    }

    // 第6关起：记牌提示
    const currentLevelId = gameStore.level?.id ?? 1;
    if (currentLevelId >= 6) {
      const playedCount = gameStore.playerPlayedCards.length;
      const handCount = gameStore.playerHand.length;
      if (playedCount > 0) {
        hints.push(`🧠 对手记牌：已记录你${playedCount}次出牌`);
      }
    }

    // 加上禁用牌型提示
    if (gameStore.disabledCardTypes.length > 0) {
      const typeNames: Record<CardType, string> = {
        attack: '攻击', defense: '防御', mindread: '读心', trap: '陷阱', skip: '蓄力',
      };
      hints.push(`🚫 禁用：${gameStore.disabledCardTypes.map(t => typeNames[t]).join('、')}`);
    }

    return (
      <View style={styles.ruleHintsContainer}>
        {hints.map((hint, i) => (
          <Text key={i} style={styles.ruleHintText}>{hint}</Text>
        ))}
      </View>
    );
  };

  // 渲染规则变更通知弹窗
  const renderRuleNotification = () => {
    const notification = gameStore.ruleChangeNotification;
    if (!notification) return null;

    return (
      <View style={styles.ruleNotificationOverlay}>
        <View style={styles.ruleNotificationCard}>
          <Text style={styles.ruleNotificationTitle}>{notification.title}</Text>
          <Text style={styles.ruleNotificationMessage}>{notification.message}</Text>
          <TouchableOpacity
            style={styles.ruleNotificationButton}
            onPress={() => gameStore.dismissRuleNotification()}
          >
            <Text style={styles.ruleNotificationButtonText}>知道了</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 渲染补牌展示
  const renderRefill = () => {
    const info = gameStore.refillInfo;
    if (!info) return null;

    // 根据补牌原因和数量动态生成文案（支持混合场景：手牌耗尽+蓄力同时发生）
    const playerCount = info.playerRefillCards.length;
    const enemyCount = info.enemyRefillCards.length;

    let whoText: string;
    let subtitleText: string;

    if (info.reason === 'discard_disabled') {
      whoText = info.whoRefilled === 'both'
        ? '双方手牌被禁用，已丢弃补发！'
        : info.whoRefilled === 'player'
          ? '你的手牌被禁用，已丢弃补发！'
          : '对手手牌被禁用，已丢弃补发！';
      subtitleText = '被禁用的牌已丢弃，补发新牌（双方可见）';
    } else if (info.reason === 'skip') {
      whoText = info.whoRefilled === 'both'
        ? '双方蓄力生效！'
        : info.whoRefilled === 'player'
          ? '你的蓄力生效！'
          : '对手蓄力生效！';
      subtitleText = '蓄力补发2张牌（双方可见）';
    } else {
      // empty 场景，但可能有蓄力叠加（如：一方手牌耗尽，另一方蓄力补牌）
      const playerReason = playerCount > 3 ? '手牌耗尽+蓄力' : playerCount === 3 ? '手牌耗尽' : playerCount === 2 ? '蓄力' : '';
      const enemyReason = enemyCount > 3 ? '手牌耗尽+蓄力' : enemyCount === 3 ? '手牌耗尽' : enemyCount === 2 ? '蓄力' : '';

      if (playerReason && enemyReason) {
        whoText = '双方补牌！';
      } else if (playerReason) {
        whoText = playerCount > 3 ? '你的手牌耗尽+蓄力生效！' : playerCount === 3 ? '你的手牌耗尽！' : '你的蓄力生效！';
      } else if (enemyReason) {
        whoText = enemyCount > 3 ? '对手手牌耗尽+蓄力生效！' : enemyCount === 3 ? '对手手牌耗尽！' : '对手蓄力生效！';
      } else {
        whoText = '补牌';
      }
      subtitleText = `补发新牌（双方可见）`;
    }

    return (
      <View style={styles.refillOverlay}>
        <View style={styles.refillCard}>
          <Text style={styles.refillTitle}>🔄 {whoText}</Text>
          <Text style={styles.refillSubtitle}>{subtitleText}</Text>

          {info.playerRefillCards.length > 0 && (
            <View style={styles.refillSection}>
              <Text style={styles.refillSectionTitle}>你补到的牌：</Text>
              <View style={styles.refillCardsRow}>
                {info.playerRefillCards.map((card, i) => (
                  <CardComponent key={`prefill_${i}`} card={card} size="small" />
                ))}
              </View>
            </View>
          )}

          {info.enemyRefillCards.length > 0 && (
            <View style={styles.refillSection}>
              <Text style={styles.refillSectionTitle}>对手补到的牌 👁️：</Text>
              <View style={styles.refillCardsRow}>
                {info.enemyRefillCards.map((card, i) => (
                  <CardComponent key={`erefill_${i}`} card={card} size="small" />
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.refillButton} onPress={() => gameStore.confirmRefill()}>
            <Text style={styles.refillButtonText}>确认，继续对战 ▸</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 渲染读心猜测界面
  const renderMindreadGuess = () => {
    const guessOptions: { type: CardType; label: string; icon: string }[] = [
      { type: 'attack', label: '攻击', icon: '⚔️' },
      { type: 'defense', label: '防御', icon: '🛡️' },
      { type: 'mindread', label: '读心', icon: '👁️' },
      { type: 'trap', label: '陷阱', icon: '💣' },
      { type: 'skip', label: '蓄力', icon: '🃏' },
    ];

    return (
      <View style={styles.guessOverlay}>
        <Text style={styles.guessTitle}>👁️ 你猜对手出了什么牌？</Text>
        <View style={styles.guessGrid}>
          {guessOptions.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.guessButton,
                selectedGuess === opt.type && styles.guessSelected,
              ]}
              onPress={() => handleGuessSelect(opt.type)}
            >
              <Text style={styles.guessIcon}>{opt.icon}</Text>
              <Text style={styles.guessLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 渲染结算结果
  const renderResolveResult = () => {
    const result = gameStore.lastRoundResult;
    if (!result) return null;

    return (
      <View style={styles.resolveOverlay}>
        <View style={styles.resolveCard}>
          <View style={styles.revealRow}>
            <View style={styles.revealSide}>
              <Text style={styles.revealLabel}>你的牌</Text>
              <FlipCard card={result.playerCard} delay={200} size="large" />
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.revealSide}>
              <Text style={styles.revealLabel}>对手牌</Text>
              <FlipCard card={result.enemyCard} delay={500} size="large" />
            </View>
          </View>

          {result.specialTrigger ? (
            <Text style={styles.specialTrigger}>{result.specialTrigger}</Text>
          ) : null}
          <View style={styles.damageRow}>
            <Text style={[styles.damageText, { color: '#e74c3c' }]}>
              你 -{result.playerDamage} HP
            </Text>
            <Text style={[styles.damageText, { color: '#2ecc71' }]}>
              对手 -{result.enemyDamage} HP
            </Text>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleNextTurn}>
            <Text style={styles.continueButtonText}>继续 ▸</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ShakeView trigger={shakeTrigger} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 对手区域 */}
      <View style={styles.enemySection}>
        <View style={[styles.enemyPortrait, { backgroundColor: enemy.portraitColor }]}>
          <Text style={styles.enemyNameDisplay}>{enemy.name}</Text>
          <Text style={styles.enemyTitleDisplay}>{enemy.title}</Text>
          {/* 庄主阶段指示 */}
          {gameStore.bossPhase > 1 && (
            <View>
              <Text style={styles.bossPhaseText}>阶段 {gameStore.bossPhase}/3</Text>
              {gameStore.gainedAbilities.length > 0 && (
                <Text style={styles.bossAbilityText}>
                  {gameStore.gainedAbilities.map(a => {
                    const names: Record<string, string> = { rule_change: '规则扭曲', resonance: '共鸣', last_stand: '背水一战', prophecy: '预言' };
                    return names[a] || a;
                  }).join(' ')}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.enemyBars}>
          <HPBar current={gameStore.enemyHP} max={gameStore.enemyMaxHP} label={enemy.name} />
          <PressureBar pressure={gameStore.enemyPressure} label={`${enemy.name}压力`} />
        </View>

        {gameStore.enemySelectedCard && gameStore.phase === 'resolve' && (
          <View style={styles.enemyPlayedCard}>
            <CardComponent card={gameStore.enemySelectedCard} size="medium" />
          </View>
        )}
        {gameStore.phase === 'select' && (
          <View style={styles.enemyThinking}>
            <Text style={styles.thinkingText}>🤔 思考中...</Text>
            <Text style={styles.enemyCardCount}>手牌: {gameStore.enemyHand.length}张</Text>
          </View>
        )}
      </View>

      {/* 中间信息区 */}
      <View style={styles.middleSection}>
        <View style={styles.turnInfoRow}>
          <View style={styles.turnInfoLine} />
          <Text style={styles.turnInfo}>第 {gameStore.currentTurn} 回合</Text>
          <View style={styles.turnInfoLine} />
        </View>
        {gameStore.phase === 'select' && (
          <View style={styles.timerContainer}>
            <Animated.Text
              style={[
                styles.timerText,
                { color: getTimerColor(), opacity: timeLeft <= 5 ? timerFlashAnim : 1 },
              ]}
            >
              {timeLeft}s
            </Animated.Text>
            {gameStore.playerPressure > 0 && (
              <Text style={styles.pressureTimerHint}>
                压力 -{getTimeLimit(0) - getTimeLimit(gameStore.playerPressure)}s
              </Text>
            )}
          </View>
        )}
        {gameStore.lastRoundResult?.specialTrigger && gameStore.phase === 'select' && (
          <Text style={styles.lastTurnHint}>
            上回合: {gameStore.lastRoundResult.specialTrigger}
          </Text>
        )}
        {/* 特殊规则提示 */}
        {renderRuleHints()}
      </View>

      {/* 玩家区域 */}
      <View style={styles.playerSection}>
        <View style={styles.playerHeader}>
          <View style={styles.playerBars}>
            <HPBar current={gameStore.playerHP} max={gameStore.playerMaxHP} label="你" isPlayer />
            <PressureBar pressure={gameStore.playerPressure} label="你的压力" />
          </View>
        </View>

        {/* 手牌区 */}
        <View style={styles.handSection}>
          <Text style={styles.handLabel}>
            {gameStore.phase === 'select'
              ? gameStore.playerSelectedCard
                ? '已选牌，确认出牌 ↓'
                : '选择出牌 ▾'
              : ''}
          </Text>
          {/* 外层 View 撑出上方空间，让上弹卡牌不被裁剪 */}
          <View style={styles.handScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.handScroll, { overflow: 'visible' } as any]}
              contentContainerStyle={styles.handScrollContent}
              // @ts-ignore web: 覆盖 RNW 默认的 overflow-y:hidden
            >
              {gameStore.playerHand.map((card, index) => (
                <CardComponent
                  key={`${card.id}_${index}`}
                  card={card}
                  isSelected={gameStore.playerSelectedCard === card}
                  isDisabled={isCardDisabled(card)}
                  onPress={handleCardPress}
                  size="medium"
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 确认出牌按钮 */}
        {gameStore.phase === 'select' && gameStore.playerSelectedCard && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPlay}
          >
            <Text style={styles.confirmButtonText}>
              ⚡ 确认出牌 · {gameStore.playerSelectedCard.icon} {gameStore.playerSelectedCard.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 规则变更通知 */}
      {renderRuleNotification()}

      {/* 补牌展示覆盖层 */}
      {gameStore.phase === 'refill' && renderRefill()}

      {/* 读心猜测覆盖层 */}
      {gameStore.phase === 'mindread_guess' && renderMindreadGuess()}

      {/* 结算结果覆盖层 */}
      {gameStore.phase === 'resolve' && renderResolveResult()}

      {/* 胜利/失败覆盖层 */}
      {(gameStore.phase === 'victory' || gameStore.phase === 'defeat') && (
        <BattleResult
          isVictory={gameStore.phase === 'victory'}
          levelName={level.name}
          enemyName={enemy.name}
          rewardSummary={level.rewardSummary}
          onContinue={gameStore.phase === 'victory' ? handleVictory : handleBack}
          onRetry={handleRetry}
        />
      )}

      {/* 剧情对话框 */}
      {showStory && (() => {
        const story = getStoryById(storyKey);
        if (!story) return null;
        return (
          <DialogBox
            lines={story.lines}
            onComplete={handleStoryComplete}
          />
        );
      })()}

      {/* 浮动伤害数字 */}
      {floatDamages.map((fd) => (
        <FloatDamage key={fd.id} value={fd.value} isPlayer={fd.isPlayer} />
      ))}
    </ShakeView>
  );
}

// 浮动伤害数字组件
function FloatDamage({ value, isPlayer }: { value: number; isPlayer: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.Text
      style={[
        floatStyles.text,
        {
          color: isPlayer ? '#e74c3c' : '#2ecc71',
          transform: [{ translateY }],
          opacity,
          // 玩家伤害在左，敌方伤害在右
          left: isPlayer ? '25%' : undefined,
          right: isPlayer ? undefined : '25%',
        },
      ]}
    >
      -{value}
    </Animated.Text>
  );
}

const floatStyles = StyleSheet.create({
  text: {
    position: 'absolute',
    top: '45%',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    // @ts-ignore web only
    pointerEvents: 'none',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    // @ts-ignore web only — 暗红径向渐变 + 极淡网格纹理
    backgroundImage: [
      'radial-gradient(ellipse at 50% 55%, rgba(180,30,30,0.13) 0%, transparent 65%)',
      'radial-gradient(ellipse at 50% 50%, rgba(200,160,40,0.06) 0%, transparent 55%)',
      'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '100% 100%, 100% 100%, 44px 44px, 44px 44px',
  },
  enemySection: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  enemyPortrait: {
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // @ts-ignore web only — 暗角效果
    boxShadow: 'inset 0 -20px 30px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  enemyNameDisplay: {
    color: '#eee',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  enemyTitleDisplay: {
    color: '#777',
    fontSize: 12,
    letterSpacing: 1,
  },
  bossPhaseText: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bossAbilityText: {
    color: '#f39c12',
    fontSize: 9,
    marginTop: 1,
  },
  enemyBars: {
    marginBottom: 4,
  },
  enemyPlayedCard: {
    alignItems: 'center',
    marginVertical: 4,
  },
  enemyThinking: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  thinkingText: {
    color: '#666',
    fontSize: 14,
  },
  enemyCardCount: {
    color: '#555',
    fontSize: 11,
  },
  middleSection: {
    alignItems: 'center',
    paddingVertical: 4,
    flex: 1,  // 让中间区域自然撑开，避免玩家区域上侵
  },
  turnInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 2,
  },
  turnInfoLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(241,196,15,0.15)',
  },
  turnInfo: {
    color: '#f1c40f',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginHorizontal: 12,
  },
  timerContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  pressureTimerHint: {
    color: '#e74c3c',
    fontSize: 10,
    marginTop: 2,
  },
  lastTurnHint: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  // 特殊规则提示
  ruleHintsContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ruleHintText: {
    color: '#e67e22',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  // 规则变更通知弹窗
  ruleNotificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  ruleNotificationCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e67e22',
  },
  ruleNotificationTitle: {
    color: '#e67e22',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  ruleNotificationMessage: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  ruleNotificationButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  ruleNotificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerSection: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexShrink: 0,  // 防止内容被压缩导致重叠
  },
  playerHeader: {
    marginBottom: 20,
  },
  playerBars: {
    // 不用 flex，让内容自然撑开，避免压迫手牌区
  },
  handSection: {
    marginTop: 8,
    marginBottom: 10,
  },
  handLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 4,
    textAlign: 'center',
  },
  handScrollWrapper: {
    paddingTop: 8,
    // @ts-ignore web: 允许卡牌上弹溢出显示
    overflow: 'visible',
  },
  handScroll: {
    // overflow:visible 在 JSX 内联 style 中设置，覆盖 RNW 默认 overflow-y:hidden
  },
  handScrollContent: {
    paddingTop: 20,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  confirmButton: {
    backgroundColor: '#f1c40f',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
    // @ts-ignore web only
    boxShadow: '0 2px 12px rgba(241,196,15,0.3)',
  },
  confirmButtonText: {
    color: '#0a0a0a',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  // 补牌展示
  refillOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refillCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e67e22',
  },
  refillTitle: {
    color: '#e67e22',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  refillSubtitle: {
    color: '#999',
    fontSize: 13,
    marginBottom: 16,
  },
  refillSection: {
    width: '100%',
    marginBottom: 14,
  },
  refillSectionTitle: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  refillCardsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  refillButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 6,
  },
  refillButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 读心猜测
  guessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guessTitle: {
    color: '#9b59b6',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  guessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  guessButton: {
    width: 80,
    height: 80,
    backgroundColor: '#111',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  guessSelected: {
    borderColor: '#f1c40f',
    backgroundColor: 'rgba(241,196,15,0.08)',
  },
  guessIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  guessLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  // 结算
  resolveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  revealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  revealSide: {
    alignItems: 'center',
  },
  revealLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 6,
  },
  vsText: {
    color: '#f1c40f',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
    textShadowColor: 'rgba(241,196,15,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  specialTrigger: {
    color: '#f1c40f',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  damageRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  damageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#f1c40f',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 6,
  },
  continueButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
