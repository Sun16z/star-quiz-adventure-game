import type { RunState } from './upgrades';

export interface Character {
  id: string;
  name: string;
  emoji: string;
  /** 解鎖所需金幣，0 為預設已解鎖 */
  cost: number;
  /** 一句話特性 */
  trait: string;
  /** 身體顏色（程序化造型 fallback 用） */
  bodyColor: [number, number, number];
  /** GLB 模型路徑（無則用程序化造型） */
  model?: string;
  /** 套用至起始 RunState 的角色差異 */
  apply: (s: RunState) => void;
}

export const CHARACTERS: Character[] = [
  {
    id: 'matt',
    name: '麥特',
    emoji: '🔫',
    cost: 0,
    trait: '均衡，無明顯弱點',
    bodyColor: [0.3, 0.45, 0.6],
    model: '/models/zombie/survivor_matt.gltf',
    apply: () => {},
  },
  {
    id: 'lis',
    name: '莉絲',
    emoji: '👟',
    cost: 300,
    trait: '高速但脆皮',
    bodyColor: [0.8, 0.4, 0.5],
    model: '/models/zombie/survivor_lis.gltf',
    apply: (s) => {
      s.moveSpeed *= 1.2;
      s.maxHp -= 25;
    },
  },
  {
    id: 'sam',
    name: '山姆',
    emoji: '⚡',
    cost: 300,
    trait: '高攻速、輸出爆發',
    bodyColor: [0.85, 0.7, 0.3],
    model: '/models/zombie/survivor_sam.gltf',
    apply: (s) => {
      s.fireInterval *= 0.78;
      s.maxHp -= 15;
    },
  },
  {
    id: 'shaun',
    name: '尚恩',
    emoji: '🧲',
    cost: 200,
    trait: '拾取範圍大、經驗多',
    bodyColor: [0.5, 0.6, 0.45],
    model: '/models/zombie/survivor_shaun.gltf',
    apply: (s) => {
      s.pickupRadius *= 1.7;
      s.xpMultiplier *= 1.2;
    },
  },
];

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
