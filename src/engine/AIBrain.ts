// src/engine/AIBrain.ts
// 对手 AI 决策系统 v4 — 读心对称化 + 跨关画像 + 记牌推算

import { Card, CardType } from '../data/cards';
import { Enemy, AIStrategy } from '../data/enemies';
import { BattleLogEntry } from '../store/gameStore';
import { PlayerProfile } from '../store/progressStore';

interface WeightedChoice {
  type: CardType;
  weight: number;
}

/** AI决策结果：出什么牌 + 读心猜测（AI出读心时有效） */
export interface AIDecision {
  cardType: CardType;
  mindreadGuess: CardType | null; // AI出读心时的猜测，不出读心时为null
}

/**
 * 从手牌中提取可用的牌型列表
 */
function getAvailableTypes(hand: Card[]): CardType[] {
  const typeSet = new Set<CardType>();
  for (const card of hand) {
    typeSet.add(card.type);
  }
  return Array.from(typeSet);
}

/**
 * 根据对方出牌类型，返回克制牌
 */
function getCounterCard(type: CardType): CardType {
  const counterMap: Record<CardType, CardType> = {
    attack: 'trap',       // 克制攻击用陷阱
    defense: 'mindread',  // 克制防御用读心
    mindread: 'skip',     // 克制读心用蓄力
    trap: 'defense',      // 克制陷阱用防御
    skip: 'attack',       // 克制蓄力用攻击
  };
  return counterMap[type];
}

/**
 * 根据策略和当前局面，决定 AI 本回合出什么牌
 * 
 * @param profile 跨关出牌画像（镜像局核心数据）
 * @param playerPlayedCards 玩家本局已出的牌（记牌推算用）
 * @param playerHandSize 玩家当前手牌数（记牌推算用）
 * @param refillCards 玩家补到的牌（记牌推算用）
 * @param levelId 当前关卡ID（决定记牌能力等级）
 * @returns AIDecision 包含出牌类型和读心猜测
 */
