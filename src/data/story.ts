// src/data/story.ts
// 剧情文本数据 v2 — 更丰满的背景与角色刻画

export interface StoryLine {
  id: string;
  lines: StoryDialog[];
}

export interface StoryDialog {
  speaker: string;
  text: string;
  isPlayer?: boolean;
}

export const STORIES: Record<string, StoryLine> = {
  // ====== 第一关：入局 ======
  story_1_before: {
    id: 'story_1_before',
    lines: [
      { speaker: '旁白', text: '你不记得自己是怎么来到这里的。' },
      { speaker: '旁白', text: '睁开眼，四周是昏暗的灯光，空气里有旧木头和烟的味道。' },
      { speaker: '旁白', text: '你坐在一张牌桌前。对面坐着一个笑嘻嘻的年轻人。' },
      { speaker: '主角', text: '……这是哪？', isPlayer: true },
      { speaker: '小六', text: '哟，醒了？欢迎欢迎！' },
      { speaker: '主角', text: '你是谁？我为什么在这里？', isPlayer: true },
      { speaker: '小六', text: '我叫小六。至于你为什么在这——' },
      { speaker: '小六', text: '你欠了债啊，哥们。' },
      { speaker: '主角', text: '我从来没借过什么债。', isPlayer: true },
      { speaker: '引路人', text: '不是你借的。是有人替你借的。' },
      { speaker: '旁白', text: '一个蒙面人从阴影中走出来，声音平静得像在念菜单。' },
      { speaker: '引路人', text: '我叫引路人。你的债主是我，你的裁判也是我。' },
      { speaker: '引路人', text: '规则很简单：赢十二局牌，你自由。输了——' },
      { speaker: '主角', text: '输了怎样？', isPlayer: true },
      { speaker: '引路人', text: '你不会想知道的。' },
      { speaker: '引路人', text: '先和这小子打一局吧。他菜得很，算热身。' },
      { speaker: '小六', text: '嘿！谁菜了？我运气可好了！' },
      { speaker: '主角', text: '……我没有别的选择，对吧。', isPlayer: true },
      { speaker: '引路人', text: '聪明。' },
    ],
  },
  story_1_win: {
    id: 'story_1_win',
    lines: [
      { speaker: '小六', text: '不可能……再来一局！' },
      { speaker: '引路人', text: '第一局，过了。' },
      { speaker: '主角', text: '那个小六……他也是欠债的人吗？', isPlayer: true },
      { speaker: '引路人', text: '这里的每个人都是。包括你。' },
      { speaker: '主角', text: '我要赢多少局才能走？', isPlayer: true },
      { speaker: '引路人', text: '十二局。一局不少。' },
      { speaker: '旁白', text: '小六被两个人架着带走了。他还在喊"再来一局"。' },
      { speaker: '引路人', text: '按规矩，赢了就有奖励。一条情报——' },
      { speaker: '引路人', text: '牌有克制关系。不是随机瞎出的。每种牌都有克它的另一种。' },
      { speaker: '引路人', text: '具体怎么克，自己赢出来。' },
    ],
  },
  story_1_lose: {
    id: 'story_1_lose',
    lines: [
      { speaker: '小六', text: '嘿嘿，运气好罢了！' },
      { speaker: '引路人', text: '……再来。输一次不会怎样，连输——' },
      { speaker: '引路人', text: '你不会想知道。' },
      { speaker: '主角', text: '……我一定能赢。', isPlayer: true },
    ],
  },
  // ====== 第二关 ======
  story_2_before: {
    id: 'story_2_before',
    lines: [
      { speaker: '旁白', text: '你的下一个对手已经坐在牌桌前。一个中年男人，指节发白地攥着桌沿。' },
      { speaker: '老王', text: '……你也是被拉来的吧。' },
      { speaker: '主角', text: '你也是？', isPlayer: true },
      { speaker: '老王', text: '欠了债，还不清，就被送到这了。别以为你有例外。' },
      { speaker: '老王', text: '少废话，赶紧开始。我赢了你就能多活一局。' },
      { speaker: '旁白', text: '他眼神里有恐惧，但更多的是一种被逼到绝路的凶狠。' },
    ],
  },
  story_2_win: {
    id: 'story_2_win',
    lines: [
      { speaker: '老王', text: '……不可能。我明明一直出攻击——' },
      { speaker: '主角', text: '你全在攻，陷阱一拦就挡住了。', isPlayer: true },
      { speaker: '老王', text: '我没办法……不攻就死得更快……' },
      { speaker: '旁白', text: '老王被带走了。他没有挣扎，只是低着头。' },
      { speaker: '引路人', text: '你赢了。按规矩，给你一条情报当奖励。' },
      { speaker: '引路人', text: '他只会攻和陷阱。防御牌，他压根不用。记住这个——下一个对手不一定这么简单。' },
      { speaker: '主角', text: '你为什么告诉我这些？', isPlayer: true },
      { speaker: '引路人', text: '规矩。赢了就有奖励。别想多了。' },
    ],
  },
  story_2_lose: {
    id: 'story_2_lose',
    lines: [
      { speaker: '老王', text: '……对不住了。我也只是想多活一局。' },
      { speaker: '引路人', text: '再试一次。你的运气还没用完。' },
      { speaker: '主角', text: '他一直在猛攻……有没有办法反制？', isPlayer: true },
      { speaker: '引路人', text: '……赢了第一局，我欠你一条情报。他只用攻击和陷阱，防御从不碰。自己想想怎么对付。' },
    ],
  },
  // ====== 第三关 ======
  story_3_before: {
    id: 'story_3_before',
    lines: [
      { speaker: '旁白', text: '第三张椅子上的男人很瘦，缩着肩膀，手指一直在搓牌角。' },
      { speaker: '旁白', text: '他好像没注意到你进来，嘴里一直在念叨什么。' },
      { speaker: '阿辉', text: '……只要不出错，就不会输。只要不出错……' },
      { speaker: '主角', text: '……', isPlayer: true },
      { speaker: '阿辉', text: '你来了。别急，慢慢来。急了就输。' },
      { speaker: '旁白', text: '他搓牌的速度快了一点，但表情还是很平静。' },
    ],
  },
  story_3_win: {
    id: 'story_3_win',
    lines: [
      { speaker: '阿辉', text: '……不可能。我一直守着，你怎么打穿的？' },
      { speaker: '主角', text: '你缩太久了。防御再多，也挡不住读心。', isPlayer: true },
      { speaker: '阿辉', text: '我以为……只要不出错就不会输……' },
      { speaker: '旁白', text: '阿辉站起来，没看任何人。' },
    ],
  },
  story_3_lose: {
    id: 'story_3_lose',
    lines: [
      { speaker: '阿辉', text: '攻不破的。别费劲了。' },
      { speaker: '主角', text: '……我总觉得有办法。', isPlayer: true },
      { speaker: '引路人', text: '上一局你赢了，还欠你一条。' },
      { speaker: '引路人', text: '他满手防御。读心牌能穿透防御——克制关系，自己去悟。' },
    ],
  },
  // ====== 第四关 ======
  story_4_before: {
    id: 'story_4_before',
    lines: [
      { speaker: '旁白', text: '这个人戴着一副无表情的面具，安静地坐在牌桌对面。' },
      { speaker: '旁白', text: '他不像其他人那样紧张或凶狠，只是静静地看着你。' },
      { speaker: '镜子', text: '……' },
      { speaker: '主角', text: '你不说话？', isPlayer: true },
      { speaker: '旁白', text: '他没有回答，只是微微歪了一下头——像是在观察你。' },
      { speaker: '引路人', text: '他叫镜子。他不出自己的牌——他模仿你。' },
      { speaker: '引路人', text: '你出什么，他就学什么。然后找到克制你的方式。' },
      { speaker: '主角', text: '那怎么赢？', isPlayer: true },
      { speaker: '引路人', text: '让他学不像你。别出习惯牌。' },
      { speaker: '镜子', text: '……' },
      { speaker: '旁白', text: '他终于动了动手指，似乎在等你出第一张牌。' },
    ],
  },
  story_4_win: {
    id: 'story_4_win',
    lines: [
      { speaker: '镜子', text: '……' },
      { speaker: '旁白', text: '镜子摘下面具，露出的表情不是愤怒，而是困惑。' },
      { speaker: '镜子', text: '我读不到你。' },
      { speaker: '主角', text: '也许你该照照自己。', isPlayer: true },
      { speaker: '旁白', text: '镜子站起来，把面具放在桌上。他没有挣扎，只是沉默地被带走。' },
      { speaker: '引路人', text: '又赢了。情报——' },
      { speaker: '引路人', text: '后面的人不像前几个那么简单了。他们各有各的手段，有的能看穿你的习惯，有的能扭曲规则。' },
      { speaker: '主角', text: '所以每个人都有自己的本事？', isPlayer: true },
      { speaker: '引路人', text: '都有。只是有人藏得深。' },
    ],
  },
  story_4_lose: {
    id: 'story_4_lose',
    lines: [
      { speaker: '镜子', text: '……' },
      { speaker: '旁白', text: '镜子没有笑，只是又戴好面具，静静看着你。' },
      { speaker: '引路人', text: '他模仿你的出牌。别让自己有规律——有时候故意出烂牌反而是对的。' },
    ],
  },
  // ====== 第五关 ======
  story_5_before: {
    id: 'story_5_before',
    lines: [
      { speaker: '旁白', text: '新的对手坐在桌前。一个年轻男人，手臂上有伤疤，眼神凶狠。' },
      { speaker: '大飞', text: '赌命？老子从来不怕。' },
      { speaker: '引路人', text: '这次规则变了——连击的威力被放大了。连续出同一种牌，伤害翻倍。' },
      { speaker: '大飞', text: '莽就完了！想那么多干嘛？' },
      { speaker: '主角', text: '……', isPlayer: true },
    ],
  },
  story_5_win: {
    id: 'story_5_win',
    lines: [
      { speaker: '大飞', text: '不可能……老子从没输过！' },
      { speaker: '主角', text: '你输在只会莽。', isPlayer: true },
      { speaker: '旁白', text: '大飞一拳砸在桌上，被带走了。' },
      { speaker: '引路人', text: '情报——连击局里连续出同类牌伤害翻倍。后面还会遇到更离谱的规则。' },
    ],
  },
  story_5_lose: {
    id: 'story_5_lose',
    lines: [
      { speaker: '大飞', text: '赢了！老子命硬！' },
      { speaker: '引路人', text: '连续出同类型牌可以触发连击加成。在这局里收益更大。' },
    ],
  },
  // ====== 第六关 ======
  story_6_before: {
    id: 'story_6_before',
    lines: [
      { speaker: '旁白', text: '这次坐在对面的是个女人。妆容精致，表情冷淡，像是在审视一件商品。' },
      { speaker: '三姐', text: '别急，慢慢来。' },
      { speaker: '引路人', text: '高压局。你的心理压力会比平时涨得更快。' },
      { speaker: '引路人', text: '压力到了极限，你连自己出什么牌都控制不了。' },
      { speaker: '三姐', text: '你慌了。所有人都会慌。' },
      { speaker: '主角', text: '我扛得住。', isPlayer: true },
    ],
  },
  story_6_win: {
    id: 'story_6_win',
    lines: [
      { speaker: '三姐', text: '……有意思。' },
      { speaker: '主角', text: '恐惧谁都有，但我不让它替我做决定。', isPlayer: true },
      { speaker: '旁白', text: '三姐站起来，整理了一下衣领，头也不回地走了。' },
      { speaker: '引路人', text: '情报——压力到了极限你会失控。蓄力牌能降压，别硬撑。' },
    ],
  },
  story_6_lose: {
    id: 'story_6_lose',
    lines: [
      { speaker: '三姐', text: '你输在太想赢了。' },
      { speaker: '引路人', text: '蓄力牌可以降低压力。别等满了才想着降。' },
    ],
  },
  // ====== 第七关 ======
  story_7_before: {
    id: 'story_7_before',
    lines: [
      { speaker: '旁白', text: '新对手是个年轻女人，笑容很浅，但眼底是算计。' },
      { speaker: '九妹', text: '别急，好戏在后头。' },
      { speaker: '主角', text: '你手里藏着什么？', isPlayer: true },
      { speaker: '九妹', text: '你看到的，都是我想让你看到的。' },
      { speaker: '引路人', text: '她叫九妹。她有一张暗牌，前四回合你不知道是什么。' },
      { speaker: '引路人', text: '第五回合才会揭晓。在那之前，假设她比你多一张牌。' },
      { speaker: '九妹', text: '你以为你全看到了？' },
    ],
  },
  story_7_win: {
    id: 'story_7_win',
    lines: [
      { speaker: '九妹', text: '……你居然翻到了底。' },
      { speaker: '主角', text: '暗牌翻出来也没用。', isPlayer: true },
      { speaker: '旁白', text: '九妹站起来，嘴角微微弯了一下，不知是笑还是苦涩。' },
      { speaker: '引路人', text: '情报——暗牌在第5回合揭示。在那之前，她比你多一张未知牌。' },
    ],
  },
  story_7_lose: {
    id: 'story_7_lose',
    lines: [
      { speaker: '九妹', text: '暗牌永远是最后翻的。' },
      { speaker: '引路人', text: '暗牌第5回合揭示。在那之前，假设对手比你多一张牌。' },
    ],
  },
  // ====== 第八关 ======
  story_8_before: {
    id: 'story_8_before',
    lines: [
      { speaker: '旁白', text: '新对手是个矮胖男人，手指上戴着好几枚戒指，每枚都不一样。' },
      { speaker: '老K', text: '规矩懂不懂？不懂没关系，我教你。' },
      { speaker: '主角', text: '谁定的规矩？', isPlayer: true },
      { speaker: '老K', text: '我定的。每三回合我就改一次，你能怎样？' },
      { speaker: '引路人', text: '他是规矩贩子老K。牌桌上的规则，他说改就改。' },
      { speaker: '引路人', text: '每三回合，他会禁掉一种牌型。你只有三回合来适应新规矩。' },
      { speaker: '老K', text: '来吧，在我规矩里，你赢不了。' },
    ],
  },
  story_8_win: {
    id: 'story_8_win',
    lines: [
      { speaker: '老K', text: '你……你破坏了规矩！' },
      { speaker: '主角', text: '规矩是你定的，不是牌的。', isPlayer: true },
      { speaker: '老K', text: '这不可能，规矩不会失效！' },
      { speaker: '旁白', text: '老K摘下戒指，一枚一枚放在桌上，被带走了。' },
      { speaker: '引路人', text: '情报——规则每3回合变一次。别死守一种打法，随时准备应变。' },
    ],
  },
  story_8_lose: {
    id: 'story_8_lose',
    lines: [
      { speaker: '老K', text: '不懂规矩的人，只有输。' },
      { speaker: '引路人', text: '规则每3回合变一次。别死守一种打法，随时准备应变。' },
    ],
  },
  // ====== 第九关 ======
  story_9_before: {
    id: 'story_9_before',
    lines: [
      { speaker: '旁白', text: '新对手是个沉默的人。他什么都没说，只是坐下来，看着自己的手。' },
      { speaker: '哑巴', text: '……' },
      { speaker: '主角', text: '他不说话？', isPlayer: true },
      { speaker: '引路人', text: '他叫哑巴。共鸣局——双方出同类型的牌，伤害互相抵消。' },
      { speaker: '引路人', text: '出一样的牌就是平局，出不一样的才分胜负。' },
      { speaker: '哑巴', text: '……' },
      { speaker: '旁白', text: '哑巴抬起头，目光冰冷而平静，仿佛已经看穿了你。' },
    ],
  },
  story_9_win: {
    id: 'story_9_win',
    lines: [
      { speaker: '哑巴', text: '……！' },
      { speaker: '旁白', text: '哑巴微微睁大了眼睛。这大概是他最接近表情的时刻。' },
      { speaker: '主角', text: '你的共鸣，我读到了。', isPlayer: true },
      { speaker: '旁白', text: '哑巴站起来，沉默地走了。' },
      { speaker: '引路人', text: '情报——共鸣局中，猜中对方出牌就能制造错开，打满伤害。' },
    ],
  },
  story_9_lose: {
    id: 'story_9_lose',
    lines: [
      { speaker: '哑巴', text: '……' },
      { speaker: '旁白', text: '哑巴轻轻摇头，似乎对你的表现有些失望。' },
      { speaker: '引路人', text: '共鸣局的核心是猜牌。要么对冲求和，要么错开打伤害。' },
    ],
  },
  // ====== 第十关 ======
  story_10_before: {
    id: 'story_10_before',
    lines: [
      { speaker: '旁白', text: '新对手是个壮实的男人，手臂上有烫伤的痕迹，像常年和铁打交道。' },
      { speaker: '铁匠', text: '来啊！往这打！' },
      { speaker: '引路人', text: '背水局。HP低于10时，所有攻击牌伤害+2。' },
      { speaker: '引路人', text: '这个规则对你和他都生效。但铁匠……他就是在挨打中变强的。' },
      { speaker: '铁匠', text: '越痛我越清醒。' },
      { speaker: '主角', text: '……', isPlayer: true },
    ],
  },
  story_10_win: {
    id: 'story_10_win',
    lines: [
      { speaker: '铁匠', text: '……好硬的骨头。' },
      { speaker: '主角', text: '你扛得住打，但不代表打不倒。', isPlayer: true },
      { speaker: '旁白', text: '铁匠按着胸口站起来，看了你一眼，然后沉默地点了点头。' },
      { speaker: '引路人', text: '情报——HP低时攻击牌伤害+2。有时候低血量反而是优势。' },
      { speaker: '引路人', text: '还剩两关。' },
    ],
  },
  story_10_lose: {
    id: 'story_10_lose',
    lines: [
      { speaker: '铁匠', text: '挨打越多，出拳越重。' },
      { speaker: '引路人', text: 'HP低时攻击牌伤害+2。有时候低血量反而是优势，别急着回血。' },
    ],
  },
  // ====== 第十一关 ======
  story_11_before: {
    id: 'story_11_before',
    lines: [
      { speaker: '引路人', text: '……这个人，是庄主的影子。他能预见未来。' },
      { speaker: '影', text: '你的命运，我已预见。' },
      { speaker: '主角', text: '我命由我不由你。', isPlayer: true },
      { speaker: '影', text: '……有趣。那就让我看看，你能走多远。' },
    ],
  },
  story_11_win: {
    id: 'story_11_win',
    lines: [
      { speaker: '影', text: '不可能……我的预言从未失败！' },
      { speaker: '主角', text: '未来不是你说了算的。', isPlayer: true },
      { speaker: '引路人', text: '影是庄主的人。你伤了他，最终局不会轻松。' },
      { speaker: '引路人', text: '情报——他会预判你的出牌。学会反直觉，该出攻击时偏偏出防御。' },
    ],
  },
  story_11_lose: {
    id: 'story_11_lose',
    lines: [
      { speaker: '影', text: '命运不可违抗。' },
      { speaker: '引路人', text: '他会预言你的出牌。反直觉出牌——明知道该出攻击，偏偏出防御。' },
    ],
  },
  // ====== 第十二关：终局 ======
  story_12_before: {
    id: 'story_12_before',
    lines: [
      { speaker: '引路人', text: '这就是最后了。赢了，你自由。输了……' },
      { speaker: '庄主', text: '欢迎来到最终局。' },
      { speaker: '庄主', text: '你想知道真相吗？' },
      { speaker: '主角', text: '我来这里不是为了真相。我为了自由。', isPlayer: true },
      { speaker: '庄主', text: '……那就证明给我看。' },
    ],
  },
  story_12_win: {
    id: 'story_12_win',
    lines: [
      { speaker: '庄主', text: '……你是第一个走到这里还赢了的人。' },
      { speaker: '庄主', text: '牌局会的门，从此为你敞开。' },
      { speaker: '主角', text: '这一切……到底是为了什么？', isPlayer: true },
      { speaker: '庄主', text: '也许有一天你会明白。' },
      { speaker: '庄主', text: '也许……你永远不会。' },
      { speaker: '旁白', text: '你走出了牌局会的大门。身后，灯光一盏一盏熄灭。' },
      { speaker: '旁白', text: '但你知道——这个故事还没有结束。' },
    ],
  },
};

export function getStoryById(id: string): StoryLine | undefined {
  return STORIES[id];
}
