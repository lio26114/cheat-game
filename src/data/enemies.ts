// src/data/enemies.ts
// 所有对手数据 + AI 配置

import { CardType } from './cards';

export type AIStrategy = 'random' | 'aggressive' | 'defensive' | 'counter' | 'adaptive';

export interface Enemy {
  id: string;
  name: string;
  title: string;
  portraitColor: string;
  aiStrategy: AIStrategy;
  aiParams: {
    attackBias: number;
    trapBias: number;
    bluffRate: number;
  };
  passiveAbility?: {
    id: string;
    description: string;
  };
  dialogLines: {
    onWin: string[];
    onLose: string[];
    onTurn: string[];
  };
}

export const ENEMIES: Enemy[] = [
  {
    id: 'enemy_xiaoliu',
    name: '小六',
    title: '菜鸟赌徒',
    portraitColor: '#4a3728',
    aiStrategy: 'random',
    aiParams: { attackBias: 0.3, trapBias: 0.1, bluffRate: 0 },
    dialogLines: {
      onWin: ['嘿嘿，运气好罢了！', '我赢了我赢了！'],
      onLose: ['不可能……再来一局！', '你出老千！'],
      onTurn: ['让我想想……', '这把稳了！'],
    },
  },
  {
    id: 'enemy_laowang',
    name: '老王',
    title: '江湖老手',
    portraitColor: '#2d4a3a',
    aiStrategy: 'aggressive',
    aiParams: { attackBias: 0.6, trapBias: 0.2, bluffRate: 0.1 },
    dialogLines: {
      onWin: ['姜还是老的辣。', '小伙子，还嫩了点。'],
      onLose: ['有点意思……', '你运气不错。'],
      onTurn: ['看好了。', '我打的牌，你能猜到吗？'],
    },
  },
  {
    id: 'enemy_ahui',
    name: '阿辉',
    title: '守财奴',
    portraitColor: '#3a2d4a',
    aiStrategy: 'defensive',
    aiParams: { attackBias: 0.15, trapBias: 0.35, bluffRate: 0.2 },
    dialogLines: {
      onWin: ['稳如磐石。', '你急了。'],
      onLose: ['不可能……我的策略完美无缺。'],
      onTurn: ['不急，慢慢来。', '你先出，我不急。'],
    },
  },
  {
    id: 'enemy_dafei',
    name: '大飞',
    title: '亡命赌徒',
    portraitColor: '#5a2020',
    aiStrategy: 'aggressive',
    aiParams: { attackBias: 0.65, trapBias: 0.15, bluffRate: 0.15 },
    dialogLines: {
      onWin: ['赢了！老子命硬！', '赌命？我从来不怕。'],
      onLose: ['不可能……老子从没输过！', '再来！我不服！'],
      onTurn: ['莽就完了！', '想那么多干嘛？干！'],
    },
  },
  {
    id: 'enemy_sanjie',
    name: '三姐',
    title: '冷面操盘手',
    portraitColor: '#4a1a4a',
    aiStrategy: 'defensive',
    aiParams: { attackBias: 0.2, trapBias: 0.3, bluffRate: 0.35 },
    dialogLines: {
      onWin: ['急了？我还没用力呢。', '你输在太想赢了。'],
      onLose: ['……有意思。', '看来你比我想的强。'],
      onTurn: ['别急，慢慢来。', '你慌了。'],
    },
  },
  {
    id: 'enemy_jingzi',
    name: '镜子',
    title: '面具赌徒',
    portraitColor: '#1a1a2e',
    aiStrategy: 'counter',
    aiParams: { attackBias: 0.3, trapBias: 0.3, bluffRate: 0.4 },
    dialogLines: {
      onWin: ['我看到了你的心思。', '你的出牌，我早已看穿。'],
      onLose: ['有趣……你的心思我竟读不到。'],
      onTurn: ['你的下一步……我看到了。', '别紧张，我只是在看你。'],
    },
  },
  {
    id: 'enemy_laok',
    name: '老K',
    title: '规矩贩子',
    portraitColor: '#4a3a1a',
    aiStrategy: 'adaptive',
    aiParams: { attackBias: 0.35, trapBias: 0.25, bluffRate: 0.3 },
    passiveAbility: {
      id: 'rule_change',
      description: '每3回合修改一条规则',
    },
    dialogLines: {
      onWin: ['规矩是我定的，你怎么赢？', '不懂规矩的人，只有输。'],
      onLose: ['你……你破坏了规矩！', '这不可能，规矩不会失效！'],
      onTurn: ['让我改条规矩。', '这条不适合你了，换一条吧。'],
    },
  },
  {
    id: 'enemy_jiumei',
    name: '九妹',
    title: '暗牌师',
    portraitColor: '#3a1a3a',
    aiStrategy: 'counter',
    aiParams: { attackBias: 0.3, trapBias: 0.35, bluffRate: 0.4 },
    passiveAbility: {
      id: 'hidden_card',
      description: '有一张隐藏暗牌，第5回合揭示',
    },
    dialogLines: {
      onWin: ['你看到的，都是我想让你看到的。', '暗牌永远是最后翻的。'],
      onLose: ['……你居然翻到了底。'],
      onTurn: ['别急，好戏在后头。', '你以为你全看到了？'],
    },
  },
  {
    id: 'enemy_yaba',
    name: '哑巴',
    title: '无声赌徒',
    portraitColor: '#2a2a2a',
    aiStrategy: 'counter',
    aiParams: { attackBias: 0.3, trapBias: 0.3, bluffRate: 0.35 },
    passiveAbility: {
      id: 'resonance',
      description: '双方出同类型牌时伤害归零，不同牌正常结算',
    },
    dialogLines: {
      onWin: ['……', '（轻轻摇头）'],
      onLose: ['……！', '（微微睁大眼睛）'],
      onTurn: ['……', '（盯着你）'],
    },
  },
  {
    id: 'enemy_tiejiang',
    name: '铁匠',
    title: '绝境铁人',
    portraitColor: '#5a3a1a',
    aiStrategy: 'aggressive',
    aiParams: { attackBias: 0.55, trapBias: 0.2, bluffRate: 0.25 },
    passiveAbility: {
      id: 'last_stand',
      description: 'HP低于10时，所有攻击牌伤害+2',
    },
    dialogLines: {
      onWin: ['挨打越多，出拳越重。', '铁是打出来的。'],
      onLose: ['……好硬的骨头。', '下次，我不会输。'],
      onTurn: ['来啊！往这打！', '越痛我越清醒。'],
    },
  },
  {
    id: 'enemy_caipan',
    name: '裁判长',
    title: '规则制造者',
    portraitColor: '#0f3460',
    aiStrategy: 'adaptive',
    aiParams: { attackBias: 0.35, trapBias: 0.25, bluffRate: 0.35 },
    passiveAbility: {
      id: 'rule_change',
      description: '每3回合修改一条规则',
    },
    dialogLines: {
      onWin: ['规则在我手中。', '你不该挑战规则。'],
      onLose: ['规则……被打破了？', '不可能！规则是绝对的！'],
      onTurn: ['让我改一下规则。', '这条规则，不适合你了。'],
    },
  },
  {
    id: 'enemy_ying',
    name: '影',
    title: '幕后副手',
    portraitColor: '#16213e',
    aiStrategy: 'adaptive',
    aiParams: { attackBias: 0.4, trapBias: 0.3, bluffRate: 0.45 },
    passiveAbility: {
      id: 'prophecy',
      description: '每局开始前宣布一张牌，若对手出该牌则受双倍伤害',
    },
    dialogLines: {
      onWin: ['一切尽在掌握。', '你的命运，我已预见。'],
      onLose: ['不可能……我的预言从未失败！'],
      onTurn: ['你下一张……我看到了。', '命运不可违抗。'],
    },
  },
  {
    id: 'enemy_zhuangzhu',
    name: '庄主',
    title: '牌局会之主',
    portraitColor: '#0a0a0a',
    aiStrategy: 'adaptive',
    aiParams: { attackBias: 0.35, trapBias: 0.35, bluffRate: 0.5 },
    passiveAbility: {
      id: 'phase_shift',
      description: '三阶段HP，每阶段规则重置',
    },
    dialogLines: {
      onWin: ['你以为你能逃出去？', '牌局会永远存在。'],
      onLose: ['……有趣。你是第一个走到这里还赢了的人。'],
      onTurn: ['欢迎来到最终局。', '你想知道真相吗？'],
    },
  },
];

export function getEnemyById(id: string): Enemy | undefined {
  return ENEMIES.find((e) => e.id === id);
}