export function decideEnemyCard(
  enemy: Enemy,
  playerHP: number,
  enemyHP: number,
  currentTurn: number,
  battleLog: BattleLogEntry[],
  enemyPressure: number,
  enemyHand: Card[],
  disabledTypes: CardType[] = [],
  echoDisabledTypes: CardType[] = [],
  playerPeekCard: Card | null = null,
  // v3 新参数
  profile: PlayerProfile | null = null,
  playerPlayedCards: CardType[] = [],
  playerHandSize: number = 6,
  playerRefillCards: CardType[] = [],
  levelId: number = 1,
  specialRuleTypes: string[] = [],
  prophecyCard: CardType | null = null,
): AIDecision {
  // 手牌为空时 fallback
  if (enemyHand.length === 0) {
    return { cardType: randomCard(), mindreadGuess: null };
  }

  let available = getAvailableTypes(enemyHand);

  // 过滤掉被禁用的牌型
  available = available.filter(t => !disabledTypes.includes(t) && !echoDisabledTypes.includes(t));

  // 如果过滤后没有可用的牌，从原始可用牌中选
  if (available.length === 0) {
    available = getAvailableTypes(enemyHand);
  }

  // 只有1种牌型时直接出
  if (available.length === 1) {
    const cardType = available[0];
    return { cardType, mindreadGuess: cardType === 'mindread' ? guessPlayerCard(profile, battleLog, currentTurn, playerHP, enemyHP, playerPlayedCards, playerHandSize, playerRefillCards, levelId) : null };
  }

  // 压力崩溃：从手牌中随机选
  if (enemyPressure >= 100) {
    const cardType = randomFromAvailable(available);
    return { cardType, mindreadGuess: cardType === 'mindread' ? guessPlayerCard(profile, battleLog, currentTurn, playerHP, enemyHP, playerPlayedCards, playerHandSize, playerRefillCards, levelId) : null };
  }

  let chosenCard: CardType | null = null;

  // ====== 预言局（prophecy）：影利用预言信息出克制牌 ======
  // 影预言了玩家要出的牌，自然会出克制牌来配合预言
  // 但前期不敢全信自己的预言，越往后越信任
  if (prophecyCard && specialRuleTypes.includes('prophecy')) {
    const counterCard = getCounterCard(prophecyCard);
    // 前期试探：第1-2回合40%，第3-4回合60%，第5回合起80%
    let followRate: number;
    if (currentTurn <= 2) followRate = 0.4;
    else if (currentTurn <= 4) followRate = 0.6;
    else followRate = 0.8;
    if (available.includes(counterCard) && Math.random() < followRate) {
      chosenCard = counterCard;
    }
    // 克制牌不可用或不跟预言，fallback到后续策略
  }

  // ====== 共鸣局（resonance）：哑巴的共鸣策略 ======
  if (!chosenCard && specialRuleTypes.includes('resonance')) {
    const resonanceResult = resonanceStrategy(battleLog, playerHP, enemyHP, available, levelId, profile);
    if (resonanceResult) chosenCard = resonanceResult;
  }

  // ====== 镜像局（imitate）：基于本局短期模仿 ======
  if (!chosenCard && specialRuleTypes.includes('imitate') && battleLog.length >= 1) {
    const imitateResult = imitateStrategy(battleLog, available);
    if (imitateResult) chosenCard = imitateResult;
  }

  // ====== 跨关画像：高关卡AI通用能力（非镜像局专属） ======
  if (!chosenCard && profile && profile.totalTurns >= 3 && levelId >= 6) {
    const predicted = predictPlayerCard(profile, battleLog, currentTurn, playerHP, playerHP + enemyHP);
    if (predicted && Math.random() < getProfileAccuracy(profile)) {
      const counterCard = getCounterCard(predicted);
      if (available.includes(counterCard)) {
        chosenCard = counterCard;
      }
    }
  }

  // ====== 记牌系统：第6关起生效 ======
  if (!chosenCard && levelId >= 6 && playerHandSize > 0) {
    const deduction = deducePlayerHand(playerPlayedCards, playerHandSize, playerRefillCards);

    // 如果推算出玩家只剩1种牌型，针对性出牌
    if (deduction.certainTypes.length === 1) {
      const counterCard = getCounterCard(deduction.certainTypes[0]);
      if (available.includes(counterCard)) {
        chosenCard = counterCard;
      }
    }

    // 如果推算出玩家大概率有某种牌，且自己有读心牌，优先出读心
    if (!chosenCard && deduction.mostLikelyType && available.includes('mindread')) {
      // 玩家大概率出某种牌，读心猜中收益高
      if (deduction.confidence >= 0.7 && Math.random() < deduction.confidence) {
        chosenCard = 'mindread';
      }
    }

    // 如果推算出玩家没有攻击牌，可以放心出陷阱
    if (!chosenCard && !deduction.possibleTypes.includes('attack') && available.includes('trap')) {
      chosenCard = 'trap';
    }
    // 如果推算出玩家没有陷阱牌，可以放心出攻击
    if (!chosenCard && !deduction.possibleTypes.includes('trap') && available.includes('attack')) {
      chosenCard = 'attack';
    }
  }

  // ====== 基础策略 ======
  if (!chosenCard) {
    switch (enemy.aiStrategy) {
      case 'random':
        chosenCard = randomFromAvailable(available);
        break;

      case 'aggressive':
        chosenCard = weightedRandomFromAvailable([
          { type: 'attack', weight: enemy.aiParams.attackBias },
          { type: 'trap', weight: enemy.aiParams.trapBias },
          { type: 'defense', weight: 0.1 },
          { type: 'mindread', weight: 0.1 },
          { type: 'skip', weight: 0.05 },
        ], available);
        break;

      case 'defensive':
        chosenCard = weightedRandomFromAvailable([
          { type: 'defense', weight: 0.4 },
          { type: 'trap', weight: enemy.aiParams.trapBias },
          { type: 'attack', weight: 0.15 },
          { type: 'mindread', weight: 0.1 },
          { type: 'skip', weight: 0.05 },
        ], available);
        break;

      case 'counter':
        chosenCard = counterStrategy(battleLog, enemy.aiParams.bluffRate, available);
        break;

      case 'adaptive':
        chosenCard = adaptiveStrategy(enemy, playerHP, enemyHP, currentTurn, battleLog, available, levelId, profile);
        break;

      default:
        chosenCard = randomFromAvailable(available);
    }
  }

  // ====== AI读心猜测 ======
  // AI出读心时需要猜测玩家出什么牌，猜测质量由关卡/画像/记牌决定
  const mindreadGuess = chosenCard === 'mindread'
    ? guessPlayerCard(profile, battleLog, currentTurn, playerHP, enemyHP, playerPlayedCards, playerHandSize, playerRefillCards, levelId)
    : null;

  return { cardType: chosenCard, mindreadGuess };
}

