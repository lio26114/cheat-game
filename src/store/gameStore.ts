// src/store/gameStore.ts
// 游戏局内状态管理 v5 — 画像读人 + 记牌推算

import { create } from 'zustand';
import { Card, CardType, BASE_CARDS, getCardByType } from '../data/cards';
import { Level, SpecialRule } from '../data/levels';
import { Enemy } from '../data/enemies';
import { resolveCards, updateCombo, RoundResult, ComboState } from '../engine/CardResolver';
import { decideEnemyCard, AIDecision } from '../engine/AIBrain';
import { calculatePressureDelta, isPressureBroken } from '../engine/PressureSystem';
import { useAudioStore, SFXType } from './audioStore';
import { PlayerProfile } from '../store/progressStore';

export type BattlePhase = 'select' | 'mindread_guess' | 'reveal' | 'resolve' | 'result' | 'victory' | 'defeat' | 'refill' | 'rule_change';

export interface BattleLogEntry {
  turn: number;
  playerCardType: CardType;
  enemyCardType: CardType;
  playerDamage: number;
  enemyDamage: number;
  specialTrigger?: string;
}

// 补牌信息
export interface RefillInfo {
  playerRefillCards: Card[];   // 玩家补到的牌（对对手可见）
  enemyRefillCards: Card[];    // 对手补到的牌（对玩家可见）
  whoRefilled: 'player' | 'enemy' | 'both';  // 谁触发了补牌
  reason: 'empty' | 'skip' | 'discard_disabled';   // 补牌原因：手牌耗尽 or 蓄力效果 or 被禁用牌丢弃
}

// 特殊规则通知（用于UI弹窗提示）
export interface RuleNotification {
  title: string;
  message: string;
  onDismiss?: () => void;  // 通知关闭后的回调
}

export interface BattleState {
  // 关卡 & 对手信息
  level: Level | null;
  enemy: Enemy | null;

  // 玩家状态
  playerHP: number;
  playerMaxHP: number;
  playerPressure: number;
  playerHand: Card[];
  playerDeck: Card[];
  playerSelectedCard: Card | null;
  playerGuess: CardType | null; // 读心牌猜测

  // 对手状态
  enemyHP: number;
  enemyMaxHP: number;
  enemyPressure: number;
  enemyHand: Card[];          // 对手手牌
  enemyDeck: Card[];          // 对手牌库
  enemySelectedCard: Card | null;

  // 局面状态
  currentTurn: number;
  phase: BattlePhase;
  comboState: ComboState;
  lastRoundResult: RoundResult | null;
  battleLog: BattleLogEntry[];
  refillInfo: RefillInfo | null;  // 补牌信息
  playerSkipBonus: boolean;  // 玩家是否出过蓄力牌（下次补牌多补2张）
  enemySkipBonus: boolean;   // 对手是否出过蓄力牌
  pendingBattleResult: 'victory' | 'defeat' | null;  // 结算后待判定的胜负

  // ====== 特殊规则系统 ======
  activeSpecialRules: SpecialRule[];   // 当前生效的特殊规则
  pressureMultiplier: number;          // 压力增长倍率（高压局用）
  comboMultiplier: number;             // 连击伤害倍率（连击局用）
  lastStandActive: boolean;            // 背水局：HP<10时攻击+2
  prophecyCard: CardType | null;       // 预言局：影预言的牌型
  prophecyHit: boolean;                // 预言局：预言是否命中
  usedCardTypes: CardType[];           // 回声局：前3回合用过的牌型（之后禁用）— 保留兼容
  echoPhase: boolean;                  // 回声局：是否进入禁用阶段 — 保留兼容
  resonanceActive: boolean;            // 共鸣局：同牌0伤害
  hiddenCardType: CardType | null;     // 暗流局：隐藏牌的类型
  hiddenCardRevealed: boolean;         // 暗流局：隐藏牌是否已揭示
  enemyPeekCard: Card | null;          // 镜像局：对手看到的你的牌
  bossPhase: number;                   // 最终局：庄主当前阶段（1/2/3）
  gainedAbilities: string[];             // 最终局：庄主已习得的能力
  ruleChangeNotification: RuleNotification | null;  // 规则变更通知
  disabledCardTypes: CardType[];       // 当前禁用的牌型
  hasShownImitateNotification: boolean; // 镜像局模仿提示是否已弹过

  // ====== 画像 + 记牌系统 ======
  playerProfile: PlayerProfile | null;     // 跨关出牌画像（镜像局+高级AI用）
  playerPlayedCards: CardType[];           // 玩家本局已出的牌（记牌推算用）
  playerRefillCardTypes: CardType[];       // 玩家补到的牌型（记牌推算用）

  // Actions
  initBattle: (level: Level, enemy: Enemy, playerDeckIds: string[]) => void;
  selectCard: (card: Card) => void;
  confirmPlay: () => void;
  setPlayerGuess: (guess: CardType) => void;
  confirmSelection: () => void;
  nextTurn: () => void;
  confirmRefill: () => void;   // 确认补牌，继续对战
  dismissRuleNotification: () => void;
  showRuleNotification: (notification: RuleNotification) => void;
  setHasShownImitateNotification: (value: boolean) => void;
  resetBattle: () => void;
  setPlayerProfile: (profile: PlayerProfile) => void;
  cheatWin: () => void;  // 秘技：直接获胜
}

// 生成一副牌（根据ID列表）
function buildDeck(cardIds: string[]): Card[] {
  const deck: Card[] = [];
  for (const id of cardIds) {
    const card = BASE_CARDS.find((c) => c.id === id);
    if (card) deck.push({ ...card });
  }
  return deck;
}

