// src/data/levels.ts
// 12 关关卡配置

export interface SpecialRule {
  type: string;
  description: string;
  triggerTurn?: number;
}

export interface Level {
  id: number;
  name: string;
  enemyId: string;
  playerHP: number;
  enemyHP: number;
  specialRules: SpecialRule[];
  storyBeforeId: string;
  storyWinId: string;
  storyLoseId: string;
  rewardCards?: string[];
  rewardSummary: string;   // 通关后的关卡小总结
  strategyHint: string;  // 对手出牌策略提示
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '试水局',
    enemyId: 'enemy_xiaoliu',
    playerHP: 10,
    enemyHP: 10,
    specialRules: [],
    storyBeforeId: 'story_1_before',
    storyWinId: 'story_1_win',
    storyLoseId: 'story_1_lose',
    rewardSummary: '小六只靠运气和本能出牌，毫无章法。但这是故意的——引路人要你先赢，才能看见后面的真正对手。牌有克制关系，这是这个世界的基本法则，接下来每一关都会逼你把它摸透。',
  },
  {
    id: 2,
    name: '老兵局',
    enemyId: 'enemy_laowang',
    playerHP: 12,
    enemyHP: 14,
    specialRules: [],
    storyBeforeId: 'story_2_before',
    storyWinId: 'story_2_win',
    storyLoseId: 'story_2_lose',
    rewardCards: ['card_defense'],
    rewardSummary: '老王满手全是攻击，防御牌压根不碰。他不是不会——是被逼到绝路后，只信"先下手为强"。这种对手好对付，但也提醒你：在牌局会里，每个人都被自己的执念绑着。',
  },
  {
    id: 3,
    name: '龟壳局',
    enemyId: 'enemy_ahui',
    playerHP: 12,
    enemyHP: 16,
    specialRules: [],
    storyBeforeId: 'story_3_before',
    storyWinId: 'story_3_win',
    storyLoseId: 'story_3_lose',
    rewardCards: ['card_mindread'],
    rewardSummary: '阿辉满手防御，以为"不出错就不会输"。但牌局会里，只守不攻，迟早被人读穿。读心牌能看穿对手的底牌——这是打破龟壳的唯一方式。你已经学会了。',
  },
  {
    id: 4,
    name: '镜像局',
    enemyId: 'enemy_jingzi',
    playerHP: 14,
    enemyHP: 16,
    specialRules: [
      {
        type: 'imitate',
        description: '镜子擅长模仿——他会根据本局你最近的出牌来推测并克制你',
      },
    ],
    storyBeforeId: 'story_4_before',
    storyWinId: 'story_4_win',
    storyLoseId: 'story_4_lose',
    rewardSummary: '镜子不按自己的牌路出牌——他模仿你。第一回合准确率很低，但越往后越能读到你。赢他的关键：别让自己有规律，故意出烂牌反而是对的。从这一关开始，对手不再只是"出牌"，他们会研究你。',
  },
  {
    id: 5,
    name: '连击局',
    enemyId: 'enemy_dafei',
    playerHP: 14,
    enemyHP: 18,
    specialRules: [
      {
        type: 'combo_boost',
        description: '连击伤害加成提升至2倍',
      },
    ],
    storyBeforeId: 'story_5_before',
    storyWinId: 'story_5_win',
    storyLoseId: 'story_5_lose',
    rewardCards: ['card_trap'],
    rewardSummary: '大飞只信"莽"，连击伤害翻倍让他更加肆无忌惮。但他没想到有人会故意打断自己的节奏。连击局告诉你：有时候，不按直觉出牌，反而能破局。后面还有更离谱的规则。',
  },
  {
    id: 6,
    name: '高压局',
    enemyId: 'enemy_sanjie',
    playerHP: 14,
    enemyHP: 20,
    specialRules: [
      {
        type: 'pressure_boost',
        description: '心理压力增长速度翻倍',
      },
    ],
    storyBeforeId: 'story_6_before',
    storyWinId: 'story_6_win',
    storyLoseId: 'story_6_lose',
    rewardSummary: '三姐不靠牌赢你，她靠压力。压力满时你会失控，出什么牌自己都控制不了。但蓄力牌能降压——这局教你一个道理：慌的时候，先稳住，别硬撑。已经过半了，后面的对手只会更狠。',
  },
  {
    id: 7,
    name: '暗流局',
    enemyId: 'enemy_jiumei',
    playerHP: 16,
    enemyHP: 20,
    specialRules: [
      {
        type: 'hidden_card',
        description: '九妹有一张隐藏牌，第5回合揭示',
        triggerTurn: 5,
      },
    ],
    storyBeforeId: 'story_7_before',
    storyWinId: 'story_7_win',
    storyLoseId: 'story_7_lose',
    rewardSummary: '九妹的暗牌在第5回合揭示，在那之前她比你多一张未知牌。这关的本质是"信息差"——你看见的，都是她想让你看见的。从这一关开始，你不仅要算牌，还要算"她想让我看见什么"。',
  },
  {
    id: 8,
    name: '规则扭曲局',
    enemyId: 'enemy_laok',
    playerHP: 16,
    enemyHP: 22,
    specialRules: [
      {
        type: 'rule_change',
        description: '每3回合，老K可修改一条规则',
        triggerTurn: 3,
      },
    ],
    storyBeforeId: 'story_8_before',
    storyWinId: 'story_8_win',
    storyLoseId: 'story_8_lose',
    rewardSummary: '老K是规矩贩子，牌桌上的规则他说改就改。每三回合他会禁掉一种牌型，你只有三回合来适应新规矩。这关的核心：别死守一种打法，随时准备应变。离最终局只剩四关了。',
  },
  {
    id: 9,
    name: '共鸣局',
    enemyId: 'enemy_yaba',
    playerHP: 18,
    enemyHP: 24,
    specialRules: [
      {
        type: 'resonance',
        description: '双方出同类型牌时伤害归零，不同牌正常结算',
      },
    ],
    storyBeforeId: 'story_9_before',
    storyWinId: 'story_9_win',
    storyLoseId: 'story_9_lose',
    rewardSummary: '哑巴不出声，但共鸣局里，出一样的牌伤害就归零。这意味着你必须猜中对方出什么，才能打满伤害。这是整个游戏里最考验"读人"的一关——你已经走完了四分之三的路程。',
  },
  {
    id: 10,
    name: '背水局',
    enemyId: 'enemy_tiejian',
    playerHP: 16,
    enemyHP: 26,
    specialRules: [
      {
        type: 'last_stand',
        description: 'HP低于4时，所有攻击牌伤害+2',
      },
    ],
    storyBeforeId: 'story_10_before',
    storyWinId: 'story_10_win',
    storyLoseId: 'story_10_lose',
    rewardSummary: '铁匠在挨打中变强，HP低时攻击牌伤害+2。这个规则对你也生效——有时候低血量反而是优势。还剩两关。庄主的影子已经在暗处看着你了。',
  },
  {
    id: 11,
    name: '预言局',
    enemyId: 'enemy_ying',
    playerHP: 20,
    enemyHP: 30,
    specialRules: [
      {
        type: 'prophecy',
        description: '影每回合预言你的一张牌，猜中则额外+2伤害',
      },
    ],
    storyBeforeId: 'story_11_before',
    storyWinId: 'story_11_win',
    storyLoseId: 'story_11_lose',
    rewardSummary: '影是庄主的人，他能预见你的出牌。这关的核心是"反直觉"——明知道该出攻击，偏偏出防御。你伤了他，但最终局不会轻松。庄主已经知道你的打法了。',
  },
  {
    id: 12,
    name: '最终局',
    enemyId: 'enemy_zhuangzhu',
    playerHP: 20,
    enemyHP: 40,
    specialRules: [
      {
        type: 'phase_shift',
        description: '庄主HP每降1/3，随机习得一种前关对手的能力',
      },
    ],
    storyBeforeId: 'story_12_before',
    storyWinId: 'story_12_win',
    storyLoseId: 'story_12_lose',
    rewardSummary: '庄主习得了前面所有对手的能力。他会在一阶段用镜像，二阶段用连击，三阶段用预言……这是全部关卡的集大成之战。赢了，你自由。但庄主最后那句话，让你觉得——这个故事还没有结束。',
  },
];

export function getLevelById(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