// ====== 模仿策略（镜像局专用）======

/**
 * 模仿策略：镜子根据本局玩家最近的出牌模式来预测并克制
 * 
 * 核心逻辑：
 * - 回合1-2：模仿本能较弱，只有30%概率正确预判
 * - 回合3-4：逐渐学会，50%概率
 * - 回合5+：模仿能力成熟，65%概率
 * 
 * 与跨关画像不同，这是纯本局内的短期学习
 */
function imitateStrategy(
  battleLog: BattleLogEntry[],
  available: CardType[],
): CardType | null {
  // 分析本局最近出牌
  const recentCount = Math.min(battleLog.length, 4);
  const recent = battleLog.slice(-recentCount);

  // 统计最近出牌频率
  const typeCount: Record<string, number> = {};
  for (const entry of recent) {
    typeCount[entry.playerCardType] = (typeCount[entry.playerCardType] || 0) + 1;
  }

  // 找到最频繁的牌型
  let mostFrequent: CardType | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = type as CardType;
    }
  }

  if (!mostFrequent) return null;

  // 模仿准确率随回合数递增
  const turnCount = battleLog.length;
  let accuracy: number;
  if (turnCount <= 2) accuracy = 0.3;
  else if (turnCount <= 4) accuracy = 0.5;
  else accuracy = 0.65;

  if (Math.random() < accuracy) {
    const counterCard = getCounterCard(mostFrequent);
    if (available.includes(counterCard)) {
      return counterCard;
    }
  }

  return null;
}

// ====== 画像预测系统 ======

/**
 * 基于画像预测玩家最可能出的牌型
 */
function predictPlayerCard(
  profile: PlayerProfile,
  battleLog: BattleLogEntry[],
  currentTurn: number,
  playerHP: number,
  playerMaxHP: number,
): CardType | null {
  // 综合多个维度的预测，加权投票
  const votes: Record<string, number> = {};

  // 维度1：首回合偏好
  if (currentTurn === 0 || currentTurn === 1) {
    mergeVotes(votes, profile.firstTurnFrequency, 1.5);
  }

  // 维度2：受伤后偏好
  const lastLog = battleLog[battleLog.length - 1];
  if (lastLog && lastLog.playerDamage > 0) {
    mergeVotes(votes, profile.afterDamageFrequency, 1.3);
  }

  // 维度3：造成伤害后偏好
  if (lastLog && lastLog.enemyDamage > 0) {
    mergeVotes(votes, profile.afterHealFrequency, 1.0);
  }

  // 维度4：低血量偏好
  if (playerHP <= playerMaxHP * 0.3) {
    mergeVotes(votes, profile.lowHPFrequency, 1.2);
  }

  // 维度5：全局频率偏好（基础权重最低）
  mergeVotes(votes, profile.typeFrequency, 0.5);

  // 维度6：当前局内的短期习惯（最近2回合）
  if (battleLog.length >= 2) {
    const recent = battleLog.slice(-2);
    for (const entry of recent) {
      votes[entry.playerCardType] = (votes[entry.playerCardType] || 0) + 0.8;
    }
  }

  // 找得票最高的牌型
  let bestType: CardType | null = null;
  let bestScore = 0;
  for (const [type, score] of Object.entries(votes)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type as CardType;
    }
  }

  return bestType;
}

/**
 * 合并画像维度的投票权重
 */
function mergeVotes(votes: Record<string, number>, frequency: Record<string, number>, weight: number): void {
  const total = Object.values(frequency).reduce((s, c) => s + c, 0);
  if (total === 0) return;
  for (const [type, count] of Object.entries(frequency)) {
    votes[type] = (votes[type] || 0) + (count / total) * weight;
  }
}

/**
 * 画像越丰富，预测越准确
 * 数据少时准确率低，数据多时准确率高，但永远不超过85%
 */
function getProfileAccuracy(profile: PlayerProfile): number {
  const turns = profile.totalTurns;
  if (turns < 5) return 0.3;
  if (turns < 10) return 0.45;
  if (turns < 20) return 0.6;
  if (turns < 35) return 0.75;
  return 0.85; // 上限
}

// ====== 记牌推算系统 ======

