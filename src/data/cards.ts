// src/data/cards.ts
// 所有卡牌定义

export type CardType = 'attack' | 'defense' | 'mindread' | 'trap' | 'skip';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  icon: string;
  baseDamage: number;
  description: string;
  level: number;
  unlockLevel?: number; // 解锁所需关卡数
}

export const BASE_CARDS: Card[] = [
  {
    id: 'card_attack',
    type: 'attack',
    name: '攻击',
    icon: '⚔️',
    baseDamage: 2,
    description: '直接造成2点伤害',
    level: 1,
  },
  {
    id: 'card_defense',
    type: 'defense',
    name: '防御',
    icon: '🛡️',
    baseDamage: 0,
    description: '格挡攻击牌，反弹1点伤害',
    level: 1,
  },
  {
    id: 'card_mindread',
    type: 'mindread',
    name: '读心',
    icon: '👁️',
    baseDamage: 0,
    description: '猜中对方出牌类型，造成3点伤害',
    level: 1,
  },
  {
    id: 'card_trap',
    type: 'trap',
    name: '陷阱',
    icon: '💣',
    baseDamage: 0,
    description: '对方出攻击牌时触发，造成4点伤害',
    level: 1,
  },
  {
    id: 'card_skip',
    type: 'skip',
    name: '蓄力',
    icon: '🃏',
    baseDamage: 0,
    description: '本回合放弃行动，下回合开始获得2张手牌（双方可见）',
    level: 1,
  },
];

// 根据ID查找卡牌
export function getCardById(id: string): Card | undefined {
  return BASE_CARDS.find((c) => c.id === id);
}

// 根据类型查找卡牌
export function getCardByType(type: CardType): Card {
  return BASE_CARDS.find((c) => c.type === type)!;
}
