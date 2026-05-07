// src/store/progressStore.ts
// 关卡进度 & 存档管理 — AsyncStorage 持久化

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'game_progress';

// 跨关卡出牌画像 —— AI 读你的数据
export interface PlayerProfile {
  totalTurns: number;                          // 总出牌回合数
  typeFrequency: Record<string, number>;       // 各牌型出牌次数 { attack: 20, defense: 12, ... }
  afterDamageFrequency: Record<string, number>; // 受伤后下一回合出牌频率
  afterHealFrequency: Record<string, number>;   // 对手受伤后下一回合出牌频率
  firstTurnFrequency: Record<string, number>;   // 首回合出牌频率
  lowHPFrequency: Record<string, number>;       // HP<30%时出牌频率
  comboFrequency: Record<string, number>;       // 连续出同类牌次数
}

export interface ProgressState {
  // 关卡进度
  currentLevel: number;        // 当前解锁到第几关
  unlockedLevels: number[];    // 已解锁关卡列表
  completedLevels: number[];   // 已通关关卡列表

  // 卡组
  ownedCards: string[];        // 已拥有卡牌ID
  playerDeck: string[];        // 当前携带卡组
  cardLevels: Record<string, number>; // 卡牌等级

  // 出牌画像
  playerProfile: PlayerProfile;

  // 设置
  bgmVolume: number;
  sfxVolume: number;

  // Actions
  completeLevel: (levelId: number, rewardCards?: string[]) => void;
  unlockLevel: (levelId: number) => void;
  updateDeck: (deck: string[]) => void;
  upgradeCard: (cardId: string) => void;
  setBGMVolume: (v: number) => void;
  setSFXVolume: (v: number) => void;
  updateProfile: (levelId: number, log: { playerCardType: string; enemyCardType: string; playerDamage: number; enemyDamage: number }[]) => void;
  resetProgress: () => void;  // 重置进度（重新挑战）
  _hydrate: () => void;  // 启动时恢复存档
}

const DEFAULT_DECK = [
  'card_attack', 'card_attack', 'card_attack',
  'card_defense', 'card_defense',
  'card_mindread', 'card_mindread',
  'card_trap', 'card_trap',
  'card_skip',
];

const EMPTY_PROFILE: PlayerProfile = {
  totalTurns: 0,
  typeFrequency: {},
  afterDamageFrequency: {},
  afterHealFrequency: {},
  firstTurnFrequency: {},
  lowHPFrequency: {},
  comboFrequency: {},
};

const DEFAULT_STATE = {
  currentLevel: 1,
  unlockedLevels: [1],
  completedLevels: [],
  ownedCards: ['card_attack', 'card_defense'],
  playerDeck: [...DEFAULT_DECK],
  cardLevels: { card_attack: 1, card_defense: 1 },
  playerProfile: { ...EMPTY_PROFILE },
  bgmVolume: 0.7,
  sfxVolume: 0.8,
};

// 从 AsyncStorage 读取存档
async function loadProgress(): Promise<Partial<ProgressState>> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json != null) {
      return JSON.parse(json);
    }
  } catch (e) {
    // 存档损坏，使用默认值
  }
  return {};
}

