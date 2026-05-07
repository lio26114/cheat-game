// src/engine/CardResolver.ts
// 卡牌交互结算逻辑 v3 — 读心对称化（AI也需猜测）

import { Card, CardType } from '../data/cards';

export interface RoundResult {
  playerCard: Card;
  enemyCard: Card;
  playerDamage: number;
  enemyDamage: number;
  specialTrigger: string;
}

export interface ComboState {
  playerCombo: number;
  enemyCombo: number;
  lastPlayerCardType: CardType | null;
  lastEnemyCardType: CardType | null;
}

/**
 * 结算双方出牌，返回本回合伤害结果
 * @param playerGuess 玩家读心猜测的牌型
 * @param enemyGuess AI读心猜测的牌型（对称化：AI出读心也需要猜测）
 * @param comboMultiplier 连击伤害倍率（连击局用，默认1.5倍加成，连击局2倍）
 * @param resonanceActive 共鸣局生效中：同牌0伤害
 */
export function resolveCards(
  playerCard: Card,
  enemyCard: Card,
  playerGuess?: CardType,
  enemyGuess?: CardType,
  comboState?: ComboState,
  comboMultiplier: number = 1,
  resonanceActive: boolean = false,
): RoundResult {
  let playerDamage = 0;
  let enemyDamage = 0;
  let specialTrigger = '';

  const p = playerCard.type;
  const e = enemyCard.type;

  // ---- 共鸣局：同牌共鸣，伤害归零 ----
  // 读心猜中不受共鸣影响（看穿对方不算共鸣）
  const isResonance = resonanceActive && p === e && !(p === 'mindread' && playerGuess === e) && !(e === 'mindread' && enemyGuess === p);

  if (isResonance) {
    // 同牌共鸣：伤害归零
    playerDamage = 0;
    enemyDamage = 0;
    const typeNames: Record<CardType, string> = {
      attack: '⚔️', defense: '🛡️', mindread: '👁️', trap: '💣', skip: '🃏'
    };
    specialTrigger = `✨ 共鸣！${typeNames[p]} 同牌抵消，伤害归零`;
  } else {
  if (p === 'attack' && e === 'attack') {
    playerDamage = 2;
    enemyDamage = 2;
    specialTrigger = '⚔️ 双方互攻！';
  } else if (p === 'attack' && e === 'defense') {
    playerDamage = 1;
    enemyDamage = 0;
    specialTrigger = '🛡️ 攻击被格挡，反弹1点伤害';
  } else if (p === 'attack' && e === 'trap') {
    playerDamage = 4;
    enemyDamage = 0;
    specialTrigger = '💣 陷阱触发！攻击方受重创！';
  } else if (p === 'attack' && e === 'mindread') {
    // AI读心也需要猜测：猜中玩家出攻击才命中
    if (enemyGuess && enemyGuess === p) {
      playerDamage = 3;
      enemyDamage = 0;
      specialTrigger = '👁️ 读心命中！攻击被预判！';
    } else {
      // AI读心猜错，玩家攻击正常命中
      playerDamage = 0;
      enemyDamage = 2;
      specialTrigger = '👁️ 对方读心失败！你的攻击命中！';
    }
  } else if (p === 'attack' && e === 'skip') {
    playerDamage = 0;
    enemyDamage = 2;
    specialTrigger = '⚔️ 蓄力者遭到突袭！';
  } else if (p === 'defense' && e === 'attack') {
    playerDamage = 0;
    enemyDamage = 1;
    specialTrigger = '🛡️ 格挡成功！反弹1点伤害';
  } else if (p === 'defense' && e === 'defense') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '🛡️ 双方防御，相安无事';
  } else if (p === 'defense' && e === 'trap') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '💣 陷阱无人触发';
  } else if (p === 'defense' && e === 'mindread') {
    // AI读心猜测：猜中玩家出防御才穿透
    if (enemyGuess && enemyGuess === p) {
      playerDamage = 3;
      enemyDamage = 0;
      specialTrigger = '👁️ 读心命中！防御被穿透！';
    } else {
      // AI读心猜错，防御成功架住
      playerDamage = 0;
      enemyDamage = 0;
      specialTrigger = '👁️ 对方读心失败！你成功防御！';
    }
  } else if (p === 'defense' && e === 'skip') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '🛡️ 双方皆守';
  } else if (p === 'mindread') {
    // 读心牌：需要玩家猜测对方出什么牌
    if (playerGuess && playerGuess === e) {
      playerDamage = 0;
      enemyDamage = 3;
      specialTrigger = '👁️ 读心命中！你猜中了对方出牌！';
    } else {
      playerDamage = e === 'attack' ? 2 : 0;
      enemyDamage = 0;
      specialTrigger = '👁️ 读心失败……你猜错了';
    }
  } else if (p === 'trap' && e === 'attack') {
    playerDamage = 0;
    enemyDamage = 4;
    specialTrigger = '💣 陷阱触发！攻击者中招！';
  } else if (p === 'trap' && e === 'defense') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '💣 陷阱无人触发';
  } else if (p === 'trap' && e === 'trap') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '💣 双方陷阱，互相试探';
  } else if (p === 'trap' && e === 'mindread') {
    // AI读心猜测：猜中玩家出陷阱才看穿
    if (enemyGuess && enemyGuess === p) {
      playerDamage = 3;
      enemyDamage = 0;
      specialTrigger = '👁️ 读心命中！你的陷阱被看穿了！';
    } else {
      // AI读心猜错，陷阱无人触发
      playerDamage = 0;
      enemyDamage = 0;
      specialTrigger = '👁️ 对方读心失败！陷阱未被触发！';
    }
  } else if (p === 'trap' && e === 'skip') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '💣 陷阱无人触发，蓄力者安全';
  } else if (p === 'skip' && e === 'attack') {
    playerDamage = 2;
    enemyDamage = 0;
    specialTrigger = '🃏 蓄力中，遭到突袭！';
  } else if (p === 'skip' && e === 'defense') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '🃏 蓄力中，对方防御';
  } else if (p === 'skip' && e === 'trap') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '🃏 蓄力成功避过陷阱！';
  } else if (p === 'skip' && e === 'mindread') {
    // AI读心猜测：猜中玩家出蓄力才看穿
    if (enemyGuess && enemyGuess === p) {
      playerDamage = 3;
      enemyDamage = 0;
      specialTrigger = '👁️ 读心命中！蓄力被看穿！';
    } else {
      // AI读心猜错，蓄力安全
      playerDamage = 0;
      enemyDamage = 0;
      specialTrigger = '👁️ 对方读心失败！蓄力安全！';
    }
  } else if (p === 'skip' && e === 'skip') {
    playerDamage = 0;
    enemyDamage = 0;
    specialTrigger = '🃏 双方蓄力，暴风雨前的宁静……';
  }
  } // end of else (non-resonance)

  // ---- 连击加成 ----
  if (comboState) {
    if (comboState.playerCombo >= 2 && enemyDamage > 0) {
      // 基础加成50%，连击局倍率影响
      const baseBonus = Math.floor(enemyDamage * 0.5);
      const bonus = comboMultiplier > 1 ? baseBonus * comboMultiplier : baseBonus;
      enemyDamage += bonus;
      specialTrigger += ` 🔥连击×${comboState.playerCombo}！+${bonus}伤害`;
    }
    if (comboState.enemyCombo >= 2 && playerDamage > 0) {
      const baseBonus = Math.floor(playerDamage * 0.5);
      const bonus = comboMultiplier > 1 ? baseBonus * comboMultiplier : baseBonus;
      playerDamage += bonus;
      specialTrigger += ` ⚠️对手连击×${comboState.enemyCombo}！+${bonus}伤害`;
    }
  }

  return { playerCard, enemyCard, playerDamage, enemyDamage, specialTrigger };
}

/**
 * 更新连击状态
 */
export function updateCombo(
  prevState: ComboState,
  playerCardType: CardType,
  enemyCardType: CardType
): ComboState {
  const playerCombo =
    playerCardType === prevState.lastPlayerCardType
      ? prevState.playerCombo + 1
      : 1;
  const enemyCombo =
    enemyCardType === prevState.lastEnemyCardType
      ? prevState.enemyCombo + 1
      : 1;

  return {
    playerCombo,
    enemyCombo,
    lastPlayerCardType: playerCardType,
    lastEnemyCardType: enemyCardType,
  };
}
