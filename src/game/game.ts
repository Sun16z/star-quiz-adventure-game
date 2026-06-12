import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Vector3,
  TransformNode,
  Mesh,
} from '@babylonjs/core';
import { loadModel } from './model-loader';
import { CONFIG } from './config';
import { Input } from './input';
import { SpatialGrid } from './spatial-grid';
import { ZombieHorde } from './zombie-horde';
import { WeaponSystem } from './weapon-system';
import { GemSystem } from './gem-system';
import { Boss } from './boss';
import { createRunState, rollChoices, xpForLevel, type RunState, type Upgrade } from './upgrades';
import { levelUpBurst, bossDeathBurst, hurtBurst, spawnText } from './effects';
import { sound } from './sound';

export type GameState = 'running' | 'levelup' | 'dead' | 'paused';

export interface ChoiceView {
  id: string;
  name: string;
  desc: string;
  emoji: string;
}

export interface GameStats {
  fps: number;
  enemies: number;
  kills: number;
  time: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  state: GameState;
  choices: ChoiceView[];
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  goldEarned: number;
}

export interface RunResult {
  gold: number;
  kills: number;
  time: number;
  level: number;
}

export interface GameOptions {
  onStats?: (stats: GameStats) => void;
  onGameOver?: (result: RunResult) => void;
  /** 角色與永久升級算出的起始數值（範本，每輪複製使用） */
  startRunState?: RunState;
  /** 角色身體顏色（fallback 造型用） */
  characterColor?: [number, number, number];
  /** 角色 GLB 模型路徑 */
  characterModel?: string;
  /** 金幣加成倍率（貪婪） */
  goldMultiplier?: number;
}

export interface GameHandle {
  dispose: () => void;
  setJoystick: (x: number, z: number) => void;
  chooseUpgrade: (index: number) => void;
  restart: () => void;
  togglePause: () => void;
  jump: () => void;
  setXpDebug: (on: boolean) => void;
}

