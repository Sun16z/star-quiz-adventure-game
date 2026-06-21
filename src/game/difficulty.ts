/** 難度設定：以倍率調整小怪/王強度與獎勵。守城版預設偏輕鬆，讓答題節奏有喘息。 */
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
  { id: 'easy', name: '簡單', emoji: '😀', color: '#7ec850', desc: '輕鬆守堡，適合小朋友熟悉操作', enemyHp: 0.72, enemySpeed: 0.85, enemyContact: 0.6, bossHp: 0.7, growth: 0.65, goldReward: 0.45 },
  { id: 'normal', name: '普通', emoji: '🙂', color: '#c6ff7a', desc: '標準守城節奏，有壓力但不會太急', enemyHp: 0.95, enemySpeed: 0.95, enemyContact: 0.85, bossHp: 0.9, growth: 0.85, goldReward: 0.75 },
  { id: 'hard', name: '困難', emoji: '😬', color: '#ffd23f', desc: '需要開始搭配寶物組合', enemyHp: 1.35, enemySpeed: 1.05, enemyContact: 1.15, bossHp: 1.25, growth: 1.1, goldReward: 1.15 },
  { id: 'nightmare', name: '夢境風暴', emoji: '😱', color: '#ff8a3d', desc: '高壓快節奏，適合熟練玩家', enemyHp: 2, enemySpeed: 1.18, enemyContact: 1.45, bossHp: 1.9, growth: 1.35, goldReward: 1.65 },
  { id: 'hell', name: '星光試煉', emoji: '🌟', color: '#ff5a9d', desc: '最強挑戰，給已經熟悉守堡的玩家', enemyHp: 3, enemySpeed: 1.3, enemyContact: 1.9, bossHp: 3, growth: 1.7, goldReward: 2.4 },
];

export function getDifficulty(id: string): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0];
}
