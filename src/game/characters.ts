import type { RunState } from './upgrades';
import type { PrincessStyle } from './princess-model';

export interface Character {
  id: string;
  name: string;
  emoji: string;
  /** 解鎖所需金幣，0 為預設已解鎖 */
  cost: number;
  /** 一句話特性（標籤） */
  trait: string;
  /** 詳細介紹（數值與起始攻擊機制） */
  desc: string;
  /** 身體顏色（程序化造型 fallback 用） */
  bodyColor: [number, number, number];
  /** 公主造型 */
  princessStyle: PrincessStyle;
  /** GLB 模型路徑（無則用程序化造型） */
  model?: string;
  /** 套用至起始 RunState 的角色差異 */
  apply: (s: RunState) => void;
}

export const CHARACTERS: Character[] = [
  {
    id: 'matt',
    name: '星願公主',
    emoji: '🌟',
    cost: 0,
    trait: '星光守護｜起始攻擊：星星魔法',
    desc: '原創星空公主風格。射程更遠、拾取範圍更大，開局會放出連鎖星光，適合喜歡優雅走位的玩家。',
    bodyColor: [0.62, 0.78, 1],
    princessStyle: 'star',
    apply: (s) => {
      s.range *= 1.15;
      s.pickupRadius *= 1.25;
      s.lightningCount = 1;
      s.damage += 1;
    },
  },
  {
    id: 'lis',
    name: '桃心公主',
    emoji: '👑',
    cost: 0,
    trait: '粉桃勇氣｜起始攻擊：愛心散射',
    desc: '原創粉桃公主風格。生命較高，開局三連發愛心魔法，還有小小守護光圈，適合直接上手。',
    bodyColor: [1, 0.58, 0.74],
    princessStyle: 'heart',
    apply: (s) => {
      s.maxHp += 25;
      s.projectileCount = 3;
      s.auraRadius = 3.5;
      s.fireInterval *= 0.92;
    },
  },
];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