export function createGame(canvas: HTMLCanvasElement, options: GameOptions = {}): GameHandle {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
  sound.enable();

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.05, 0.07, 0.13, 1);
  /** 線性霧增加遠處深度感 */
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogColor = new Color3(0.05, 0.07, 0.13);
  scene.fogStart = 55;
  scene.fogEnd = 110;

  const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3.2, 50, Vector3.Zero(), scene);
  const light = new HemisphericLight('light', new Vector3(0.4, 1, 0.3), scene);
  light.intensity = 0.85;
  light.groundColor = new Color3(0.25, 0.28, 0.4);
  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), scene);
  sun.intensity = 0.6;

  createGround(scene);
  void scatterProps(scene);

  /** 玩家根節點（移動此節點，視覺為其子物件：GLB 或 fallback 膠囊） */
  const player = new TransformNode('player', scene);
  player.position.set(0, 0, 0);

  const fallbackBody = MeshBuilder.CreateCapsule(
    'player-body',
    { radius: CONFIG.player.radius, height: CONFIG.player.radius * 2.4 },
    scene,
  );
  fallbackBody.parent = player;
  fallbackBody.position.y = CONFIG.player.radius * 1.2;
  const playerMaterial = new StandardMaterial('player-material', scene);
  const pc = options.characterColor ?? [1, 0.95, 0.4];
  playerMaterial.diffuseColor = new Color3(pc[0], pc[1], pc[2]);
  playerMaterial.emissiveColor = new Color3(pc[0] * 0.3, pc[1] * 0.3, pc[2] * 0.3);
  playerMaterial.specularColor = Color3.Black();
  fallbackBody.material = playerMaterial;

  /** 非同步載入角色模型，成功即取代 fallback（不阻塞遊戲開始） */
  if (options.characterModel) {
    void loadModel(scene, options.characterModel, 2.4).then((node) => {
      if (node) {
        node.parent = player;
        fallbackBody.setEnabled(false);
      }
    });
  }

  const goldMul = options.goldMultiplier ?? 1;
  const runTemplate: RunState = options.startRunState ?? createRunState();

  const input = new Input();
  input.attach();

  const grid = new SpatialGrid(CONFIG.gridCellSize);
  const enemies = new ZombieHorde(scene);
  const weapon = new WeaponSystem(scene);
  const gems = new GemSystem(scene);
  const boss = new Boss(scene);
  let bossTimer = 0;
  let bossCount = 0;

  /** 一輪狀態 */
  let run: RunState = { ...runTemplate };
  let levels: Record<string, number> = {};
  let level = 1;
  let xp = 0;
  let xpToNext = xpForLevel(level);
  let hp = run.maxHp;
  let kills = 0;
  let time = 0;
  let goldEarned = 0;
  let hurtTimer = 0;
  let state: GameState = 'running';
  let choices: Upgrade[] = [];

  /** 跳躍狀態 */
  let vy = 0;
  let grounded = true;
  let jumpRequested = false;

  /** debug：經驗 ×10 */
  let xpDebug = false;
  function requestJump() {
    if (state === 'running') jumpRequested = true;
  }

  const contactRange = CONFIG.player.radius + CONFIG.enemy.radius + 0.2;
  const contactRange2 = contactRange * contactRange;

  /** ===== 增益（寶箱）與道具 ===== */
  type BuffType = 'rapid' | 'power' | 'speed' | 'magnet' | 'multishot';
  const BUFFS: { type: BuffType; name: string; color: string }[] = [
    { type: 'rapid', name: '急速射擊', color: '#fbbf24' },
    { type: 'power', name: '威力提升', color: '#f87171' },
    { type: 'speed', name: '加速', color: '#34d399' },
    { type: 'magnet', name: '磁吸', color: '#22d3ee' },
    { type: 'multishot', name: '多重彈', color: '#a78bfa' },
  ];
  /** until 以遊戲秒數計 */
  const activeBuffs: { type: BuffType; until: number }[] = [];

  function applyBuff(eff: RunState, type: BuffType) {
    if (type === 'rapid') eff.fireInterval *= 0.5;
    else if (type === 'power') eff.damage *= 2;
    else if (type === 'speed') eff.moveSpeed *= 1.5;
    else if (type === 'magnet') eff.pickupRadius *= 3;
    else if (type === 'multishot') eff.projectileCount += 2;
  }

  /** 取得套用增益後的有效數值 */
  function effectiveRun(): RunState {
    const eff: RunState = { ...run };
    for (const b of activeBuffs) applyBuff(eff, b.type);
    return eff;
  }

  interface WorldItem {
    mesh: Mesh;
    kind: 'chest' | 'heal';
    bornAt: number;
    baseY: number;
    healPct: number;
  }
  const itemList: WorldItem[] = [];
  let chestTimer = 0;
  let healTimer = 0;

  function spawnItem(kind: 'chest' | 'heal') {
    const range = CONFIG.arenaHalf - 4;
    const x = (Math.random() * 2 - 1) * range;
    const z = (Math.random() * 2 - 1) * range;
    const mesh = kind === 'chest' ? createChestMesh(scene) : createHealMesh(scene);
    const baseY = kind === 'chest' ? 0.6 : 0.9;
    mesh.position.set(x, baseY, z);
    const healPct =
      kind === 'heal'
        ? CONFIG.items.healPercents[Math.floor(Math.random() * CONFIG.items.healPercents.length)]
        : 0;
    itemList.push({ mesh, kind, bornAt: time, baseY, healPct });
  }

  function triggerItem(item: WorldItem) {
    const pos = item.mesh.position;
    if (item.kind === 'chest') {
      const def = BUFFS[Math.floor(Math.random() * BUFFS.length)];
      const existing = activeBuffs.find((b) => b.type === def.type);
      if (existing) existing.until = time + CONFIG.items.buffDuration / 1000;
      else activeBuffs.push({ type: def.type, until: time + CONFIG.items.buffDuration / 1000 });
      spawnText(scene, pos, def.name, def.color);
      sound.buff();
    } else {
      const amount = run.maxHp * item.healPct;
      hp = Math.min(run.maxHp, hp + amount);
      spawnText(scene, pos, `+${Math.round(item.healPct * 100)}% HP`, '#34d399');
      sound.heal();
    }
  }

  function updateItems(dt: number, px: number, pz: number) {
    const r = CONFIG.items.pickupRadius;
    const r2 = r * r;
    for (let i = itemList.length - 1; i >= 0; i--) {
      const item = itemList[i];
      item.mesh.rotation.y += dt * 1.6;
      item.mesh.position.y = item.baseY + Math.sin(time * 3 + i) * 0.18;

      if (time - item.bornAt > CONFIG.items.lifetimeSec) {
        item.mesh.dispose();
        itemList.splice(i, 1);
        continue;
      }
      const dx = item.mesh.position.x - px;
      const dz = item.mesh.position.z - pz;
      if (dx * dx + dz * dz <= r2) {
        triggerItem(item);
        item.mesh.dispose();
        itemList.splice(i, 1);
      }
    }
  }

  const stats: GameStats = {
    fps: 0,
    enemies: enemies.count,
    kills: 0,
    time: 0,
    hp,
    maxHp: run.maxHp,
    level,
    xp: 0,
    xpToNext,
    state,
    choices: [],
    bossActive: false,
    bossHp: 0,
    bossMaxHp: 0,
    goldEarned: 0,
  };

  function pushStats() {
    stats.fps = Math.round(engine.getFps());
    stats.enemies = enemies.count;
    stats.kills = kills;
    stats.time = time;
    stats.hp = Math.max(0, Math.ceil(hp));
    stats.maxHp = run.maxHp;
    stats.level = level;
    stats.xp = Math.floor(xp);
    stats.xpToNext = xpToNext;
    stats.state = state;
    stats.choices = choices.map((c) => ({ id: c.id, name: c.name, desc: c.desc, emoji: c.emoji }));
    stats.bossActive = boss.active;
    stats.bossHp = Math.max(0, Math.ceil(boss.hp));
    stats.bossMaxHp = boss.maxHp;
    stats.goldEarned = goldEarned;
    options.onStats?.(stats);
  }

  const clampArena = (v: number) => Math.max(-CONFIG.arenaHalf, Math.min(CONFIG.arenaHalf, v));

  function togglePause() {
    if (state === 'running') state = 'paused';
    else if (state === 'paused') state = 'running';
    else return;
    pushStats();
  }

  function enterLevelUp() {
    const rolled = rollChoices(levels);
    if (rolled.length === 0) return; // 全滿級，略過暫停
    choices = rolled;
    state = 'levelup';
    levelUpBurst(scene, new Vector3(player.position.x, 1, player.position.z));
    sound.levelUp();
    pushStats();
  }

  function gameplay(dt: number) {
    const dir = input.getDirection();
    /** 清除過期增益，計算套用增益後的有效數值 */
    for (let i = activeBuffs.length - 1; i >= 0; i--) {
      if (time >= activeBuffs[i].until) activeBuffs.splice(i, 1);
    }
    const eff = effectiveRun();

    player.position.x = clampArena(player.position.x + dir.x * eff.moveSpeed * dt);
    player.position.z = clampArena(player.position.z + dir.z * eff.moveSpeed * dt);

    /** 面向移動方向（模型前方為 +Z），平滑轉向 */
    if (dir.x !== 0 || dir.z !== 0) {
      const targetAngle = Math.atan2(dir.x, dir.z);
      player.rotation.y = lerpAngle(player.rotation.y, targetAngle, 0.25);
    }

    /** 跳躍：拋物線高度 */
    if (jumpRequested && grounded) {
      vy = CONFIG.player.jump.strength;
      grounded = false;
    }
    jumpRequested = false;
    if (!grounded) {
      vy -= CONFIG.player.jump.gravity * dt;
      player.position.y += vy * dt;
      if (player.position.y <= 0) {
        player.position.y = 0;
        vy = 0;
        grounded = true;
      }
    }
    const airborne = player.position.y > CONFIG.player.jump.dodgeHeight;

    const px = player.position.x;
    const pz = player.position.z;
    camera.target.set(px, 1.2, pz);

    /** 生成導演：隨時間升壓 */
    enemies.hpMul = 1 + time * CONFIG.director.hpGrowthPerSec;
    enemies.speedMul = 1 + time * CONFIG.director.speedGrowthPerSec;
    enemies.tier = Math.min(1, time / 120);
    const target = Math.min(
      CONFIG.director.maxCount,
      CONFIG.director.baseCount + Math.floor(time / CONFIG.director.stepIntervalSec) * CONFIG.director.addPerStep,
    );
    enemies.setCount(target, px, pz);

    grid.clear();
    enemies.insertAll(grid);
    enemies.update(dt, px, pz, grid);

    /** 王：定時出現 */
    bossTimer += dt;
    if (!boss.active && bossTimer >= CONFIG.boss.intervalSec) {
      bossTimer = 0;
      bossCount += 1;
      boss.spawn(px, pz, CONFIG.boss.hpBase + CONFIG.boss.hpPerSpawn * (bossCount - 1));
    }

    kills += weapon.update(dt, px, pz, enemies, boss, grid, eff, (x, z) => {
      gems.spawn(x, z);
      sound.hit();
    });

    /** 王被擊敗：噴出大量經驗 + 爆炸特效 */
    if (boss.justDied) {
      boss.justDied = false;
      kills += 1;
      bossDeathBurst(scene, new Vector3(boss.x, 1.5, boss.z));
      sound.bossDown();
      for (let n = 0; n < CONFIG.boss.xpGems; n++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 3;
        gems.spawn(boss.x + Math.cos(a) * d, boss.z + Math.sin(a) * d);
      }
    }

    boss.update(dt, px, pz);

    /** 道具：每 15 秒生成寶箱與回血，並更新拾取 */
    chestTimer += dt;
    if (chestTimer >= CONFIG.items.chestInterval / 1000) {
      chestTimer = 0;
      spawnItem('chest');
    }
    healTimer += dt;
    if (healTimer >= CONFIG.items.healInterval / 1000) {
      healTimer = 0;
      spawnItem('heal');
    }
    updateItems(dt, px, pz);

    const collected = gems.update(dt, px, pz, eff.pickupRadius);
    if (collected > 0) {
      xp += collected * eff.xpMultiplier * (xpDebug ? 10 : 1);
      if (xp >= xpToNext) {
        xp -= xpToNext;
        level += 1;
        xpToNext = xpForLevel(level);
        enterLevelUp();
      }
    }

    /** 接觸傷害（小怪 + 王） */
    let touching = false;
    grid.query(px, pz, (j) => {
      if (touching || !enemies.isAlive(j)) return;
      const dx = enemies.getX(j) - px;
      const dz = enemies.getZ(j) - pz;
      if (dx * dx + dz * dz <= contactRange2) touching = true;
    });
    const contactDps = CONFIG.player.contactDps * (1 + time * CONFIG.director.contactGrowthPerSec);
    const bossTouch = boss.contactsPlayer(px, pz, CONFIG.player.radius);
    /** 騰空時可躲開接觸傷害 */
    const hurt = (touching || bossTouch) && !airborne;
    if (touching && !airborne) hp -= contactDps * dt;
    if (bossTouch && !airborne) hp -= CONFIG.boss.contactDps * dt;

    /** 受擊回饋：間歇火花 */
    hurtTimer -= dt;
    if (hurt && hurtTimer <= 0) {
      hurtTimer = 0.35;
      hurtBurst(scene, new Vector3(px, 1, pz));
      sound.hurt();
    }

    if (hp <= 0) {
      hp = 0;
      goldEarned = Math.floor((kills * 0.6 + time) * goldMul);
      state = 'dead';
      sound.playerDeath();
      pushStats();
      options.onGameOver?.({ gold: goldEarned, kills, time, level });
    }

    time += dt;
  }

  let throttle = 0;
  engine.runRenderLoop(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
    if (state === 'running') gameplay(dt);
    scene.render();

    throttle += dt;
    if (throttle >= 0.1) {
      throttle = 0;
      pushStats();
    }
  });

  const onResize = () => engine.resize();
  window.addEventListener('resize', onResize);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') togglePause();
    else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      requestJump();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  pushStats();

  return {
    dispose() {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      input.detach();
      engine.dispose();
    },
    setJoystick(x: number, z: number) {
      input.setJoystick(x, z);
    },
    chooseUpgrade(index: number) {
      if (state !== 'levelup') return;
      const upgrade = choices[index];
      if (!upgrade) return;
      upgrade.apply(run);
      levels[upgrade.id] = (levels[upgrade.id] ?? 0) + 1;
      if (upgrade.id === 'maxhp') hp = run.maxHp;
      else hp = Math.min(hp, run.maxHp);
      choices = [];
      state = 'running';
      pushStats();
    },
    restart() {
      run = { ...runTemplate };
      levels = {};
      level = 1;
      xp = 0;
      xpToNext = xpForLevel(level);
      hp = run.maxHp;
      kills = 0;
      time = 0;
      goldEarned = 0;
      hurtTimer = 0;
      choices = [];
      state = 'running';
      vy = 0;
      grounded = true;
      jumpRequested = false;
      player.position.set(0, 0, 0);
      enemies.reset(0, 0);
      gems.reset();
      weapon.reset();
      boss.reset();
      bossTimer = 0;
      bossCount = 0;
      activeBuffs.length = 0;
      for (const it of itemList) it.mesh.dispose();
      itemList.length = 0;
      chestTimer = 0;
      healTimer = 0;
      pushStats();
    },
    togglePause() {
      togglePause();
    },
    jump() {
      requestJump();
    },
    setXpDebug(on: boolean) {
      xpDebug = on;
    },
  };
}