interface HandDeduction {
  possibleTypes: CardType[];      // 玩家可能有的牌型
  certainTypes: CardType[];       // 玩家一定有的牌型（手牌很少时）
  mostLikelyType: CardType | null; // 最可能的牌型
  confidence: number;             // 推算置信度 0-1
}

/**
 * 记牌推算：根据玩家已出的牌和补到的牌，推算剩余手牌
 * 
 * 逻辑：初始手牌6张 + 补到的牌 - 已出的牌 = 剩余手牌
 * 如果手牌很少，推算精度极高
 */
function deducePlayerHand(
  playerPlayedCards: CardType[],
  playerHandSize: number,
  playerRefillCards: CardType[],
): HandDeduction {
  // 已出的牌型统计
  const playedCount: Record<string, number> = {};
  for (const type of playerPlayedCards) {
    playedCount[type] = (playedCount[type] || 0) + 1;
  }

  // 补到的牌型统计
  const refillCount: Record<string, number> = {};
  for (const type of playerRefillCards) {
    refillCount[type] = (refillCount[type] || 0) + 1;
  }

  // 标准初始手牌分布（6张：攻2防1读1陷1蓄1）
  const standardDistribution: Record<string, number> = {
    attack: 2, defense: 1, mindread: 1, trap: 1, skip: 1,
  };

  // 推算剩余各牌型数量 = 初始 + 补牌 - 已出
  const remaining: Record<string, number> = {};
  const allTypes: CardType[] = ['attack', 'defense', 'mindread', 'trap', 'skip'];

  for (const type of allTypes) {
    remaining[type] = (standardDistribution[type] || 0) + (refillCount[type] || 0) - (playedCount[type] || 0);
  }

  // 玩家可能有的牌型（剩余数量 > 0 的）
  const possibleTypes = allTypes.filter(t => remaining[t] > 0);

  // 如果手牌数 <= 可能牌型数，说明某些牌型一定有
  let certainTypes: CardType[] = [];
  if (playerHandSize <= possibleTypes.length) {
    // 按剩余数量降序排列，手牌数内的牌型是"一定有"的
    const sorted = [...possibleTypes].sort((a, b) => remaining[b] - remaining[a]);
    certainTypes = sorted.slice(0, playerHandSize);
  }

  // 手牌只有1张时，推算最准确
  if (playerHandSize === 1 && possibleTypes.length > 0) {
    // 剩余最多或最近未出的牌型
    const sorted = [...possibleTypes].sort((a, b) => remaining[b] - remaining[a]);
    return {
      possibleTypes,
      certainTypes: [sorted[0]],
      mostLikelyType: sorted[0],
      confidence: 0.9,
    };
  }

  // 手牌2张时
  if (playerHandSize === 2 && possibleTypes.length <= 3) {
    const sorted = [...possibleTypes].sort((a, b) => remaining[b] - remaining[a]);
    return {
      possibleTypes,
      certainTypes,
      mostLikelyType: sorted[0],
      confidence: 0.7,
    };
  }

  // 手牌较多时，推算精度降低
  const sorted = [...possibleTypes].sort((a, b) => remaining[b] - remaining[a]);
  const confidence = Math.max(0.3, 1 - playerHandSize / 10);
  return {
    possibleTypes,
    certainTypes: [],
    mostLikelyType: sorted[0] || null,
    confidence,
  };
}

// ====== 策略函数 ======

/**
 * 纯随机出牌（无手牌限制时的 fallback）
 */
function randomCard(): CardType {
  const types: CardType[] = ['attack', 'defense', 'mindread', 'trap', 'skip'];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * 从手牌可用牌型中随机选一张
 */
function randomFromAvailable(available: CardType[]): CardType {
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * 加权随机选择（受手牌可用牌型限制）
 */
function weightedRandomFromAvailable(choices: WeightedChoice[], available: CardType[]): CardType {
  const filtered = choices.filter(c => available.includes(c.type));

  if (filtered.length === 0) {
    return randomFromAvailable(available);
  }

  const totalWeight = filtered.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;

  for (const choice of filtered) {
    random -= choice.weight;
    if (random <= 0) {
      return choice.type;
    }
  }

  return filtered[0].type;
}

/**
 * 反制策略：分析玩家最近出牌习惯，针对性出牌（受手牌限制）
 */
function counterStrategy(battleLog: BattleLogEntry[], bluffRate: number, available: CardType[]): CardType {
  // 伪装：有一定概率从手牌中随机出
  if (Math.random() < bluffRate) {
    return randomFromAvailable(available);
  }

  // 分析最近3回合玩家出牌
  const recentTurns = battleLog.slice(-3);
  if (recentTurns.length === 0) {
    return randomFromAvailable(available);
  }

  // 统计玩家最常用的牌型
  const typeCount: Record<string, number> = {};
  for (const entry of recentTurns) {
    typeCount[entry.playerCardType] = (typeCount[entry.playerCardType] || 0) + 1;
  }

  // 找出玩家最常用的牌型
  let mostUsed: CardType = 'attack';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsed = type as CardType;
    }
  }

  // 针对性反制
  const counterCard = getCounterCard(mostUsed);

  if (available.includes(counterCard)) {
    return counterCard;
  }

  return randomFromAvailable(available);
}