// 洗牌
function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 随机生成补牌
function generateRefillCards(count: number = 3): Card[] {
  const types: CardType[] = ['attack', 'attack', 'defense', 'mindread', 'trap', 'skip'];
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    cards.push({ ...getCardByType(type), id: `refill_${Date.now()}_${i}_${type}` });
  }
  return cards;
}

// 起始手牌：双方一致的6张牌（2攻1防1读心1陷阱1蓄力）
const STARTING_HAND_TYPES: CardType[] = ['attack', 'attack', 'defense', 'mindread', 'trap', 'skip'];

// 默认牌组
const DEFAULT_DECK_IDS = [
  'card_attack', 'card_attack', 'card_attack',
  'card_defense', 'card_defense',
  'card_mindread', 'card_mindread',
  'card_trap', 'card_trap',
  'card_skip',
];

// 纯随机预言（用于暗流局隐藏牌等非算牌场景）
function generateRandomProphecy(): CardType {
  const types: CardType[] = ['attack', 'defense', 'mindread', 'trap', 'skip'];
  return types[Math.floor(Math.random() * types.length)];
}
// 初始分布：attack×2, defense×1, mindread×1, trap×1, skip×1
function generateProphecy(
  playerPlayedCards: CardType[] = [],
  playerRefillCards: CardType[] = [],
  disabledTypes: CardType[] = [],
  lastProphecy: CardType | null = null,
): CardType {
  const allTypes: CardType[] = ['attack', 'defense', 'mindread', 'trap', 'skip'];
  const initialCount: Record<CardType, number> = {
    attack: 2, defense: 1, mindread: 1, trap: 1, skip: 1,
  };

  // 统计已出牌
  const playedCount: Record<string, number> = {};
  for (const t of playerPlayedCards) { playedCount[t] = (playedCount[t] || 0) + 1; }

  // 统计补到的牌
  const refillCount: Record<string, number> = {};
  for (const t of playerRefillCards) { refillCount[t] = (refillCount[t] || 0) + 1; }

  // 计算各牌型剩余可能的数量
  const remaining: Record<string, number> = {};
  for (const t of allTypes) {
    remaining[t] = initialCount[t] + (refillCount[t] || 0) - (playedCount[t] || 0);
  }

  // 候选牌型：剩余>0、未被禁用、不与上一轮相同
  const candidates = allTypes.filter(
    t => remaining[t] > 0 && !disabledTypes.includes(t) && t !== lastProphecy
  );

  // 有候选时用剩余数量加权随机；没有候选时fallback到非禁用且非上一轮预言的牌型
  const pool = candidates.length > 0 ? candidates : allTypes.filter(t => !disabledTypes.includes(t) && t !== lastProphecy);
  const weights = pool.map(t => Math.max(1, remaining[t] || 1));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// 规则扭曲：随机生成一条新规则
function generateRuleChange(): { title: string; message: string; disabledType: CardType } {
  const rules = [
    { title: '规则变更：禁攻击', message: '裁判长禁止了攻击牌！本阶段不可出攻击。', disabledType: 'attack' as CardType },
    { title: '规则变更：禁防御', message: '裁判长禁止了防御牌！本阶段不可出防御。', disabledType: 'defense' as CardType },
    { title: '规则变更：禁陷阱', message: '裁判长禁止了陷阱牌！本阶段不可出陷阱。', disabledType: 'trap' as CardType },
    { title: '规则变更：禁读心', message: '裁判长禁止了读心牌！本阶段不可出读心。', disabledType: 'mindread' as CardType },
  ];
  return rules[Math.floor(Math.random() * rules.length)];
}

// 庄主能力池（从8-11关对手能力中抽取）
const ABILITY_POOL = ['rule_change', 'resonance', 'last_stand', 'prophecy'];

/** 从能力池中随机抽取一个未获得的能力 */
function drawBossAbility(gained: string[]): { ability: string; rule: { type: string; description: string } } | null {
  const remaining = ABILITY_POOL.filter(a => !gained.includes(a));
  if (remaining.length === 0) return null;
  const ability = remaining[Math.floor(Math.random() * remaining.length)];
  const descriptions: Record<string, string> = {
    rule_change: '每3回合随机禁用一种牌',
    resonance: '双方出同类型牌时伤害归零',
    last_stand: 'HP低于10时，所有攻击牌伤害+2',
    prophecy: '每回合预言你的一张牌，猜中则额外+2伤害',
  };
  return {
    ability,
    rule: { type: ability, description: descriptions[ability] },
  };
}

/** 获取能力中文名 */
function getAbilityName(ability: string): string {
  const names: Record<string, string> = {
    rule_change: '规则扭曲',
    resonance: '共鸣',
    last_stand: '背水一战',
    prophecy: '预言',
  };
  return names[ability] || ability;
}

export const useGameStore = create<BattleState>((set, get) => ({
  level: null,
  enemy: null,
  playerHP: 0,
  playerMaxHP: 0,
  playerPressure: 0,
  playerHand: [],
  playerDeck: [],
  playerSelectedCard: null,
  playerGuess: null,
  enemyHP: 0,
  enemyMaxHP: 0,
  enemyPressure: 0,
  enemyHand: [],
  enemyDeck: [],
  enemySelectedCard: null,
  currentTurn: 0,
  phase: 'select',
  comboState: {
    playerCombo: 0,
    enemyCombo: 0,
    lastPlayerCardType: null,
    lastEnemyCardType: null,
  },
  lastRoundResult: null,
  battleLog: [],
  refillInfo: null,
  playerSkipBonus: false,
  enemySkipBonus: false,
  pendingBattleResult: null,

  // 特殊规则初始值
  activeSpecialRules: [],
  pressureMultiplier: 1,
  comboMultiplier: 1,
  lastStandActive: false,
  prophecyCard: null,
  prophecyHit: false,
  usedCardTypes: [],
  echoPhase: false,
  resonanceActive: false,
  hiddenCardType: null,
  hiddenCardRevealed: false,
  enemyPeekCard: null,
  bossPhase: 1,
  gainedAbilities: [],
  ruleChangeNotification: null,
  disabledCardTypes: [],
  hasShownImitateNotification: false,
  playerProfile: null,
  playerPlayedCards: [],
  playerRefillCardTypes: [],

  initBattle: (level, enemy, playerDeckIds = DEFAULT_DECK_IDS) => {
    // 双方起始手牌一致
    const playerStartingHand = STARTING_HAND_TYPES.map((type, i) => ({
      ...getCardByType(type),
      id: `player_start_${i}_${type}`,
    }));

    // 对手起始手牌（同构）
    const enemyStartingHand = STARTING_HAND_TYPES.map((type, i) => ({
      ...getCardByType(type),
      id: `enemy_start_${i}_${type}`,
    }));

    // 牌库（额外牌用于摸牌/补牌）
    const fullDeck = buildDeck(playerDeckIds);
    const shuffledDeck = shuffleDeck(fullDeck);
    const enemyFullDeck = buildDeck(playerDeckIds);
    const enemyShuffledDeck = shuffleDeck(enemyFullDeck);

    // 初始化特殊规则
    const rules = level.specialRules || [];
    let pressureMultiplier = 1;
    let comboMultiplier = 1;
    let lastStandActive = false;
    let prophecyCard: CardType | null = null;
    let hiddenCardType: CardType | null = null;
    let enemyPeekCard: Card | null = null;
    let disabledCardTypes: CardType[] = [];

    let ruleChangeNotification: { title: string; message: string } | null = null;

    for (const rule of rules) {
      switch (rule.type) {
        case 'pressure_boost':
          pressureMultiplier = 2;
          break;
        case 'combo_boost':
          comboMultiplier = 2;
          break;
        case 'last_stand':
          lastStandActive = true;
          break;
        case 'prophecy':
          prophecyCard = generateProphecy();
          // 首轮预言通知延迟到对话结束后弹出，不在initBattle中设置
          break;
        case 'hidden_card':
          hiddenCardType = generateRandomProphecy(); // 隐藏牌用纯随机
          break;
        case 'peek':
          // 旧版镜像局兼容，不再主动使用
          break;
        case 'imitate':
          // 模仿局：镜子的本局模仿能力，由AIBrain处理
          break;
        case 'resonance':
          // 共鸣局：同牌0伤害，由CardResolver处理
          break;
        case 'rule_change':
          // 规则扭曲局：开局不禁用，3回合后触发
          break;
        case 'phase_shift':
          // 最终局：bossPhase从1开始
          break;
      }
    }

    set({
      level,
      enemy,
      playerHP: level.playerHP,
      playerMaxHP: level.playerHP,
      playerPressure: 0,
      playerHand: playerStartingHand,
      playerDeck: shuffledDeck,
      playerSelectedCard: null,
      playerGuess: null,
      enemyHP: level.enemyHP,
      enemyMaxHP: level.enemyHP,
      enemyPressure: 0,
      enemyHand: enemyStartingHand,
      enemyDeck: enemyShuffledDeck,
      enemySelectedCard: null,
      currentTurn: 1,
      phase: 'select',
      comboState: {
        playerCombo: 0,
        enemyCombo: 0,
        lastPlayerCardType: null,
        lastEnemyCardType: null,
      },
      lastRoundResult: null,
      battleLog: [],
      refillInfo: null,
      playerSkipBonus: false,
      enemySkipBonus: false,
      pendingBattleResult: null,

      // 特殊规则
      activeSpecialRules: rules,
      pressureMultiplier,
      comboMultiplier,
      lastStandActive,
      prophecyCard,
      prophecyHit: false,
      usedCardTypes: [],
      echoPhase: false,
      resonanceActive: rules.some(r => r.type === 'resonance'),
      hiddenCardType,
      hiddenCardRevealed: false,
      enemyPeekCard,
      hasShownImitateNotification: false,
      bossPhase: 1,
      gainedAbilities: [],
      ruleChangeNotification: null,
      disabledCardTypes,
      playerProfile: null,   // 由 battle.tsx 传入
      playerPlayedCards: [],
      playerRefillCardTypes: [],
    });
  },

  selectCard: (card) => {
    const state = get();
    // 回声局：禁用已用过的牌型
    if (state.echoPhase && state.usedCardTypes.includes(card.type)) {
      return; // 不允许选被禁用的牌
    }
    // 规则扭曲/最终局：禁用特定牌型
    if (state.disabledCardTypes.includes(card.type)) {
      return;
    }
    set({ playerSelectedCard: card });
  },

  // 确认出牌（进入读心猜测或直接结算）
  confirmPlay: () => {
    const state = get();
    if (!state.playerSelectedCard) return;
    if (state.playerSelectedCard.type === 'mindread') {
      set({ phase: 'mindread_guess' });
    } else {
      state.confirmSelection();
    }
  },

  setPlayerGuess: (guess) => {
    set({ playerGuess: guess, phase: 'reveal' });
    // 自动进行结算
    setTimeout(() => get().confirmSelection(), 300);
  },

  confirmSelection: () => {
    const state = get();
    if (!state.playerSelectedCard || !state.enemy) return;

    // AI 决策（从手牌中选牌，传入禁用牌型、画像和记牌数据）
    const activeRuleTypes = state.activeSpecialRules.map(r => r.type);
    const aiDecision: AIDecision = decideEnemyCard(
      state.enemy,
      state.playerHP,
      state.enemyHP,
      state.currentTurn,
      state.battleLog,
      state.enemyPressure,
      state.enemyHand,
      state.disabledCardTypes,
      state.echoPhase ? state.usedCardTypes : [],
      null,                      // 不再用peek机制
      state.playerProfile,       // 跨关出牌画像
      state.playerPlayedCards,   // 玩家本局已出的牌（记牌用）
      state.playerHand.length,   // 玩家当前手牌数（记牌推算用）
      state.playerRefillCardTypes, // 玩家补到的牌型（记牌推算用）
      state.level?.id ?? 1,      // 关卡ID（决定记牌能力等级）
      activeRuleTypes,           // 当前生效的特殊规则类型列表
      state.prophecyCard,        // 预言局：影的预言牌型
    );
    const enemyCardType = aiDecision.cardType;
    const enemyGuess = aiDecision.mindreadGuess;
    const enemyCard = getCardByType(enemyCardType);

    // 更新连击状态
    const newCombo = updateCombo(
      state.comboState,
      state.playerSelectedCard.type,
      enemyCardType
    );

    // 结算（传入特殊规则修饰符）
    let result = resolveCards(
      state.playerSelectedCard,
      enemyCard,
      state.playerGuess ?? undefined,
      enemyGuess ?? undefined,
      newCombo,
      state.comboMultiplier,
      state.resonanceActive,
    );

    // ====== 特殊规则后处理 ======

    // 背水局：HP低于10时攻击牌伤害+2（防御仍可格挡，仅在攻击实际命中时叠加）
    if (state.lastStandActive) {
      if (result.enemyDamage > 0 && state.playerSelectedCard.type === 'attack' && state.playerHP < 10) {
        result = { ...result, enemyDamage: result.enemyDamage + 2, specialTrigger: result.specialTrigger + ' 🔥背水！+2伤害' };
      }
      if (result.playerDamage > 0 && enemyCardType === 'attack' && state.enemyHP < 10) {
        result = { ...result, playerDamage: result.playerDamage + 2, specialTrigger: result.specialTrigger + ' ⚠️对手背水！+2伤害' };
      }
    }

    // 预言局：猜中则伤害+2，无伤害时保底扣2
    let prophecyHit = false;
    if (state.prophecyCard) {
      if (state.prophecyCard === state.playerSelectedCard.type) {
        result = { ...result, playerDamage: result.playerDamage + 2, specialTrigger: result.specialTrigger + ' 🔮预言命中！伤害+2！' };
        prophecyHit = true;
      }
    }

    // 暗流局：第5回合揭示隐藏牌
    let hiddenCardRevealed = state.hiddenCardRevealed;
    if (state.hiddenCardType && state.currentTurn === 5 && !hiddenCardRevealed) {
      hiddenCardRevealed = true;
      // 隐藏牌效果：对手额外获得一张强力牌
      const bonusCard = { ...getCardByType(state.hiddenCardType), id: `hidden_bonus_${Date.now()}` };
      result = { ...result, specialTrigger: result.specialTrigger + ` 🂠暗牌揭示：${bonusCard.name}！` };
    }

    // 镜像局：不再用peek，改用画像系统（enemyPeekCard 保留兼容但不再主动使用）
    const peekCard = null; // 画像系统替代

    // 记牌：记录玩家本局出的牌
    const newPlayedCards = [...state.playerPlayedCards, state.playerSelectedCard.type];

    // 计算压力变化（高压局用倍率）
    const playerPressureDelta = calculatePressureDelta(
      true,
      result.playerDamage,
      state.playerSelectedCard.type === state.comboState.lastPlayerCardType,
      state.playerSelectedCard.type === 'skip'
    ) * state.pressureMultiplier;

    const enemyPressureDelta = calculatePressureDelta(
      false,
      result.enemyDamage,
      enemyCardType === state.comboState.lastEnemyCardType,
      enemyCardType === 'skip'
    ) * state.pressureMultiplier;

    // 更新HP
    const newPlayerHP = Math.max(0, state.playerHP - result.playerDamage);
    const newEnemyHP = Math.max(0, state.enemyHP - result.enemyDamage);

    // 记录日志
    const logEntry: BattleLogEntry = {
      turn: state.currentTurn,
      playerCardType: state.playerSelectedCard.type,
      enemyCardType,
      playerDamage: result.playerDamage,
      enemyDamage: result.enemyDamage,
      specialTrigger: result.specialTrigger,
    };

    // 从手牌移除已出的牌
    const handAfterPlay = state.playerHand.filter((c) => c !== state.playerSelectedCard);
    const enemyCardIndex = state.enemyHand.findIndex((c) => c.type === enemyCardType);
    const enemyHandAfterPlay = enemyCardIndex >= 0
      ? state.enemyHand.filter((_, i) => i !== enemyCardIndex)
      : state.enemyHand.length > 0
        ? state.enemyHand.slice(1)
        : [];

    const updatedHand = handAfterPlay;
    const updatedDeck = state.playerDeck;
    const updatedEnemyHand = enemyHandAfterPlay;
    const updatedEnemyDeck = state.enemyDeck;

    // 蓄力牌效果
    const newPlayerSkipBonus = state.playerSelectedCard.type === 'skip' ? true : state.playerSkipBonus;
    const newEnemySkipBonus = enemyCardType === 'skip' ? true : state.enemySkipBonus;

    // 回声局：记录用过的牌型（仅前3回合，第4回合起不再追加禁用列表）
    const newUsedCardTypes = [...state.usedCardTypes];
    if (state.currentTurn <= 3 && !newUsedCardTypes.includes(state.playerSelectedCard.type)) {
      newUsedCardTypes.push(state.playerSelectedCard.type);
    }

    // 判断胜负
    let pendingResult: 'victory' | 'defeat' | null = null;
    if (newEnemyHP <= 0) {
      pendingResult = 'victory';
    } else if (newPlayerHP <= 0) {
      pendingResult = 'defeat';
    }

    set({
      enemySelectedCard: enemyCard,
      playerHP: newPlayerHP,
      enemyHP: newEnemyHP,
      playerPressure: Math.min(100, Math.max(0, state.playerPressure + playerPressureDelta)),
      enemyPressure: Math.min(100, Math.max(0, state.enemyPressure + enemyPressureDelta)),
      playerHand: updatedHand,
      playerDeck: updatedDeck,
      enemyHand: updatedEnemyHand,
      enemyDeck: updatedEnemyDeck,
      comboState: newCombo,
      lastRoundResult: result,
      battleLog: [...state.battleLog, logEntry],
      playerSkipBonus: newPlayerSkipBonus,
      enemySkipBonus: newEnemySkipBonus,
      phase: 'resolve',
      pendingBattleResult: pendingResult,
      // 特殊规则更新
      prophecyHit,
      hiddenCardRevealed,
      enemyPeekCard: peekCard,
      usedCardTypes: newUsedCardTypes,
      playerPlayedCards: newPlayedCards,
    });

    // 音效触发
    const audio = useAudioStore.getState();
    if (pendingResult === 'victory') {
      audio.playSFX('victory');
    } else if (pendingResult === 'defeat') {
      audio.playSFX('defeat');
    } else {
      // 出牌音效
      audio.playSFX('card_play');
      // 受伤音效
      if (result.playerDamage > 0) audio.playSFX('hit');
      if (result.enemyDamage > 0) audio.playSFX('counter');
      // 读心成功
      if (state.playerSelectedCard?.type === 'mindread' && result.enemyDamage > 0) audio.playSFX('mindread');
      // 陷阱触发
      if (enemyCardType === 'trap') audio.playSFX('trap');
      // 连击
      if (newCombo.playerComboCount >= 2 || newCombo.enemyComboCount >= 2) audio.playSFX('combo');
    }
  },

  nextTurn: () => {
    const state = get();

    // 兜底检查：如果HP已归零但pendingBattleResult丢失，强制判定
    if (state.enemyHP <= 0 && state.pendingBattleResult !== 'victory') {
      set({ phase: 'victory', pendingBattleResult: null });
      return;
    }
    if (state.playerHP <= 0 && state.pendingBattleResult !== 'defeat') {
      set({ phase: 'defeat', pendingBattleResult: null });
      return;
    }

    // 如果上一轮已经分出胜负，直接进入胜利/失败
    if (state.pendingBattleResult) {
      const result = state.pendingBattleResult;
      set({
        phase: result,
        pendingBattleResult: null,
      });
      return;
    }

    let nextTurn = state.currentTurn + 1;
    let ruleNotification: RuleNotification | null = null;
    let newDisabledCardTypes = [...state.disabledCardTypes];
    let newEchoPhase = state.echoPhase;
    let newBossPhase = state.bossPhase;
    let newProphecyCard = state.prophecyCard;
    let newHiddenCardType = state.hiddenCardType;
    let newHiddenCardRevealed = state.hiddenCardRevealed;
    let newUsedCardTypes = [...state.usedCardTypes];
    let newResonanceActive = state.resonanceActive;
    let newLastStandActive = state.lastStandActive;

    // ====== 特殊规则：回合开始触发 ======

    // 规则扭曲局：每3回合变更规则
    if (state.activeSpecialRules.some(r => r.type === 'rule_change') && nextTurn % 3 === 1 && nextTurn > 1) {
      const ruleChange = generateRuleChange();
      ruleNotification = ruleChange;
      newDisabledCardTypes = [ruleChange.disabledType];
      useAudioStore.getState().playSFX('rule_change');
    }

    // 预言局：每回合重新预言（影算牌）
    if (state.activeSpecialRules.some(r => r.type === 'prophecy')) {
      newProphecyCard = generateProphecy(state.playerPlayedCards, state.playerRefillCardTypes, newDisabledCardTypes, state.prophecyCard);
      if (!ruleNotification) {
        const cardTypeLabels: Record<string, string> = { attack: '攻击', defense: '防御', mindread: '读心', trap: '陷阱', skip: '蓄力' };
        ruleNotification = { title: '🔮 预言', message: `影预言你将出：${cardTypeLabels[newProphecyCard] ?? newProphecyCard}` };
      }
    }

    // 暗流局：第5回合揭示隐藏牌
    if (state.activeSpecialRules.some(r => r.type === 'hidden_card') && nextTurn === 5 && !state.hiddenCardRevealed) {
      newHiddenCardRevealed = true;
      const hiddenName = state.hiddenCardType ? getCardByType(state.hiddenCardType).name : '???';
      if (!ruleNotification) {
        ruleNotification = { title: '🂠 暗牌揭示', message: `对手的隐藏牌是：${hiddenName}！` };
      }
      // 对手获得隐藏牌加入手牌
      if (state.hiddenCardType) {
        const bonusCard = { ...getCardByType(state.hiddenCardType), id: `hidden_${Date.now()}` };
        state.enemyHand = [...state.enemyHand, bonusCard];
      }
    }

    // 最终局：庄主HP每降1/3，随机习得一种前关对手的能力
    let newGainedAbilities = [...state.gainedAbilities];
    let newActiveSpecialRules = [...state.activeSpecialRules];
    if (state.activeSpecialRules.some(r => r.type === 'phase_shift') && state.enemy) {
      const hpPercent = state.enemyHP / state.enemyMaxHP;
      // 阶段3：HP <= 1/3
      if (hpPercent <= 0.33 && state.bossPhase < 3) {
        newBossPhase = 3;
        const draw = drawBossAbility(newGainedAbilities);
        if (draw) {
          newGainedAbilities.push(draw.ability);
          newActiveSpecialRules.push(draw.rule);
          ruleNotification = { title: '🎭 庄主进入最终阶段', message: `庄主习得了「${getAbilityName(draw.ability)}」！${draw.rule.description}` };
          useAudioStore.getState().playSFX('phase_shift');
          if (draw.ability === 'prophecy') {
            newProphecyCard = generateProphecy(state.playerPlayedCards, state.playerRefillCardTypes, newDisabledCardTypes, null);
          }
          if (draw.ability === 'resonance') newResonanceActive = true;
          if (draw.ability === 'last_stand') newLastStandActive = true;
        }
      }
      // 阶段2：HP <= 2/3
      if (hpPercent <= 0.66 && state.bossPhase < 2) {
        newBossPhase = 2;
        const draw = drawBossAbility(newGainedAbilities);
        if (draw) {
          newGainedAbilities.push(draw.ability);
          newActiveSpecialRules.push(draw.rule);
          ruleNotification = { title: '🎭 庄主进入第二阶段', message: `庄主习得了「${getAbilityName(draw.ability)}」！${draw.rule.description}` };
          useAudioStore.getState().playSFX('phase_shift');
          if (draw.ability === 'prophecy') {
            newProphecyCard = generateProphecy(state.playerPlayedCards, state.playerRefillCardTypes, newDisabledCardTypes, null);
          }
          if (draw.ability === 'resonance') newResonanceActive = true;
          if (draw.ability === 'last_stand') newLastStandActive = true;
        }
      }
    }

    // 模仿局通知（镜像局第4关）：只弹一次，后续仅在回合信息区显示
    let newHasShownImitate = state.hasShownImitateNotification;
    if (state.activeSpecialRules.some(r => r.type === 'imitate') && !state.hasShownImitateNotification) {
      const accuracy = nextTurn <= 2 ? 30 : nextTurn <= 4 ? 50 : 65;
      ruleNotification = { title: '🪞 模仿本能', message: `镜子正在学习你的出牌……模仿准确率约${accuracy}%` };
      newHasShownImitate = true;
    }

    // 检查是否需要补牌
    const playerNeedsRefill = state.playerHand.length === 0;
    const enemyNeedsRefill = state.enemyHand.length === 0;

    if (playerNeedsRefill || enemyNeedsRefill) {
      // 进入补牌阶段（手牌耗尽补3张明牌 + 蓄力效果额外补2张）
      const playerRefillCount = 3 + (state.playerSkipBonus ? 2 : 0);
      const enemyRefillCount = 3 + (state.enemySkipBonus ? 2 : 0);
      // 手牌耗尽的补3张；手牌未耗尽但有蓄力bonus的，补2张蓄力牌
      let playerRefillCards = playerNeedsRefill
        ? generateRefillCards(playerRefillCount)
        : state.playerSkipBonus
          ? generateRefillCards(2)
          : [];
      let enemyRefillCards = enemyNeedsRefill
        ? generateRefillCards(enemyRefillCount)
        : state.enemySkipBonus
          ? generateRefillCards(2)
          : [];

      // 补到的新牌如果全被禁用，需要重新补（确保至少有1张可用牌）
      // 蓄力补牌数量（手牌未耗尽但有蓄力bonus时，仅补2张蓄力牌）
      const playerSkipRefillCount = 2;
      const enemySkipRefillCount = 2;
      const effectiveDisabledForRefill = [
        ...newDisabledCardTypes,
        ...(newEchoPhase ? newUsedCardTypes : []),
      ];
      if (playerRefillCards.length > 0 && playerRefillCards.every(c => effectiveDisabledForRefill.includes(c.type))) {
        const retryCount = playerNeedsRefill ? playerRefillCount : playerSkipRefillCount;
        playerRefillCards = generateRefillCards(retryCount);
      }
      if (enemyRefillCards.length > 0 && enemyRefillCards.every(c => effectiveDisabledForRefill.includes(c.type))) {
        const retryCount = enemyNeedsRefill ? enemyRefillCount : enemySkipRefillCount;
        enemyRefillCards = generateRefillCards(retryCount);
      }

      const whoRefilled = playerRefillCards.length > 0 && enemyRefillCards.length > 0
        ? 'both'
        : playerRefillCards.length > 0
          ? 'player'
          : enemyRefillCards.length > 0
            ? 'enemy'
            : 'both';

      const newPlayerHand = [...state.playerHand, ...playerRefillCards];
      const newEnemyHand = [...state.enemyHand, ...enemyRefillCards];

      // 记牌：记录玩家补到的牌型
      const newRefillTypes = [...state.playerRefillCardTypes, ...playerRefillCards.map(c => c.type)];

      // 补牌原因：如果有人手牌耗尽，主因是empty；蓄力作为附加效果
      const refillReason = playerNeedsRefill || enemyNeedsRefill ? 'empty' : 'skip';

      set({
        currentTurn: nextTurn,
        playerSelectedCard: null,
        playerGuess: null,
        enemySelectedCard: null,
        lastRoundResult: null,
        playerHand: newPlayerHand,
        enemyHand: newEnemyHand,
        refillInfo: {
          playerRefillCards,
          enemyRefillCards,
          whoRefilled,
          reason: refillReason,
        },
        playerSkipBonus: false,
        enemySkipBonus: false,
        phase: 'refill',
        // 特殊规则更新
        echoPhase: newEchoPhase,
        disabledCardTypes: newDisabledCardTypes,
        bossPhase: newBossPhase,
        gainedAbilities: newGainedAbilities,
        activeSpecialRules: newActiveSpecialRules,
        prophecyCard: newProphecyCard,
        hiddenCardRevealed: newHiddenCardRevealed,
        usedCardTypes: newUsedCardTypes,
        resonanceActive: newResonanceActive,
        lastStandActive: newLastStandActive,
        ruleChangeNotification: ruleNotification,
        hasShownImitateNotification: newHasShownImitate,
      });
    } else {
      // 正常下一回合
      const playerSkipCards = state.playerSkipBonus ? generateRefillCards(2) : [];
      const enemySkipCards = state.enemySkipBonus ? generateRefillCards(2) : [];

      // ====== 被禁用牌处理 ======
      // 被禁用的牌保留在手牌中（变灰不可选），只有全部被禁用无法出牌时才丢弃补牌
      const effectiveDisabledTypes = [
        ...newDisabledCardTypes,
        ...(newEchoPhase ? newUsedCardTypes : []),
      ];
      const playerAvailableCount = state.playerHand.filter(
        c => !effectiveDisabledTypes.includes(c.type)
      ).length;
      const enemyAvailableCount = state.enemyHand.filter(
        c => !effectiveDisabledTypes.includes(c.type)
      ).length;

      // 只有手牌全部被禁用时，才扔掉被禁用的牌补3张新牌
      let playerDiscardRefillCards: Card[] = [];
      let enemyDiscardRefillCards: Card[] = [];
      let playerHandResult = [...state.playerHand];
      let enemyHandResult = [...state.enemyHand];

      if (playerAvailableCount === 0 && state.playerHand.length > 0) {
        // 扔掉所有被禁用的牌，补3张新牌
        playerHandResult = [];
        playerDiscardRefillCards = generateRefillCards(3);
        if (playerDiscardRefillCards.every(c => effectiveDisabledTypes.includes(c.type))) {
          playerDiscardRefillCards = generateRefillCards(3);
        }
      }
      if (enemyAvailableCount === 0 && state.enemyHand.length > 0) {
        enemyHandResult = [];
        enemyDiscardRefillCards = generateRefillCards(3);
        if (enemyDiscardRefillCards.every(c => effectiveDisabledTypes.includes(c.type))) {
          enemyDiscardRefillCards = generateRefillCards(3);
        }
      }

      const hasDiscardRefill = playerDiscardRefillCards.length > 0 || enemyDiscardRefillCards.length > 0;

      const newPlayerHand = [...playerHandResult, ...playerDiscardRefillCards, ...playerSkipCards];
      const newEnemyHand = [...enemyHandResult, ...enemyDiscardRefillCards, ...enemySkipCards];

      const hasSkipBonus = playerSkipCards.length > 0 || enemySkipCards.length > 0;

      if (hasSkipBonus || hasDiscardRefill) {
        // 合并补牌展示：蓄力补牌 + 被禁用牌丢弃补牌
        const allPlayerRefill = [...playerDiscardRefillCards, ...playerSkipCards];
        const allEnemyRefill = [...enemyDiscardRefillCards, ...enemySkipCards];
        const whoRefilled = allPlayerRefill.length > 0 && allEnemyRefill.length > 0
          ? 'both'
          : allPlayerRefill.length > 0
            ? 'player'
            : 'enemy';
        const reason = hasDiscardRefill ? 'discard_disabled' : 'skip';

        set({
          currentTurn: nextTurn,
          playerSelectedCard: null,
          playerGuess: null,
          enemySelectedCard: null,
          lastRoundResult: null,
          playerHand: newPlayerHand,
          enemyHand: newEnemyHand,
          playerSkipBonus: false,
          enemySkipBonus: false,
          refillInfo: {
            playerRefillCards: allPlayerRefill,
            enemyRefillCards: allEnemyRefill,
            whoRefilled,
            reason,
          },
          phase: 'refill',
          // 特殊规则更新
          echoPhase: newEchoPhase,
          disabledCardTypes: newDisabledCardTypes,
          bossPhase: newBossPhase,
          gainedAbilities: newGainedAbilities,
          activeSpecialRules: newActiveSpecialRules,
          prophecyCard: newProphecyCard,
          hiddenCardRevealed: newHiddenCardRevealed,
          usedCardTypes: newUsedCardTypes,
          resonanceActive: newResonanceActive,
          lastStandActive: newLastStandActive,
          ruleChangeNotification: ruleNotification,
          hasShownImitateNotification: newHasShownImitate,
          playerRefillCardTypes: [...state.playerRefillCardTypes, ...allPlayerRefill.map(c => c.type)],
        });
      } else {
        set({
          currentTurn: nextTurn,
          playerSelectedCard: null,
          playerGuess: null,
          enemySelectedCard: null,
          lastRoundResult: null,
          playerHand: newPlayerHand,
          enemyHand: newEnemyHand,
          playerSkipBonus: false,
          enemySkipBonus: false,
          phase: 'select',
          // 特殊规则更新
          echoPhase: newEchoPhase,
          disabledCardTypes: newDisabledCardTypes,
          bossPhase: newBossPhase,
          gainedAbilities: newGainedAbilities,
          activeSpecialRules: newActiveSpecialRules,
          prophecyCard: newProphecyCard,
          hiddenCardRevealed: newHiddenCardRevealed,
          usedCardTypes: newUsedCardTypes,
          resonanceActive: newResonanceActive,
          lastStandActive: newLastStandActive,
          ruleChangeNotification: ruleNotification,
          hasShownImitateNotification: newHasShownImitate,
        });

        // 兜底检测：进入select后如果手牌全部被禁用，立即丢弃补牌
        const currentState = get();
        const currentDisabled = [
          ...currentState.disabledCardTypes,
          ...(currentState.echoPhase ? currentState.usedCardTypes : []),
        ];
        const playerAllDisabled = currentState.playerHand.length > 0 &&
          currentState.playerHand.every(c => currentDisabled.includes(c.type));
        const enemyAllDisabled = currentState.enemyHand.length > 0 &&
          currentState.enemyHand.every(c => currentDisabled.includes(c.type));

        if (playerAllDisabled || enemyAllDisabled) {
          let pRefill: Card[] = [];
          let eRefill: Card[] = [];
          let pHand = [...currentState.playerHand];
          let eHand = [...currentState.enemyHand];

          if (playerAllDisabled) {
            pHand = [];
            pRefill = generateRefillCards(3);
            if (pRefill.every(c => currentDisabled.includes(c.type))) {
              pRefill = generateRefillCards(3);
            }
          }
          if (enemyAllDisabled) {
            eHand = [];
            eRefill = generateRefillCards(3);
            if (eRefill.every(c => currentDisabled.includes(c.type))) {
              eRefill = generateRefillCards(3);
            }
          }

          const allPlayerRefill = [...pRefill];
          const allEnemyRefill = [...eRefill];
          const whoRefilled = allPlayerRefill.length > 0 && allEnemyRefill.length > 0
            ? 'both'
            : allPlayerRefill.length > 0
              ? 'player'
              : 'enemy';

          set({
            playerHand: [...pHand, ...pRefill],
            enemyHand: [...eHand, ...eRefill],
            refillInfo: {
              playerRefillCards: allPlayerRefill,
              enemyRefillCards: allEnemyRefill,
              whoRefilled,
              reason: 'discard_disabled',
            },
            phase: 'refill',
            playerRefillCardTypes: [...currentState.playerRefillCardTypes, ...allPlayerRefill.map(c => c.type)],
          });
        }
      }
    }
  },

  // 确认补牌展示，继续对战
  confirmRefill: () => {
    const state = get();

    // 兜底检查：如果HP已归零，直接进入胜利/失败
    if (state.enemyHP <= 0) {
      set({ phase: 'victory', pendingBattleResult: null, refillInfo: null });
      return;
    }
    if (state.playerHP <= 0) {
      set({ phase: 'defeat', pendingBattleResult: null, refillInfo: null });
      return;
    }

    set({
      refillInfo: null,
      phase: 'select',
    });

    // 兜底检测：补牌后如果手牌仍然全部被禁用，再次丢弃补牌
    const currentState = get();
    const currentDisabled = [
      ...currentState.disabledCardTypes,
      ...(currentState.echoPhase ? currentState.usedCardTypes : []),
    ];
    const playerAllDisabled = currentState.playerHand.length > 0 &&
      currentState.playerHand.every(c => currentDisabled.includes(c.type));

    if (playerAllDisabled) {
      let pRefill = generateRefillCards(3);
      if (pRefill.every(c => currentDisabled.includes(c.type))) {
        pRefill = generateRefillCards(3);
      }

      set({
        playerHand: [...pRefill],
        refillInfo: {
          playerRefillCards: pRefill,
          enemyRefillCards: [],
          whoRefilled: 'player',
          reason: 'discard_disabled',
        },
        phase: 'refill',
        playerRefillCardTypes: [...currentState.playerRefillCardTypes, ...pRefill.map(c => c.type)],
      });
    }
  },

  dismissRuleNotification: () => {
    const notification = get().ruleChangeNotification;
    const onDismiss = notification?.onDismiss;
    set({ ruleChangeNotification: null });
    if (onDismiss) onDismiss();
  },

  showRuleNotification: (notification) => {
    set({ ruleChangeNotification: notification });
  },

  setHasShownImitateNotification: (value: boolean) => {
    set({ hasShownImitateNotification: value });
  },

  resetBattle: () => {
    set({
      level: null,
      enemy: null,
      playerHP: 0,
      playerMaxHP: 0,
      playerPressure: 0,
      playerHand: [],
      playerDeck: [],
      playerSelectedCard: null,
      playerGuess: null,
      enemyHP: 0,
      enemyMaxHP: 0,
      enemyPressure: 0,
      enemyHand: [],
      enemyDeck: [],
      enemySelectedCard: null,
      currentTurn: 0,
      phase: 'select',
      comboState: {
        playerCombo: 0,
        enemyCombo: 0,
        lastPlayerCardType: null,
        lastEnemyCardType: null,
      },
      lastRoundResult: null,
      battleLog: [],
      refillInfo: null,
      playerSkipBonus: false,
      enemySkipBonus: false,
      pendingBattleResult: null,
      // 特殊规则重置
      activeSpecialRules: [],
      pressureMultiplier: 1,
      comboMultiplier: 1,
      lastStandActive: false,
      prophecyCard: null,
      prophecyHit: false,
      usedCardTypes: [],
      echoPhase: false,
      resonanceActive: false,
      hiddenCardType: null,
      hiddenCardRevealed: false,
      enemyPeekCard: null,
      bossPhase: 1,
      gainedAbilities: [],
      ruleChangeNotification: null,
      disabledCardTypes: [],
      playerProfile: null,
      playerPlayedCards: [],
      playerRefillCardTypes: [],
    });
  },

  setPlayerProfile: (profile) => {
    set({ playerProfile: profile });
  },

  // 秘技：直接获胜（按~键触发）
  cheatWin: () => set((state) => {
    if (state.phase === 'victory' || state.phase === 'defeat') return state;
    return {
      enemyHP: 0,
      phase: 'victory' as const,
      pendingBattleResult: null,
    };
  }),
}));

// 画像准确率（UI显示用）
function getProfileAccuracyForUI(totalTurns: number): number {
  if (totalTurns < 5) return 0.3;
  if (totalTurns < 10) return 0.45;
  if (totalTurns < 20) return 0.6;
  if (totalTurns < 35) return 0.75;
  return 0.85;
}