// 保存存档到 AsyncStorage
async function saveProgress(state: Partial<ProgressState>) {
  try {
    const toSave = {
      currentLevel: state.currentLevel,
      unlockedLevels: state.unlockedLevels,
      completedLevels: state.completedLevels,
      ownedCards: state.ownedCards,
      playerDeck: state.playerDeck,
      cardLevels: state.cardLevels,
      playerProfile: state.playerProfile,
      bgmVolume: state.bgmVolume,
      sfxVolume: state.sfxVolume,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    // 静默失败
  }
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  ...DEFAULT_STATE,

  _hydrate: () => {
    loadProgress().then((saved) => {
      if (Object.keys(saved).length > 0) {
        set({ ...DEFAULT_STATE, ...saved });
      }
    });
  },

  completeLevel: (levelId, rewardCards) => {
    set((state) => {
      const newCompleted = state.completedLevels.includes(levelId)
        ? state.completedLevels
        : [...state.completedLevels, levelId];
      const newOwned = [...state.ownedCards];
      if (rewardCards) {
        for (const card of rewardCards) {
          if (!newOwned.includes(card)) newOwned.push(card);
        }
      }
      const nextLevel = levelId + 1;
      const newUnlocked = state.unlockedLevels.includes(nextLevel)
        ? state.unlockedLevels
        : [...state.unlockedLevels, nextLevel];

      const newState = {
        completedLevels: newCompleted,
        ownedCards: newOwned,
        unlockedLevels: newUnlocked,
        currentLevel: Math.max(state.currentLevel, nextLevel),
      };

      // 异步保存
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  unlockLevel: (levelId) => {
    set((state) => {
      const newState = {
        unlockedLevels: state.unlockedLevels.includes(levelId)
          ? state.unlockedLevels
          : [...state.unlockedLevels, levelId],
      };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  updateDeck: (deck) => {
    set((state) => {
      const newState = { playerDeck: deck };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  upgradeCard: (cardId) => {
    set((state) => {
      const newState = {
        cardLevels: {
          ...state.cardLevels,
          [cardId]: (state.cardLevels[cardId] || 1) + 1,
        },
      };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  setBGMVolume: (v) => {
    set((state) => {
      const newState = { bgmVolume: v };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  setSFXVolume: (v) => {
    set((state) => {
      const newState = { sfxVolume: v };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  // 根据单局对战记录更新出牌画像
  updateProfile: (levelId, log) => {
    set((state) => {
      const p = { ...state.playerProfile };
      p.typeFrequency = { ...p.typeFrequency };
      p.afterDamageFrequency = { ...p.afterDamageFrequency };
      p.afterHealFrequency = { ...p.afterHealFrequency };
      p.firstTurnFrequency = { ...p.firstTurnFrequency };
      p.lowHPFrequency = { ...p.lowHPFrequency };
      p.comboFrequency = { ...p.comboFrequency };

      for (let i = 0; i < log.length; i++) {
        const entry = log[i];
        const type = entry.playerCardType;

        // 总次数 + 牌型频率
        p.totalTurns++;
        p.typeFrequency[type] = (p.typeFrequency[type] || 0) + 1;

        // 首回合偏好
        if (i === 0) {
          p.firstTurnFrequency[type] = (p.firstTurnFrequency[type] || 0) + 1;
        }

        // 受伤后出牌偏好
        if (i > 0 && log[i - 1].playerDamage > 0) {
          p.afterDamageFrequency[type] = (p.afterDamageFrequency[type] || 0) + 1;
        }

        // 对手受伤后出牌偏好（我造成伤害后的下一回合）
        if (i > 0 && log[i - 1].enemyDamage > 0) {
          p.afterHealFrequency[type] = (p.afterHealFrequency[type] || 0) + 1;
        }

        // 连续出同类牌
        if (i > 0 && log[i - 1].playerCardType === type) {
          p.comboFrequency[type] = (p.comboFrequency[type] || 0) + 1;
        }

        // 低血量出牌（用累积伤害粗略估算，第3关后HP可能较低）
        if (levelId >= 3 && i >= Math.floor(log.length / 2)) {
          p.lowHPFrequency[type] = (p.lowHPFrequency[type] || 0) + 1;
        }
      }

      const newState = { playerProfile: p };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },

  // 重置进度：回到第1关开始重新挑战，保留通关记录和关卡选择
  resetProgress: () => {
    set((state) => {
      const newState = {
        currentLevel: 1,
        completedLevels: [] as number[],
        // 保留 unlockedLevels，关卡选择器仍可使用
      };
      setTimeout(() => saveProgress({ ...state, ...newState }), 0);
      return newState;
    });
  },
}));