/**
 * 共鸣策略：哑巴的核心AI
 *
 * 核心思路：预测玩家出的牌，然后决定"对冲"还是"错开"
 * - HP优势时 → 倾向对冲（出同牌，0伤害，消耗玩家回合）
 * - HP劣势时 → 倾向错开（出克制牌，造成伤害翻盘）
 * - 中期 → 混合，增加不可预测性
 */
function resonanceStrategy(
  battleLog: BattleLogEntry[],
  playerHP: number,
  enemyHP: number,
  available: CardType[],
  levelId: number,
  profile: PlayerProfile | null,
): CardType | null {
  // 预测玩家出牌
  let predicted: CardType | null = null;

  // 优先用画像预测（第9关可以跨关画像）
  if (profile && profile.totalTurns >= 3) {
    predicted = predictPlayerCard(profile, battleLog, battleLog.length + 1, playerHP, playerHP + enemyHP);
  }

  // 没有画像或画像没预测到，用本局最近出牌分析
  if (!predicted && battleLog.length >= 1) {
    const recent = battleLog.slice(-3);
    const typeCount: Record<string, number> = {};
    for (const entry of recent) {
      typeCount[entry.playerCardType] = (typeCount[entry.playerCardType] || 0) + 1;
    }
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > maxCount) {
        maxCount = count;
        predicted = type as CardType;
      }
    }
  }

  // 没有任何预测数据，随机出
  if (!predicted) return null;

  // 决策：对冲还是错开
  const hpAdvantage = enemyHP - playerHP;
  let echoProbability: number; // 出同牌（对冲）的概率

  if (hpAdvantage > 4) {
    // HP大幅领先：70%对冲，消耗玩家回合
    echoProbability = 0.7;
  } else if (hpAdvantage > 0) {
    // HP小幅领先：50%对冲
    echoProbability = 0.5;
  } else if (hpAdvantage > -4) {
    // HP小幅落后：30%对冲，70%错开打伤害
    echoProbability = 0.3;
  } else {
    // HP大幅落后：15%对冲，主要错开打伤害翻盘
    echoProbability = 0.15;
  }

  // 预测准确率（越往后越准）
  const predictionAccuracy = Math.min(0.7, 0.35 + battleLog.length * 0.05);

  if (Math.random() < predictionAccuracy) {
    // 预测成功
    if (Math.random() < echoProbability) {
      // 对冲：出同牌
      if (available.includes(predicted)) {
        return predicted;
      }
    } else {
      // 错开：出克制牌
      const counterCard = getCounterCard(predicted);
      if (available.includes(counterCard)) {
        return counterCard;
      }
    }
  }

  // 预测失败或没有可用牌，fallback到counter策略
  return null;
}

/**
 * 自适应策略：Boss专用，综合分析动态切换（受手牌限制）
 * v3: 融合画像和记牌
 */
