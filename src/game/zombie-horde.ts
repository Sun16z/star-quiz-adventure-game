import { Scene, TransformNode, SceneLoader, AnimationGroup } from '@babylonjs/core';
import '@babylonjs/loaders';
import { CONFIG } from './config';
import { SpatialGrid } from './spatial-grid';
import { Obstacle, resolveObstacles } from './obstacles';

interface ZombieType {
  path: string;
  hp: number;
  speed: number;
  /** 相對基準身高的縮放 */
  scale: number;
}

const ZOMBIE_TYPES: ZombieType[] = [
  { path: '/models/zombie/zombie_basic.gltf', hp: 3, speed: 5.5, scale: 1 },
  { path: '/models/zombie/zombie_ribcage.gltf', hp: 2, speed: 8, scale: 0.95 }, // 快速
  { path: '/models/zombie/zombie_chubby.gltf', hp: 12, speed: 3.2, scale: 1.35 }, // 坦克
  { path: '/models/zombie/zombie_arm.gltf', hp: 4, speed: 5, scale: 1 },
];

const BASE_HEIGHT = 2.4;
/** 每種類型預先 instantiate 的數量（總和為怪海上限） */
const PER_TYPE = 13;

interface Entry {
  root: TransformNode;
  anim?: AnimationGroup;
  baseSpeed: number;
}

/**
 * 殭屍怪群：預先 instantiate 一池「有骨架動畫」的殭屍，導演以 setCount 啟用前 N 隻。
 * 介面對齊原 EnemySystem（count/getX/getZ/isAlive/damage/update/insertAll/reset）。
 */
export class ZombieHorde {
  count = 0;
  hpMul = 1;
  speedMul = 1;
  tier = 0;

  private scene: Scene;
  private ready = false;
  private pool: Entry[] = [];
  private posX: Float32Array;
  private posZ: Float32Array;
  private hp: Float32Array;
  private capacity = ZOMBIE_TYPES.length * PER_TYPE;

  constructor(scene: Scene) {
    this.scene = scene;
    this.posX = new Float32Array(this.capacity);
    this.posZ = new Float32Array(this.capacity);
    this.hp = new Float32Array(this.capacity);
    void this.init();
  }

  private async init() {
    const containers = await Promise.all(
      ZOMBIE_TYPES.map((t) => {
        const slash = t.path.lastIndexOf('/');
        return SceneLoader.LoadAssetContainerAsync(t.path.slice(0, slash + 1), t.path.slice(slash + 1), this.scene);
      }),
    );

    /** 交錯各類型，啟用前 N 隻時自然會有多樣性 */
    for (let k = 0; k < PER_TYPE; k++) {
      for (let ti = 0; ti < ZOMBIE_TYPES.length; ti++) {
        const t = ZOMBIE_TYPES[ti];
        const inst = containers[ti].instantiateModelsToScene(undefined, false);
        const modelRoot = inst.rootNodes[0] as TransformNode;
        this.normalize(modelRoot, BASE_HEIGHT * t.scale);

        /** 以自有 holder 包住 glTF 根（其帶有 rotationQuaternion，直接設 rotation.y 無效）
         *  之後旋轉 holder 來轉向 */
        const holder = new TransformNode('zombie', this.scene);
        modelRoot.parent = holder;
        holder.setEnabled(false);

        inst.animationGroups.forEach((a) => a.stop());
        const anim =
          inst.animationGroups.find((a) => /walk|run|move/i.test(a.name)) ??
          inst.animationGroups.find((a) => /idle/i.test(a.name)) ??
          inst.animationGroups[0];

        this.pool.push({ root: holder, anim, baseSpeed: t.speed });
      }
    }

    this.ready = true;
  }

  private normalize(root: TransformNode, targetHeight: number) {
    const { min, max } = root.getHierarchyBoundingVectors();
    const h = max.y - min.y || 1;
    const scale = targetHeight / h;
    root.scaling.x *= scale;
    root.scaling.y *= scale;
    root.scaling.z *= scale;
    root.position.y = -min.y * scale;
  }

