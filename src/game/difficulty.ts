/** 難度設定：以倍率調整小怪/王強度與獎勵。簡單＝現況（全 ×1）。 */
export interface Difficulty {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  color: string;
  /** 小怪血量倍率 */
  enemyHp: number;
  /** 小怪速度倍率 */
  enemySpeed: number;
  /** 接觸傷害倍率（小怪與王） */
  enemyContact: number;
  /** 王血量倍率 */
  bossHp: number;
  /** 隨時間升壓的加速倍率 */
  growth: number;
  /** 金幣獎勵倍率 */
  goldReward: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', name: '簡單', emoji: '😀', color: '#7ec850', desc: '標準體驗，適合新手熟悉操作', enemyHp: 1, enemySpeed: 1, enemyContact: 1, bossHp: 1, growth: 1, goldReward: 1 },
  { id: 'normal', name: '普通', emoji: '🙂', color: '#c6ff7a', desc: '小怪更有精神、節奏更快', enemyHp: 1.5, enemySpeed: 1.1, enemyContact: 1.3, bossHp: 1.5, growth: 1.2, goldReward: 1.5 },
  { id: 'hard', name: '困難', emoji: '😬', color: '#ffd23f', desc: '需要更好的寶物組合', enemyHp: 2.2, enemySpeed: 1.2, enemyContact: 1.6, bossHp: 2.2, growth: 1.5, goldReward: 2.2 },
  { id: 'nightmare', name: '夢境風暴', emoji: '😱', color: '#ff8a3d', desc: '高壓快節奏，適合挑戰', enemyHp: 3.5, enemySpeed: 1.35, enemyContact: 2, bossHp: 3.5, growth: 1.8, goldReward: 3.5 },
  { id: 'hell', name: '星光試煉', emoji: '🌟', color: '#ff5a9d', desc: '最強難度，給熟練玩家挑戰', enemyHp: 5, enemySpeed: 1.5, enemyContact: 2.6, bossHp: 5, growth: 2.2, goldReward: 5 },
];

export function getDifficulty(id: string): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0];
}
