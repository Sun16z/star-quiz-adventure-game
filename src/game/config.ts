/** 里程碑 1（效能原型）可調參數 */
export const CONFIG = {
  /** 場地半徑（玩家活動範圍與敵人邊界） */
  arenaHalf: 140,
  /** 地圖放大後同步增加貼花與場景物件，避免世界變空 */
  decorationDensityScale: 2,

  player: {
    speed: 16,
    radius: 0.9,
    maxHp: 100,
    /** 接觸敵人時每秒受到的傷害 */
    contactDps: 12,
    /** 跳躍：初速、重力、超過此高度視為騰空（可躲接觸傷害） */
    jump: { strength: 9, gravity: 26, dodgeHeight: 0.7 },
  },

  enemy: {
    /** 上限容量（thin instance 緩衝大小） */
    capacity: 3000,
    radius: 0.6,
    /** 視覺與站立高度 */
    y: 0.7,
    /** 彼此分離的半徑與力度 */
    separationRadius: 1.3,
    separationForce: 9,
    /** 從玩家周圍環狀生成的距離 */
    spawnRingMin: 50,
    spawnRingMax: 85,
  },

  /** 生成導演：小夥伴數量與強度隨時間升壓（全動畫模型，數量上限較低） */
  director: {
    baseCount: 10,
    addPerStep: 4,
    stepIntervalSec: 6,
    maxCount: 50,
    /** 每秒血量乘數成長（hpMul = 1 + elapsed * hpGrowthPerSec） */
    hpGrowthPerSec: 1 / 45,
    /** 每秒速度乘數成長 */
    speedGrowthPerSec: 1 / 220,
    /** 接觸傷害每秒成長 */
    contactGrowthPerSec: 1 / 80,
  },

  /** 王：定時出現的巨型敵人 */
  boss: {
    intervalSec: 30,
    hpBase: 350,
    hpPerSpawn: 280,
    speed: 6,
    radius: 3,
    contactDps: 32,
    /** 擊敗後噴出的經驗寶石數 */
    xpGems: 40,
  },

  weapon: {
    /** 自動發射間隔（秒） */
    fireInterval: 0.45,
    projectileSpeed: 34,
    projectileRadius: 0.6,
    damage: 1,
    /** 鎖定範圍 */
    range: 45,
    maxProjectiles: 300,
    lifetime: 1.4,
  },

  /** 地圖道具 */
  items: {
    /** 寶箱／回血各自的生成間隔（毫秒） */
    chestInterval: 15000,
    healInterval: 15000,
    /** 增益持續時間（毫秒） */
    buffDuration: 10000,
    /** 拾取距離 */
    pickupRadius: 2.4,
    /** 未拾取的存在時間（毫秒換算秒） */
    lifetimeSec: 20,
    /** 回血百分比（隨機其一） */
    healPercents: [0.15, 0.3, 0.5],
  },

  /** 空間網格 cell 大小（約等於敵人分離半徑量級） */
  gridCellSize: 3,
};

/** 敵人類型表 */
export interface EnemyType {
  hp: number;
  speed: number;
  scale: number;
  color: [number, number, number];
}
export const ENEMY_TYPES: Record<'basic' | 'fast' | 'tank', EnemyType> = {
  basic: { hp: 3, speed: 5.5, scale: 1, color: [0.98, 0.45, 0.3] },
  fast: { hp: 2, speed: 9, scale: 0.78, color: [1, 0.85, 0.2] },
  tank: { hp: 12, speed: 3.2, scale: 1.7, color: [0.55, 0.35, 0.9] },
};