function adaptiveStrategy(
  enemy: Enemy,
  playerHP: number,
  enemyHP: number,
  currentTurn: number,
  battleLog: BattleLogEntry[],
  available: CardType[],
  levelId: number,
  profile: PlayerProfile | null,
): CardType {
  // HP 低于30%时转为防御型
  if (enemyHP <= 5) {
    return weightedRandomFromAvailable([
      { type: 'defense', weight: 0.4 },
      { type: 'trap', weight: 0.35 },
      { type: 'attack', weight: 0.15 },
      { type: 'mindread', weight: 0.1 },
    ], available);
  }

  // 玩家HP低时猛攻
  if (playerHP <= 4) {
    return weightedRandomFromAvailable([
      { type: 'attack', weight: 0.5 },
      { type: 'trap', weight: 0.2 },
      { type: 'mindread', weight: 0.15 },
      { type: 'defense', weight: 0.1 },
      { type: 'skip', weight: 0.05 },
    ], available);
  }

  // 中期混合策略，参考反制逻辑
  if (currentTurn >= 3 && Math.random() < 0.4) {
    return counterStrategy(battleLog, enemy.aiParams.bluffRate, available);
  }

  // 默认均衡
  return weightedRandomFromAvailable([
    { type: 'attack', weight: 0.3 },
    { type: 'defense', weight: 0.2 },
    { type: 'mindread', weight: 0.2 },
    { type: 'trap', weight: 0.2 },
    { type: 'skip', weight: 0.1 },
  ], available);
}

// ====== AI读心猜测系统 ======

/**
 * AI出读心时的猜测逻辑：猜测玩家本回合出什么牌
 *
 * 猜测质量由以下因素决定：
 * - 低关卡（1-5）：纯随机猜测（20%命中率）
 * - 高关卡 + 记牌推算：根据推算结果猜测，手牌少时更准
 * - 画像数据：根据玩家跨关出牌习惯猜测
 * - 本局近况：参考近期出牌模式
 */
function guessPlayerCard(
  profile: PlayerProfile | null,
  battleLog: BattleLogEntry[],
  currentTurn: number,
  playerHP: number,
  enemyHP: number,
  playerPlayedCards: CardType[],
  playerHandSize: number,
  playerRefillCards: CardType[],
  levelId: number,
): CardType {
  const allTypes: CardType[] = ['attack', 'defense', 'mindread', 'trap', 'skip'];

  // ====== 优先级1：记牌推算（高关卡） ======
  if (levelId >= 6 && playerHandSize > 0) {
    const deduction = deducePlayerHand(playerPlayedCards, playerHandSize, playerRefillCards);

    // 玩家只剩1种牌型：100%猜中
    if (deduction.certainTypes.length === 1) {
      return deduction.certainTypes[0];
    }

    // 推算置信度高时，按概率选择最可能的牌型
    if (deduction.mostLikelyType && deduction.confidence >= 0.5) {
      // 置信度越高，跟随推算的概率越大
      if (Math.random() < deduction.confidence) {
        return deduction.mostLikelyType;
      }
    }

    // 排除不可能的牌型，从剩余牌型中选
    const possibleGuesses = allTypes.filter(t => deduction.possibleTypes.includes(t));
    if (possibleGuesses.length > 0 && possibleGuesses.length < allTypes.length) {
      // 加权选择：剩余数量越多的牌型越可能被猜
      const weights = possibleGuesses.map(t => {
        const remaining = (deduction as any).remaining?.[t];
        return typeof remaining === 'number' ? Math.max(remaining, 0.5) : 1;
      });
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      let rand = Math.random() * totalWeight;
      for (let i = 0; i < possibleGuesses.length; i++) {
        rand -= weights[i];
        if (rand <= 0) return possibleGuesses[i];
      }
      return possibleGuesses[possibleGuesses.length - 1];
    }
  }

  // ====== 优先级2：跨关画像 ======
  if (profile && profile.totalTurns >= 5) {
    const predicted = predictPlayerCard(profile, battleLog, currentTurn, playerHP, playerHP + enemyHP);
    if (predicted) {
      // 画像越丰富越信任，但不超过70%
      const trust = Math.min(0.7, getProfileAccuracy(profile) * 0.8);
      if (Math.random() < trust) {
        return predicted;
      }
    }
  }

  // ====== 优先级3：本局近期出牌模式 ======
  if (battleLog.length >= 2) {
    const recent = battleLog.slice(-3);
    const typeCount: Record<string, number> = {};
    for (const entry of recent) {
      typeCount[entry.playerCardType] = (typeCount[entry.playerCardType] || 0) + 1;
    }
    // 30%概率跟随近期模式
    if (Math.random() < 0.3) {
      let mostFrequent: CardType = 'attack';
      let maxCount = 0;
      for (const [type, count] of Object.entries(typeCount)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequent = type as CardType;
        }
      }
      return mostFrequent;
    }
  }

  // ====== 兜底：纯随机猜测 ======
  return allTypes[Math.floor(Math.random() * allTypes.length)];
}