  private spawn(i: number, playerX: number, playerZ: number) {
    const entry = this.pool[i];
    const angle = Math.random() * Math.PI * 2;
    const dist =
      CONFIG.enemy.spawnRingMin + Math.random() * (CONFIG.enemy.spawnRingMax - CONFIG.enemy.spawnRingMin);
    this.posX[i] = playerX + Math.cos(angle) * dist;
    this.posZ[i] = playerZ + Math.sin(angle) * dist;
    /** 依 index 對應的類型血量（pool 交錯排列） */
    this.hp[i] = ZOMBIE_TYPES[i % ZOMBIE_TYPES.length].hp * this.hpMul;
    entry.root.position.x = this.posX[i];
    entry.root.position.z = this.posZ[i];
    entry.root.setEnabled(true);
    entry.anim?.start(true, 0.8 + Math.random() * 0.4);
  }

  setCount(next: number, playerX: number, playerZ: number) {
    if (!this.ready) return;
    const clamped = Math.max(0, Math.min(this.capacity, Math.floor(next)));
    for (let i = this.count; i < clamped; i++) this.spawn(i, playerX, playerZ);
    for (let i = clamped; i < this.count; i++) {
      this.pool[i].root.setEnabled(false);
      this.pool[i].anim?.stop();
    }
    this.count = clamped;
  }

  reset(_playerX: number, _playerZ: number) {
    this.hpMul = 1;
    this.speedMul = 1;
    this.tier = 0;
    if (!this.ready) {
      this.count = 0;
      return;
    }
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].root.setEnabled(false);
      this.pool[i].anim?.stop();
    }
    this.count = 0;
  }

  insertAll(grid: SpatialGrid) {
    for (let i = 0; i < this.count; i++) grid.insert(i, this.posX[i], this.posZ[i]);
  }

  getX(i: number) {
    return this.posX[i];
  }
  getZ(i: number) {
    return this.posZ[i];
  }
  isAlive(i: number) {
    return i < this.count;
  }

  damage(i: number, amount: number, playerX: number, playerZ: number): boolean {
    if (i >= this.count) return false;
    this.hp[i] -= amount;
    if (this.hp[i] <= 0) {
      this.spawn(i, playerX, playerZ);
      return true;
    }
    return false;
  }

  update(dt: number, playerX: number, playerZ: number, grid: SpatialGrid, obstacles: Obstacle[]) {
    if (!this.ready) return;
    const { separationRadius, separationForce, radius } = CONFIG.enemy;
    const sepR2 = separationRadius * separationRadius;
    const half = CONFIG.arenaHalf;
    const scratch = { x: 0, z: 0 };

    for (let i = 0; i < this.count; i++) {
      const x = this.posX[i];
      const z = this.posZ[i];

      let dirX = playerX - x;
      let dirZ = playerZ - z;
      const dlen = Math.hypot(dirX, dirZ) || 1;
      dirX /= dlen;
      dirZ /= dlen;

      let sepX = 0;
      let sepZ = 0;
      grid.query(x, z, (j) => {
        if (j === i) return;
        const ox = x - this.posX[j];
        const oz = z - this.posZ[j];
        const d2 = ox * ox + oz * oz;
        if (d2 > 0 && d2 < sepR2) {
          const d = Math.sqrt(d2);
          const w = (separationRadius - d) / separationRadius;
          sepX += (ox / d) * w;
          sepZ += (oz / d) * w;
        }
      });

      const spd = this.pool[i].baseSpeed * this.speedMul;
      let nx = x + (dirX * spd + sepX * separationForce) * dt;
      let nz = z + (dirZ * spd + sepZ * separationForce) * dt;
      if (nx > half) nx = half;
      else if (nx < -half) nx = -half;
      if (nz > half) nz = half;
      else if (nz < -half) nz = -half;

      /** 障礙物阻擋 */
      if (obstacles.length > 0) {
        resolveObstacles(obstacles, nx, nz, radius, scratch);
        nx = scratch.x;
        nz = scratch.z;
      }

      this.posX[i] = nx;
      this.posZ[i] = nz;

      const root = this.pool[i].root;
      root.position.x = nx;
      root.position.z = nz;
      /** 面向玩家（模型前方 +Z） */
      root.rotation.y = Math.atan2(dirX, dirZ);
    }
  }
}