/** 角度插值（處理 ±π 環繞），用於平滑轉向 */
function lerpAngle(current: number, target: number, t: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

/** 寶箱：金色發光箱 */
function createChestMesh(scene: Scene): Mesh {
  const box = MeshBuilder.CreateBox('chest', { width: 1.2, height: 0.9, depth: 0.9 }, scene);
  const m = new StandardMaterial('chest-mat', scene);
  m.diffuseColor = new Color3(0.9, 0.7, 0.2);
  m.emissiveColor = new Color3(0.5, 0.35, 0.05);
  m.specularColor = Color3.Black();
  box.material = m;
  box.isPickable = false;
  return box;
}

/** 回血：綠色十字（醫療包） */
function createHealMesh(scene: Scene): Mesh {
  const mat = new StandardMaterial('heal-mat', scene);
  mat.diffuseColor = new Color3(0.2, 0.85, 0.4);
  mat.emissiveColor = new Color3(0.15, 0.7, 0.3);
  mat.specularColor = Color3.Black();
  const v = MeshBuilder.CreateBox('heal', { width: 0.36, height: 1, depth: 0.36 }, scene);
  v.material = mat;
  v.isPickable = false;
  const h = MeshBuilder.CreateBox('heal-cross', { width: 1, height: 0.36, depth: 0.36 }, scene);
  h.parent = v;
  h.material = mat;
  h.isPickable = false;
  return v;
}

function createGround(scene: Scene) {
  const size = CONFIG.arenaHalf * 2.4;
  const ground = MeshBuilder.CreateGround('ground', { width: size, height: size }, scene);
  const material = new StandardMaterial('ground-material', scene);
  material.diffuseColor = new Color3(0.16, 0.22, 0.32);
  material.specularColor = Color3.Black();
  ground.material = material;
  return ground;
}

/** 散布殭屍城鎮道具（油桶、貨櫃、三角錐、水塔），提供移動參考與氛圍 */
async function scatterProps(scene: Scene) {
  const half = CONFIG.arenaHalf;
  const props = [
    { path: '/models/zombie/barrel.gltf', height: 1.4, count: 12 },
    { path: '/models/zombie/container.gltf', height: 3, count: 5 },
    { path: '/models/zombie/cone.gltf', height: 0.9, count: 12 },
    { path: '/models/zombie/watertower.gltf', height: 8, count: 2 },
  ];

  for (const p of props) {
    const base = await loadModel(scene, p.path, p.height);
    if (!base) continue;
    const place = (node: { position: { x: number; z: number }; rotation: { y: number } }) => {
      node.position.x = (Math.random() * 2 - 1) * half;
      node.position.z = (Math.random() * 2 - 1) * half;
      node.rotation.y = Math.random() * Math.PI * 2;
    };
    place(base);
    for (let i = 1; i < p.count; i++) {
      const clone = base.clone(`${p.path}-${i}`, null);
      if (clone) place(clone);
    }
  }
}
