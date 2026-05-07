import { create } from 'zustand';

// 音效类型（保留类型定义兼容）
export type SFXType =
  | 'card_play'
  | 'card_flip'
  | 'hit'
  | 'counter'
  | 'mindread'
  | 'trap'
  | 'victory'
  | 'defeat'
  | 'button'
  | 'combo'
  | 'pressure'
  | 'rule_change'
  | 'phase_shift';

// BGM类型（保留类型定义兼容）
export type BGMType = 'menu' | 'battle' | 'boss' | null;

interface AudioState {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
  currentBGM: BGMType;
  initialized: boolean;

  init: () => void;
  setBGMEnabled: (enabled: boolean) => void;
  setSFXEnabled: (enabled: boolean) => void;
  setBGMVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
  playBGM: (type: BGMType) => void;
  stopBGM: () => void;
  playSFX: (type: SFXType) => void;
  cleanup: () => void;
}

export const useAudioStore = create<AudioState>((set, _get) => ({
  bgmEnabled: false,
  sfxEnabled: false,
  bgmVolume: 0,
  sfxVolume: 0,
  currentBGM: null,
  initialized: true,

  init: () => {},
  setBGMEnabled: () => {},
  setSFXEnabled: () => {},
  setBGMVolume: () => {},
  setSFXVolume: () => {},
  playBGM: () => {},
  stopBGM: () => {},
  playSFX: () => {},
  cleanup: () => {},
}));
