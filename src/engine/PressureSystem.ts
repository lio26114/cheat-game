// src/engine/PressureSystem.ts
// 心理压力条系统

/**
 * 计算每回合压力变化
 * - 受伤增加压力
 * - 连续出同一张牌增加压力（被看穿的感觉）
 * - 蓄力成功减少压力
 */
export function calculatePressureDelta(
  isPlayer: boolean,
  damageTaken: number,
  usedSameCardType: boolean,
  usedSkip: boolean
): number {
  let delta = 0;

  // 受伤 +压力
  delta += damageTaken * 5;

  // 连续出同类型牌 +压力（被看穿感）
  if (usedSameCardType) {
    delta += 3;
  }

  // 成功蓄力 -压力
  if (usedSkip) {
    delta -= 5;
  }

  // 胜利回合 -压力（在 gameStore 中处理）

  return delta;
}

/**
 * 压力崩溃检查
 * 压力达到100时，强制随机出牌
 */
export function isPressureBroken(pressure: number): boolean {
  return pressure >= 100;
}

/**
 * 压力等级描述
 */
export function getPressureLevel(pressure: number): string {
  if (pressure < 20) return '冷静';
  if (pressure < 40) return '紧张';
  if (pressure < 60) return '焦虑';
  if (pressure < 80) return '恐慌';
  if (pressure < 100) return '崩溃边缘';
  return '崩溃！';
}

/**
 * 压力条颜色
 */
export function getPressureColor(pressure: number): string {
  if (pressure < 30) return '#4CAF50';  // 绿
  if (pressure < 60) return '#FF9800';  // 橙
  if (pressure < 80) return '#f44336';  // 红
  return '#9C27B0';                      // 紫（崩溃）
}
