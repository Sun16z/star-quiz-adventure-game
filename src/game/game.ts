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
  GlowLayer,
} from '@babylonjs/core';
import { loadModel, loadCharacter } from './model-loader';
import type { AnimationGroup } from '@babylonjs/core';
import { createTerrain } from './terrain';
import { DIFFICULTIES, type Difficulty } from './difficulty';
import { getQuality, type QualityId } from './quality';
import { scatterGroundDecals, buildRoads } from './ground-decals';
import { CONFIG } from './config';
import { Input } from './input';
import { SpatialGrid } from './spatial-grid';
import { ZombieHorde } from './zombie-horde';
import { WeaponSystem } from './weapon-system';
import { ExtraWeapons } from './extra-weapons';
import { GemSystem } from './gem-system';
import { Boss, BOSS_COUNT, BOSS_INFO } from './boss';
import { BossHazards } from './boss-hazards';
import { BloodDecals } from './decals';
import { Obstacle, resolveObstacles } from './obstacles';
import { createRunState, rollChoices, xpForLevel, UPGRADES, type RunState, type Upgrade } from './upgrades';
import { levelUpBurst, bossDeathBurst, hurtBurst, enemyDeathBurst, spawnText, setGlowLayer } from './effects';
import { sound } from './sound';
import { createPrincessModel, type PrincessStyle } from './princess-model';

export type GameState = 'running' | 'levelup' | 'dead' | 'paused' | 'won';

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
  castleHp: number;
  castleMaxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  state: GameState;
  choices: ChoiceView[];
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  /** 王名稱與招式（顯示於王血條） */
  bossName: string;
  bossSkill: string;
  /** 已擊敗王數 / 王總數 */
  bossDefeated: number;
  bossTotal: number;
  goldEarned: number;
  superCannonUsed: boolean;
  /** 目前背景音樂索引（隨進度自動切換，供下拉同步顯示） */
  musicTrack: number;
}

export interface RunResult {
  gold: number;
  kills: number;
  time: number;
  level: number;
  /** 是否破關（擊敗最終王） */
  won: boolean;
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
  /** 公主程序化造型 */
  princessStyle?: PrincessStyle;
  /** 金幣加成倍率（貪婪） */
  goldMultiplier?: number;
  /** 難度設定 */
  difficulty?: Difficulty;
  /** 畫質（預設高；只影響渲染成本，不影響玩法） */
  quality?: QualityId;
}

export interface GameHandle {
  dispose: () => void;
  setJoystick: (x: number, z: number) => void;
  chooseUpgrade: (index: number) => void;
  restart: () => void;
  togglePause: () => void;
  jump: () => void;
  setXpDebug: (on: boolean) => void;
  setMuted: (on: boolean) => void;
  setMusicTrack: (i: number) => void;
  /** 切換畫質（解析度/發光/霧即時生效；抗鋸齒於下次開局生效） */
  setQuality: (id: QualityId) => void;
  getDebugParams: () => DebugParamView[];
  setDebugParam: (index: number, value: number) => void;
  getUpgradeStatus: () => UpgradeStatusView[];
  getBossNames: () => string[];
  summonBoss: (index: number) => void;
  triggerSuperCannon: () => boolean;
}

export interface UpgradeStatusView {
  name: string;
  emoji: string;
  level: number;
  maxLevel: number;
}

export interface DebugParamView {
  label: string;
  group: string;
  type: 'range' | 'bool';
  min: number;
  max: number;
  step: number;
  value: number;
}

export function createGame(canvas: HTMLCanvasElement, options: GameOptions = {}): GameHandle {
  const quality = getQuality(options.quality ?? 'high');
  const engine = new Engine(canvas, quality.antialias, { preserveDrawingBuffer: false, stencil: true });
  /** 解析度降階：值越大越省（中=1.5、低=2）；高=1 滿解析度 */
  engine.setHardwareScalingLevel(quality.hardwareScaling);
  sound.enable();
  /** 背景音樂依擊敗王數分段：0→星光散步, ≥2→糖果追逐, ≥4→月光鼓隊, ≥6→彩虹急行（索引對應 TRACKS） */
  const stageTrack = (defeated: number): number => (defeated >= 6 ? 2 : defeated >= 4 ? 3 : defeated >= 2 ? 1 : 0);
  let musicTrackIdx = 0;
  sound.setMusicTrack(musicTrackIdx);
  sound.startMusic();

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.05, 0.07, 0.13, 1);
  /** 輝光層：讓發光材質（子彈、衛星、閃電、火花等）泛光更顯眼 */
  const glow = new GlowLayer('glow', scene);
  glow.intensity = quality.glow;
  glow.isEnabled = quality.glow > 0;
  setGlowLayer(glow);
  /** 線性霧增加遠處深度感 */
  scene.fogMode = Scene.FOGMODE_LINEAR;
  scene.fogColor = new Color3(0.05, 0.07, 0.13);
  scene.fogStart = 55;
  scene.fogEnd = quality.fogEnd;

  const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3.2, 50, Vector3.Zero(), scene);
  /** 開放使用者調整：拖曳旋轉、滾輪／雙指縮放（仍自動跟隨玩家目標點） */
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 25; // 最近
  camera.upperRadiusLimit = 80; // 最遠
  camera.lowerBetaLimit = 0.35; // 最高俯角（避免看到天空）
  camera.upperBetaLimit = Math.PI / 2.2; // 最低俯角（避免穿到地底）
  camera.wheelPrecision = 3; // 滾輪縮放靈敏度
  camera.pinchPrecision = 60; // 手機雙指縮放靈敏度
  camera.panningSensibility = 0; // 停用平移（鎖定跟隨玩家）
  const defaultCamera = { alpha: -Math.PI / 2, beta: Math.PI / 3.2, radius: 50 };
  const light = new HemisphericLight('light', new Vector3(0.4, 1, 0.3), scene);
  light.intensity = 0.85;
  light.groundColor = new Color3(0.25, 0.28, 0.4);
  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), scene);
  sun.intensity = 0.6;

  const { heightAt } = createTerrain(scene);
  void buildRoads(scene, heightAt);
  scatterGroundDecals(scene, heightAt);
  /** 實心障礙物（隨道具非同步載入逐步填入） */
  const obstacles: Obstacle[] = [];
  void scatterProps(scene, obstacles, heightAt);

  /** 玩家根節點（移動此節點，視覺為其子物件：GLB 或程序化公主造型） */
  const player = new TransformNode('player', scene);
  player.position.set(9, 0, 0);

  const fallbackBody = createPrincessModel(scene, options.princessStyle ?? 'star');
  fallbackBody.parent = player;

  /** 角色 idle／walk 動畫群組（移動時切換成走路） */
  let playerWalk: AnimationGroup | undefined;
  let playerIdle: AnimationGroup | undefined;
  let playerMoving = false;

  /** 非同步載入角色模型，成功即取代 fallback（不阻塞遊戲開始） */
  if (options.characterModel) {
    void loadCharacter(scene, options.characterModel, 2.4).then((m) => {
      if (m) {
        m.root.parent = player;
        playerWalk = m.walk;
        playerIdle = m.idle;
        fallbackBody.setEnabled(false);
      }
    });
  }

  const goldMul = options.goldMultiplier ?? 1;
  const diff = options.difficulty ?? DIFFICULTIES[0];
  const runTemplate: RunState = options.startRunState ?? createRunState();

  const input = new Input();
  input.attach();

  const grid = new SpatialGrid(CONFIG.gridCellSize);
  const enemies = new ZombieHorde(scene);
  enemies.setHeightFn(heightAt);
  const weapon = new WeaponSystem(scene);
  const extras = new ExtraWeapons(scene);
  const gems = new GemSystem(scene);
  const boss = new Boss(scene);
  boss.setHeightFn(heightAt);
  boss.setHpScale(diff.bossHp);
  const hazards = new BossHazards(scene);
  enemies.setHazards(hazards);
  enemies.rangedDamage = 7 * diff.enemyContact;
  const bloodDecals = new BloodDecals(scene);

  /** 防守主堡：小怪會優先衝向這裡，血量歸零即失敗。 */
  const castle = createCastleModel(scene);
  castle.position.set(0, heightAt(0, 0), 0);
  let castlePulseTimer = 0;

  /** 減速光環視覺：藍色貼地圓盤 */
  const slowField = MeshBuilder.CreateDisc('slow-field', { radius: 1, tessellation: 48 }, scene);
  slowField.rotation.x = Math.PI / 2;
  slowField.isPickable = false;
  const slowMat = new StandardMaterial('slow-mat', scene);
  slowMat.diffuseColor = new Color3(0.4, 0.7, 1);
  slowMat.emissiveColor = new Color3(0.2, 0.5, 0.9);
  slowMat.specularColor = Color3.Black();
  slowMat.disableLighting = true;
  slowMat.alpha = 0.18;
  slowMat.backFaceCulling = false;
  slowField.material = slowMat;
  slowField.setEnabled(false);

  /** 護盾視覺：青色發光環 */
  const shieldRing = MeshBuilder.CreateTorus('shield-ring', { diameter: 2.4, thickness: 0.18, tessellation: 32 }, scene);
  const shieldMat = new StandardMaterial('shield-mat', scene);
  shieldMat.emissiveColor = new Color3(0.4, 0.9, 1);
  shieldMat.diffuseColor = new Color3(0, 0, 0);
  shieldMat.specularColor = Color3.Black();
  shieldMat.disableLighting = true;
  shieldRing.material = shieldMat;
  shieldRing.isPickable = false;
  shieldRing.setEnabled(false);

  /** 寶箱模型範本（非同步載入，spawn 時複製；未就緒則退回程序化方塊） */
  let chestTemplate: TransformNode | null = null;
  void loadModel(scene, '/models/zombie/item_chest.glb', 1.1).then((n) => {
    if (n) {
      n.setEnabled(false);
      /** 套上自發光材質，讓 GlowLayer 泛光（金色） */
      const chestMat = new StandardMaterial('chest-glow', scene);
      chestMat.diffuseColor = new Color3(1, 0.8, 0.3);
      chestMat.emissiveColor = new Color3(1, 0.7, 0.2);
      chestMat.specularColor = Color3.Black();
      chestMat.disableLighting = true;
      n.getChildMeshes(false).forEach((m) => (m.material = chestMat));
      chestTemplate = n;
    }
  });
  let bossTimer = 0;
  /** 已生成的王數（最多 BOSS_COUNT） */
  let bossCount = 0;
  /** 已擊敗的王數 */
  let bossDefeated = 0;

  /** 一輪狀態 */
  let run: RunState = { ...runTemplate };
  let levels: Record<string, number> = {};
  let level = 1;
  let xp = 0;
  let xpToNext = xpForLevel(level);
  let hp = run.maxHp;
  let castleMaxHp = CONFIG.castle.maxHp;
  let castleHp = castleMaxHp;
  let kills = 0;
  let time = 0;
  let goldEarned = 0;
  let superCannonUsed = false;
  let hurtTimer = 0;
  let castleHurtTimer = 0;
  /** 受傷飄字用：兩次回饋之間累計的扣血量 */
  let dmgAccum = 0;
  let state: GameState = 'running';
  let choices: Upgrade[] = [];

  function setGameState(next: GameState) {
    state = next;
    input.setActive(next === 'running');
  }

  function safeHeight(x: number, z: number): number {
    const y = heightAt(x, z);
    return Number.isFinite(y) ? y : 0;
  }

  function recoverView() {
    if (!Number.isFinite(player.position.x) || !Number.isFinite(player.position.y) || !Number.isFinite(player.position.z)) {
      player.position.set(0, safeHeight(0, 0), 0);
      jumpY = 0;
      vy = 0;
      grounded = true;
    }
    if (!Number.isFinite(camera.alpha)) camera.alpha = defaultCamera.alpha;
    if (!Number.isFinite(camera.beta)) camera.beta = defaultCamera.beta;
    if (!Number.isFinite(camera.radius)) camera.radius = defaultCamera.radius;
    camera.beta = Math.max(camera.lowerBetaLimit ?? 0.35, Math.min(camera.upperBetaLimit ?? Math.PI / 2.2, camera.beta));
    camera.radius = Math.max(camera.lowerRadiusLimit ?? 25, Math.min(camera.upperRadiusLimit ?? 80, camera.radius));
    const groundY = safeHeight(player.position.x, player.position.z);
    if (
      !Number.isFinite(camera.target.x) ||
      !Number.isFinite(camera.target.y) ||
      !Number.isFinite(camera.target.z)
    ) {
      camera.target.set(player.position.x, groundY + 1.2, player.position.z);
    }
    scene.activeCamera = camera;
  }

  /** 跳躍狀態（jumpY 為離地高度，疊加在地形高度之上） */
  let vy = 0;
  let jumpY = 0;
  let grounded = true;
  let jumpRequested = false;

  /** debug：經驗 ×10、無敵、回力鏢視覺大小 */
  let xpDebug = false;
  let invincible = false;
  let boomerangScale = 1;
  /** 護盾狀態 */
  let shieldReady = false;
  let shieldTimer = 0;
  function requestJump() {
    if (state === 'running') jumpRequested = true;
  }

  const contactRange = CONFIG.player.radius + CONFIG.enemy.radius + 0.2;
  const contactRange2 = contactRange * contactRange;
  /** 障礙物推出計算用暫存 */
  const playerResolve = { x: 0, z: 0 };

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
    else if (type === 'power') {
      eff.damage *= 2;
      eff.orbitalDamage *= 2;
      eff.auraDamage *= 2;
      eff.lightningDamage *= 2;
      eff.novaDamage *= 2;
      eff.boomerangDamage *= 2;
    } else if (type === 'speed') eff.moveSpeed *= 1.5;
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
    /** holder 節點（旋轉/浮動此節點，視覺為其子物件） */
    node: TransformNode;
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
    const node = new TransformNode(`item-${kind}`, scene);
    if (kind === 'chest' && chestTemplate) {
      const vis = chestTemplate.clone('chest-vis', node);
      vis?.setEnabled(true);
    } else {
      const vis = kind === 'chest' ? createChestMesh(scene) : createHealMesh(scene);
      vis.parent = node;
    }
    const baseY = heightAt(x, z) + (kind === 'chest' ? 0.5 : 0.9);
    node.position.set(x, baseY, z);
    const healPct =
      kind === 'heal'
        ? CONFIG.items.healPercents[Math.floor(Math.random() * CONFIG.items.healPercents.length)]
        : 0;
    itemList.push({ node, kind, bornAt: time, baseY, healPct });
  }

  function triggerItem(item: WorldItem) {
    const pos = item.node.position;
    if (item.kind === 'chest') {
      const def = BUFFS[Math.floor(Math.random() * BUFFS.length)];
      const existing = activeBuffs.find((b) => b.type === def.type);
      if (existing) existing.until = time + CONFIG.items.buffDuration / 1000;
      else activeBuffs.push({ type: def.type, until: time + CONFIG.items.buffDuration / 1000 });
      spawnText(scene, pos, def.name, def.color, 5);
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
      item.node.rotation.y += dt * 1.6;
      item.node.position.y = item.baseY + Math.sin(time * 3 + i) * 0.18;

      if (time - item.bornAt > CONFIG.items.lifetimeSec) {
        item.node.dispose();
        itemList.splice(i, 1);
        continue;
      }
      const dx = item.node.position.x - px;
      const dz = item.node.position.z - pz;
      if (dx * dx + dz * dz <= r2) {
        triggerItem(item);
        item.node.dispose();
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
    castleHp,
    castleMaxHp,
    level,
    xp: 0,
    xpToNext,
    state,
    choices: [],
    bossActive: false,
    bossHp: 0,
    bossMaxHp: 0,
    bossName: '',
    bossSkill: '',
    bossDefeated: 0,
    bossTotal: BOSS_COUNT,
    goldEarned: 0,
    superCannonUsed: false,
    musicTrack: 0,
  };

  function pushStats() {
    stats.fps = Math.round(engine.getFps());
    stats.enemies = enemies.count;
    stats.kills = kills;
    stats.time = time;
    stats.hp = Math.max(0, Math.ceil(hp));
    stats.maxHp = run.maxHp;
    stats.castleHp = Math.max(0, Math.ceil(castleHp));
    stats.castleMaxHp = castleMaxHp;
    stats.level = level;
    stats.xp = Math.floor(xp);
    stats.xpToNext = xpToNext;
    stats.state = state;
    stats.choices = choices.map((c) => ({ id: c.id, name: c.name, desc: c.desc, emoji: c.emoji }));
    stats.bossActive = boss.active;
    stats.bossHp = Math.max(0, Math.ceil(boss.hp));
    stats.bossMaxHp = boss.maxHp;
    stats.bossName = boss.name;
    stats.bossSkill = boss.skillName;
    stats.bossDefeated = bossDefeated;
    stats.goldEarned = goldEarned;
    stats.superCannonUsed = superCannonUsed;
    stats.musicTrack = musicTrackIdx;
    options.onStats?.(stats);
  }

  const clampArena = (v: number) => Math.max(-CONFIG.arenaHalf, Math.min(CONFIG.arenaHalf, v));

  function togglePause() {
    if (state === 'running') setGameState('paused');
    else if (state === 'paused') setGameState('running');
    else return;
    pushStats();
  }

  function enterLevelUp() {
    const rolled = rollChoices(levels);
    if (rolled.length === 0) return; // 全滿級，略過暫停
    choices = rolled;
    setGameState('levelup');
    levelUpBurst(scene, new Vector3(player.position.x, player.position.y + 1, player.position.z));
    sound.levelUp();
    pushStats();
  }

  function gameplay(dt: number) {
    recoverView();
    const dir = input.getDirection();
    /** 清除過期增益，計算套用增益後的有效數值 */
    for (let i = activeBuffs.length - 1; i >= 0; i--) {
      if (time >= activeBuffs[i].until) activeBuffs.splice(i, 1);
    }
    const eff = effectiveRun();

    /** 依攝影機水平角度（alpha）將輸入轉為相機相對方向：
     *  前（+z）= 遠離攝影機，右（+x）= 畫面右側。預設角度下為恆等。 */
    const ca = Math.cos(camera.alpha);
    const sa = Math.sin(camera.alpha);
    const moveX = dir.x * -sa + dir.z * -ca;
    const moveZ = dir.x * ca + dir.z * -sa;

    player.position.x = clampArena(player.position.x + moveX * eff.moveSpeed * dt);
    player.position.z = clampArena(player.position.z + moveZ * eff.moveSpeed * dt);
    /** 障礙物阻擋 */
    if (obstacles.length > 0) {
      resolveObstacles(obstacles, player.position.x, player.position.z, CONFIG.player.radius, playerResolve);
      player.position.x = clampArena(playerResolve.x);
      player.position.z = clampArena(playerResolve.z);
    }

    /** 面向移動方向（模型前方為 +Z），平滑轉向 */
    const moving = dir.x !== 0 || dir.z !== 0;
    if (moving) {
      const targetAngle = Math.atan2(moveX, moveZ);
      player.rotation.y = lerpAngle(player.rotation.y, targetAngle, 0.25);
    }
    /** 移動時播放走路動畫，停下時回到 idle（僅在狀態改變時切換） */
    if (moving !== playerMoving) {
      playerMoving = moving;
      if (moving) {
        playerIdle?.stop();
        playerWalk?.start(true);
      } else {
        playerWalk?.stop();
        playerIdle?.start(true);
      }
    }

    /** 跳躍：地表高度之上的拋物線位移（jumpY 為離地高度） */
    if (jumpRequested && grounded) {
      vy = eff.jumpStrength;
      grounded = false;
    }
    jumpRequested = false;
    if (!grounded) {
      vy -= CONFIG.player.jump.gravity * dt;
      jumpY += vy * dt;
      if (jumpY <= 0) {
        jumpY = 0;
        vy = 0;
        grounded = true;
      }
    }
    const airborne = jumpY > CONFIG.player.jump.dodgeHeight;

    const px = player.position.x;
    const pz = player.position.z;
    const castleX = castle.position.x;
    const castleZ = castle.position.z;
    /** 玩家貼地（地形高度）+ 跳躍離地高度 */
    const groundY = heightAt(px, pz);
    player.position.y = groundY + jumpY;
    camera.target.set(px, groundY + 1.2, pz);

    castle.position.y = heightAt(castleX, castleZ);
    if (castlePulseTimer > 0) castlePulseTimer = Math.max(0, castlePulseTimer - dt);
    const castlePulseT = castlePulseTimer / CONFIG.castle.quizPulseDuration;
    const castlePulseScale = 1 + (CONFIG.castle.quizPulseScale - 1) * Math.sin(Math.max(0, castlePulseT) * Math.PI);
    castle.scaling.set(castlePulseScale, castlePulseScale, castlePulseScale);

    /** 生成導演：隨時間升壓 */
    enemies.hpMul = (1 + time * CONFIG.director.hpGrowthPerSec * diff.growth) * diff.enemyHp;
    /** 怪速含「時緩」倍率與難度 */
    enemies.speedMul = (1 + time * CONFIG.director.speedGrowthPerSec * diff.growth) * eff.enemySpeedMul * diff.enemySpeed;
    enemies.tier = Math.min(1, time / 120);
    const target = Math.min(
      CONFIG.director.maxCount,
      CONFIG.director.baseCount + Math.floor(time / CONFIG.director.stepIntervalSec) * CONFIG.director.addPerStep,
    );
    enemies.setCount(target, castleX, castleZ);

    grid.clear();
    enemies.insertAll(grid);
    enemies.update(dt, castleX, castleZ, grid, obstacles, eff.slowRadius, eff.slowFactor, px, pz);
    /** 減速光環視覺 */
    if (eff.slowRadius > 0) {
      slowField.position.set(px, groundY + 0.06, pz);
      slowField.scaling.set(eff.slowRadius, eff.slowRadius, eff.slowRadius);
      if (!slowField.isEnabled()) slowField.setEnabled(true);
    } else if (slowField.isEnabled()) {
      slowField.setEnabled(false);
    }

    /** 王：依序登場（共 BOSS_COUNT 隻） */
    bossTimer += dt;
    if (!boss.active && bossCount < BOSS_COUNT && bossTimer >= CONFIG.boss.intervalSec) {
      bossTimer = 0;
      boss.spawn(bossCount, castleX, castleZ);
      sound.bossSpawn();
      bossCount += 1;
    }

    /** 本幀累積的吸血量，於下方依「每秒上限」結算（避免高擊殺率無限回血） */
    let lifestealAccrued = 0;
    const onKill = (x: number, z: number) => {
      gems.spawn(x, z);
      const y = heightAt(x, z);
      enemyDeathBurst(scene, new Vector3(x, y + CONFIG.enemy.y, z));
      bloodDecals.spawn(x, z, y + 0.03);
      /** 吸血：先累積，稍後封頂結算 */
      if (eff.lifestealOnKill > 0) lifestealAccrued += eff.lifestealOnKill;
      sound.hit();
    };
    kills += weapon.update(dt, px, pz, enemies, boss, grid, eff, onKill, groundY);
    kills += extras.update(dt, px, pz, enemies, boss, eff, onKill, groundY);
    /** 吸血結算：每秒回血上限 = 1 + 1.6 × 每殺回血（與擊殺率脫鉤，殺再快也封頂） */
    if (lifestealAccrued > 0 && hp > 0) {
      const capPerSec = 1 + 1.6 * eff.lifestealOnKill;
      hp = Math.min(run.maxHp, hp + Math.min(lifestealAccrued, capPerSec * dt));
    }

    /** 王被擊敗：噴出大量經驗 + 爆炸特效 */
    if (boss.justDied) {
      boss.justDied = false;
      kills += 1;
      bossDefeated += 1;
      /** 依進度自動切歌（手動下拉仍可在里程碑之間覆蓋） */
      const nextTrack = stageTrack(bossDefeated);
      if (nextTrack !== musicTrackIdx) {
        musicTrackIdx = nextTrack;
        sound.setMusicTrack(musicTrackIdx);
      }
      bossDeathBurst(scene, new Vector3(boss.x, heightAt(boss.x, boss.z) + 1.5, boss.z));
      sound.bossDown();
      for (let n = 0; n < CONFIG.boss.xpGems; n++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 3;
        gems.spawn(boss.x + Math.cos(a) * d, boss.z + Math.sin(a) * d);
      }
      /** 擊敗最終王 → 破關 */
      if (bossDefeated >= BOSS_COUNT) {
        goldEarned = calculateGoldEarned(kills, time, goldMul, true);
        setGameState('won');
        sound.levelUp();
        hazards.reset();
        pushStats();
        options.onGameOver?.({ gold: goldEarned, kills, time, level, won: true });
        return;
      }
    }

    boss.update(dt, castleX, castleZ, obstacles, hazards);
    /** 王招式對玩家造成的傷害（彈幕／震波／毒池，無視騰空），統一於下方結算 */
    const hazardDmg = hazards.update(dt, px, pz, groundY);

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
      /** 每顆寶石基礎經驗（預設 4） */
      xp += collected * 4 * eff.xpMultiplier * (xpDebug ? 10 : 1);
      if (xp >= xpToNext) {
        xp -= xpToNext;
        level += 1;
        xpToNext = xpForLevel(level);
        enterLevelUp();
      }
    }

    /** 接觸傷害：小怪主攻城，玩家貼身仍會受傷。 */
    let touching = false;
    let attackingCastle = false;
    const castleRange = CONFIG.castle.radius + CONFIG.enemy.radius;
    const castleRange2 = castleRange * castleRange;
    grid.query(px, pz, (j) => {
      if (touching || !enemies.isAlive(j)) return;
      const dx = enemies.getX(j) - px;
      const dz = enemies.getZ(j) - pz;
      if (dx * dx + dz * dz <= contactRange2) touching = true;
    });
    grid.query(castleX, castleZ, (j) => {
      if (attackingCastle || !enemies.isAlive(j)) return;
      const dx = enemies.getX(j) - castleX;
      const dz = enemies.getZ(j) - castleZ;
      if (dx * dx + dz * dz <= castleRange2) attackingCastle = true;
    });
    const contactDps = CONFIG.player.contactDps * (1 + time * CONFIG.director.contactGrowthPerSec * diff.growth) * diff.enemyContact;
    const bossTouch = boss.contactsPlayer(px, pz, CONFIG.player.radius);
    const bossHitsCastle = boss.contactsPlayer(castleX, castleZ, CONFIG.castle.radius);

    /** 護盾：定期生成，可擋下一次傷害 */
    if (eff.shieldInterval > 0) {
      if (!shieldReady) {
        shieldTimer += dt;
        if (shieldTimer >= eff.shieldInterval) {
          shieldReady = true;
          shieldTimer = 0;
        }
      }
    } else {
      shieldReady = false;
    }

    /** 統一結算本幀傷害：接觸（騰空可躲）+ 王招式；套用減傷與護盾 */
    let incoming = 0;
    if (!airborne) {
      if (touching) incoming += contactDps * dt;
      if (bossTouch) incoming += boss.contactDps * diff.enemyContact * dt;
    }
    incoming += hazardDmg;
    if (invincible) incoming = 0;
    incoming *= 1 - eff.damageReduction;
    if (incoming > 0 && shieldReady) {
      incoming = 0;
      shieldReady = false;
      shieldTimer = 0;
    }
    if (incoming > 0) {
      hp -= incoming;
      dmgAccum += incoming;
    }

    let castleIncoming = 0;
    if (attackingCastle) {
      castleIncoming += CONFIG.castle.contactDps * (1 + time * CONFIG.director.contactGrowthPerSec * diff.growth) * diff.enemyContact * dt;
    }
    if (bossHitsCastle) castleIncoming += boss.contactDps * 0.75 * diff.enemyContact * dt;
    if (castleIncoming > 0) castleHp -= castleIncoming;

    /** 護盾視覺 */
    if (shieldReady) {
      shieldRing.position.set(px, groundY + 1.1, pz);
      if (!shieldRing.isEnabled()) shieldRing.setEnabled(true);
    } else if (shieldRing.isEnabled()) {
      shieldRing.setEnabled(false);
    }

    /** 生命再生 */
    if (eff.hpRegen > 0 && hp > 0) hp = Math.min(run.maxHp, hp + eff.hpRegen * dt);

    /** 受擊回饋：間歇火花 + 頭上飄出扣血數字 */
    hurtTimer -= dt;
    if (incoming > 0 && hurtTimer <= 0) {
      hurtTimer = 0.35;
      hurtBurst(scene, new Vector3(px, groundY + 1, pz));
      sound.hurt();
      if (dmgAccum >= 1) spawnText(scene, new Vector3(px, groundY + 2.4, pz), `-${Math.round(dmgAccum)}`, '#ff1818', 3);
      dmgAccum = 0;
    }

    castleHurtTimer -= dt;
    if (castleIncoming > 0 && castleHurtTimer <= 0) {
      castleHurtTimer = 0.45;
      spawnText(scene, new Vector3(castleX, castle.position.y + 4.8, castleZ), `主堡 -${Math.max(1, Math.round(castleIncoming))}`, '#fb7185', 3.2);
    }

    if (hp <= 0 || castleHp <= 0) {
      hp = Math.max(0, hp);
      castleHp = Math.max(0, castleHp);
      goldEarned = calculateGoldEarned(kills, time, goldMul, false);
      setGameState('dead');
      sound.playerDeath();
      pushStats();
      options.onGameOver?.({ gold: goldEarned, kills, time, level, won: false });
    }

    time += dt;
  }

  let throttle = 0;
  engine.runRenderLoop(() => {
    try {
      const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
      if (state === 'running') gameplay(dt);
      scene.render();

      throttle += dt;
      if (throttle >= 0.1) {
        throttle = 0;
        pushStats();
      }
    } catch (error) {
      console.error('[game] render loop recovered', error);
      recoverView();
      scene.render();
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

  /** ===== Debug 可調參數 ===== */
  interface DebugParam {
    label: string;
    group: string;
    type: 'range' | 'bool';
    min: number;
    max: number;
    step: number;
    get: () => number;
    set: (v: number) => void;
  }
  const cfgParam = (
    group: string,
    label: string,
    min: number,
    max: number,
    step: number,
    get: () => number,
    set: (v: number) => void,
  ): DebugParam => ({ group, label, type: 'range', min, max, step, get, set });
  const boolParam = (group: string, label: string, get: () => boolean, set: (v: boolean) => void): DebugParam => ({
    group,
    label,
    type: 'bool',
    min: 0,
    max: 1,
    step: 1,
    get: () => (get() ? 1 : 0),
    set: (v) => set(v > 0.5),
  });

  function triggerSuperCannon(): boolean {
    if (state !== 'running' || superCannonUsed) return false;
    superCannonUsed = true;

    const cx = castle.position.x;
    const cz = castle.position.z;
    const cy = safeHeight(cx, cz);
    const radius = CONFIG.superCannon.radius;
    const radius2 = radius * radius;
    let defeated = 0;

    for (let i = 0; i < enemies.count; i++) {
      if (!enemies.isAlive(i)) continue;
      const ex = enemies.getX(i);
      const ez = enemies.getZ(i);
      const dx = ex - cx;
      const dz = ez - cz;
      if (dx * dx + dz * dz > radius2) continue;
      if (enemies.damage(i, 9999, cx, cz)) {
        defeated += 1;
        kills += 1;
        gems.spawn(ex, ez);
        enemyDeathBurst(scene, new Vector3(ex, heightAt(ex, ez) + CONFIG.enemy.y, ez));
        bloodDecals.spawn(ex, ez, heightAt(ex, ez) + 0.03);
      }
    }

    if (boss.active) {
      const dx = boss.x - cx;
      const dz = boss.z - cz;
      if (dx * dx + dz * dz <= radius2) {
        boss.hitTest(boss.x, boss.z, boss.radius, CONFIG.superCannon.bossDamage);
      }
    }

    levelUpBurst(scene, new Vector3(cx, cy + 2.2, cz));
    bossDeathBurst(scene, new Vector3(cx, cy + 1.8, cz));
    spawnText(scene, new Vector3(cx, cy + 5.2, cz), `超級大炮！擊退 ${defeated}`, '#fde047', 5);
    sound.bossDown();
    pushStats();
    return true;
  }

  const debugSpec: DebugParam[] = [
    boolParam('玩家', '無敵', () => invincible, (v) => (invincible = v)),
    boolParam('玩家', 'EXP×10', () => xpDebug, (v) => (xpDebug = v)),
    cfgParam('玩家', '移動速度', 0, 40, 0.5, () => run.moveSpeed, (v) => (run.moveSpeed = v)),
    cfgParam('玩家', '生命上限', 10, 1000, 10, () => run.maxHp, (v) => (run.maxHp = v)),
    cfgParam('玩家', '接觸傷害/秒', 0, 100, 1, () => CONFIG.player.contactDps, (v) => (CONFIG.player.contactDps = v)),
    cfgParam('玩家', '跳躍力', 0, 20, 0.5, () => CONFIG.player.jump.strength, (v) => (CONFIG.player.jump.strength = v)),

    cfgParam('武器', '傷害', 1, 200, 1, () => run.damage, (v) => (run.damage = v)),
    cfgParam('武器', '發射間隔', 0.05, 2, 0.05, () => run.fireInterval, (v) => (run.fireInterval = v)),
    cfgParam('武器', '投射物數', 1, 20, 1, () => run.projectileCount, (v) => (run.projectileCount = v)),
    cfgParam('武器', '射程', 5, 120, 1, () => run.range, (v) => (run.range = v)),
    cfgParam('武器', '彈速', 5, 120, 1, () => run.projectileSpeed, (v) => (run.projectileSpeed = v)),

    cfgParam('額外武器', '環繞飛斧數', 0, 6, 1, () => run.orbitalCount, (v) => (run.orbitalCount = v)),
    cfgParam('額外武器', '飛斧傷害', 0, 100, 1, () => run.orbitalDamage, (v) => (run.orbitalDamage = v)),
    cfgParam('額外武器', '飛斧半徑', 1, 20, 0.5, () => run.orbitalRadius, (v) => (run.orbitalRadius = v)),
    cfgParam('額外武器', '光環半徑', 0, 30, 1, () => run.auraRadius, (v) => (run.auraRadius = v)),
    cfgParam('額外武器', '光環傷害', 0, 100, 1, () => run.auraDamage, (v) => (run.auraDamage = v)),
    cfgParam('額外武器', '閃電連鎖數', 0, 10, 1, () => run.lightningCount, (v) => (run.lightningCount = v)),
    cfgParam('額外武器', '閃電傷害', 0, 100, 1, () => run.lightningDamage, (v) => (run.lightningDamage = v)),
    cfgParam('額外武器', '新星半徑', 0, 30, 1, () => run.novaRadius, (v) => (run.novaRadius = v)),
    cfgParam('額外武器', '新星傷害', 0, 100, 1, () => run.novaDamage, (v) => (run.novaDamage = v)),
    cfgParam('額外武器', '回力鏢數', 0, 8, 1, () => run.boomerangCount, (v) => (run.boomerangCount = v)),
    cfgParam('額外武器', '回力鏢傷害', 0, 100, 1, () => run.boomerangDamage, (v) => (run.boomerangDamage = v)),
    cfgParam(
      '額外武器',
      '長矛大小',
      0.2,
      6,
      0.1,
      () => boomerangScale,
      (v) => {
        boomerangScale = v;
        extras.setBoomerangScale(v);
      },
    ),

    cfgParam('小怪', '數量上限', 0, 52, 1, () => CONFIG.director.maxCount, (v) => (CONFIG.director.maxCount = v)),
    cfgParam('小怪', '初始數量', 0, 52, 1, () => CONFIG.director.baseCount, (v) => (CONFIG.director.baseCount = v)),
    cfgParam('小怪', '每階增量', 0, 20, 1, () => CONFIG.director.addPerStep, (v) => (CONFIG.director.addPerStep = v)),
    cfgParam('小怪', '升壓間隔秒', 1, 30, 1, () => CONFIG.director.stepIntervalSec, (v) => (CONFIG.director.stepIntervalSec = v)),
    cfgParam('小怪', '分離力', 0, 30, 1, () => CONFIG.enemy.separationForce, (v) => (CONFIG.enemy.separationForce = v)),

    cfgParam('王/道具', '王間隔秒', 5, 120, 1, () => CONFIG.boss.intervalSec, (v) => (CONFIG.boss.intervalSec = v)),
    cfgParam('王/道具', '王基礎血', 50, 5000, 50, () => CONFIG.boss.hpBase, (v) => (CONFIG.boss.hpBase = v)),
    cfgParam('王/道具', '寶箱間隔ms', 2000, 60000, 1000, () => CONFIG.items.chestInterval, (v) => (CONFIG.items.chestInterval = v)),
    cfgParam('王/道具', '回血間隔ms', 2000, 60000, 1000, () => CONFIG.items.healInterval, (v) => (CONFIG.items.healInterval = v)),

    cfgParam('王招式', '彈幕傷害', 0, 100, 1, () => hazards.projDamage, (v) => (hazards.projDamage = v)),
    cfgParam('王招式', '震波傷害', 0, 100, 1, () => hazards.shockDamage, (v) => (hazards.shockDamage = v)),
    cfgParam('王招式', '泡泡圈傷害/秒', 0, 100, 1, () => hazards.poisonDps, (v) => (hazards.poisonDps = v)),
  ];

  pushStats();

  return {
    dispose() {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      input.detach();
      sound.stopMusic();
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
      /** 最大生命升級補滿，其餘升級回復 30% 最大生命 */
      if (upgrade.id === 'maxhp') hp = run.maxHp;
      else hp = Math.min(run.maxHp, hp + run.maxHp * 0.3);
      const castleHeal = castleMaxHp * CONFIG.castle.quizHealPercent;
      castleHp = Math.min(castleMaxHp, castleHp + castleHeal);
      castlePulseTimer = CONFIG.castle.quizPulseDuration;
      spawnText(
        scene,
        new Vector3(player.position.x, safeHeight(player.position.x, player.position.z) + 1.4, player.position.z),
        `獲得 ${upgrade.name}`,
        '#fde68a',
        4.2,
      );
      spawnText(scene, new Vector3(castle.position.x, castle.position.y + 5, castle.position.z), `主堡 +${Math.round(castleHeal)}`, '#86efac', 4);
      sound.treasure();
      choices = [];
      setGameState('running');
      recoverView();
      engine.resize();
      pushStats();
    },
    restart() {
      run = { ...runTemplate };
      levels = {};
      level = 1;
      xp = 0;
      xpToNext = xpForLevel(level);
      hp = run.maxHp;
      castleMaxHp = CONFIG.castle.maxHp;
      castleHp = castleMaxHp;
      kills = 0;
      time = 0;
      goldEarned = 0;
      superCannonUsed = false;
      hurtTimer = 0;
      castleHurtTimer = 0;
      choices = [];
      setGameState('running');
      vy = 0;
      jumpY = 0;
      grounded = true;
      jumpRequested = false;
      shieldReady = false;
      shieldTimer = 0;
      shieldRing.setEnabled(false);
      slowField.setEnabled(false);
      playerMoving = false;
      playerWalk?.stop();
      playerIdle?.start(true);
      player.position.set(9, heightAt(9, 0), 0);
      castle.position.set(0, heightAt(0, 0), 0);
      castle.scaling.set(1, 1, 1);
      castlePulseTimer = 0;
      enemies.reset(0, 0);
      gems.reset();
      weapon.reset();
      extras.reset();
      boss.reset();
      hazards.reset();
      bloodDecals.reset();
      bossTimer = 0;
      bossCount = 0;
      bossDefeated = 0;
      activeBuffs.length = 0;
      for (const it of itemList) it.node.dispose();
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
    setMuted(on: boolean) {
      sound.setMuted(on);
    },
    setMusicTrack(i: number) {
      musicTrackIdx = i;
      sound.setMusicTrack(i);
    },
    setQuality(id: QualityId) {
      const q = getQuality(id);
      engine.setHardwareScalingLevel(q.hardwareScaling);
      glow.intensity = q.glow;
      glow.isEnabled = q.glow > 0;
      scene.fogEnd = q.fogEnd;
      /** 抗鋸齒需重建 Engine 才能改，於下次開局生效 */
    },
    getDebugParams() {
      return debugSpec.map((p) => ({
        label: p.label,
        group: p.group,
        type: p.type,
        min: p.min,
        max: p.max,
        step: p.step,
        value: p.get(),
      }));
    },
    setDebugParam(index: number, value: number) {
      debugSpec[index]?.set(value);
    },
    getUpgradeStatus() {
      return UPGRADES.map((u) => ({
        name: u.name,
        emoji: u.emoji,
        level: levels[u.id] ?? 0,
        maxLevel: u.maxLevel,
      }));
    },
    getBossNames() {
      return BOSS_INFO.map((b) => b.name);
    },
    summonBoss(index: number) {
      if (index < 0 || index >= BOSS_COUNT) return;
      boss.spawn(index, player.position.x, player.position.z);
      bossTimer = 0;
    },
    triggerSuperCannon() {
      return triggerSuperCannon();
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

function calculateGoldEarned(kills: number, time: number, multiplier: number, won: boolean): number {
  const combatGold = kills * 0.25;
  const survivalGold = time * 0.18;
  const clearBonus = won ? 180 : 0;
  return Math.max(0, Math.floor((combatGold + survivalGold + clearBonus) * multiplier));
}

/** 星願主堡：可愛、穩定載入的程序化守護塔。 */
function createCastleModel(scene: Scene): TransformNode {
  const root = new TransformNode('wish-castle', scene);

  const wallMat = new StandardMaterial('castle-wall-mat', scene);
  wallMat.diffuseColor = new Color3(1, 0.78, 0.9);
  wallMat.emissiveColor = new Color3(0.2, 0.08, 0.18);
  wallMat.specularColor = new Color3(0.2, 0.2, 0.2);

  const roofMat = new StandardMaterial('castle-roof-mat', scene);
  roofMat.diffuseColor = new Color3(0.58, 0.72, 1);
  roofMat.emissiveColor = new Color3(0.08, 0.18, 0.36);
  roofMat.specularColor = Color3.Black();

  const starMat = new StandardMaterial('castle-star-mat', scene);
  starMat.diffuseColor = new Color3(1, 0.92, 0.32);
  starMat.emissiveColor = new Color3(1, 0.72, 0.08);
  starMat.specularColor = Color3.Black();
  starMat.disableLighting = true;

  const base = MeshBuilder.CreateCylinder('castle-base', { diameter: 7.6, height: 1.4, tessellation: 36 }, scene);
  base.parent = root;
  base.position.y = 0.7;
  base.material = wallMat;
  base.isPickable = false;

  const keep = MeshBuilder.CreateCylinder('castle-keep', { diameter: 4.7, height: 5.2, tessellation: 36 }, scene);
  keep.parent = root;
  keep.position.y = 3.3;
  keep.material = wallMat;
  keep.isPickable = false;

  const roof = MeshBuilder.CreateCylinder('castle-roof', { diameterTop: 0.35, diameterBottom: 5.4, height: 2.8, tessellation: 36 }, scene);
  roof.parent = root;
  roof.position.y = 7.3;
  roof.material = roofMat;
  roof.isPickable = false;

  for (const [x, z] of [
    [-3.5, -3.5],
    [3.5, -3.5],
    [-3.5, 3.5],
    [3.5, 3.5],
  ] as const) {
    const tower = MeshBuilder.CreateCylinder('castle-tower', { diameter: 1.35, height: 4.3, tessellation: 18 }, scene);
    tower.parent = root;
    tower.position.set(x, 2.15, z);
    tower.material = wallMat;
    tower.isPickable = false;

    const cap = MeshBuilder.CreateCylinder('castle-tower-cap', { diameterTop: 0.15, diameterBottom: 1.8, height: 1.4, tessellation: 18 }, scene);
    cap.parent = root;
    cap.position.set(x, 4.95, z);
    cap.material = roofMat;
    cap.isPickable = false;
  }

  const star = MeshBuilder.CreateSphere('castle-star', { diameter: 1.25, segments: 16 }, scene);
  star.parent = root;
  star.position.y = 9.2;
  star.scaling.set(1, 0.45, 1);
  star.material = starMat;
  star.isPickable = false;

  const halo = MeshBuilder.CreateTorus('castle-halo', { diameter: CONFIG.castle.radius * 2, thickness: 0.08, tessellation: 72 }, scene);
  halo.parent = root;
  halo.position.y = 0.08;
  halo.material = starMat;
  halo.isPickable = false;

  return root;
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

/**
 * 散布夢境小鎮道具（油桶、貨櫃、三角錐、水塔），提供移動參考與氛圍。
 * solid 者登記為障礙物（半徑），阻擋玩家與怪物；三角錐為純裝飾。
 */
async function scatterProps(scene: Scene, obstacles: Obstacle[], heightAt: (x: number, z: number) => number) {
  const half = CONFIG.arenaHalf;
  const density = CONFIG.decorationDensityScale;
  const props: { path: string; height: number; count: number; solid?: number }[] = [
    { path: '/models/zombie/barrel.glb', height: 2.2, count: 10, solid: 1 },
    { path: '/models/zombie/container.glb', height: 4, count: 4, solid: 2.8 },
    { path: '/models/zombie/prop_container_red.glb', height: 4, count: 3, solid: 2.8 },
    { path: '/models/zombie/cone.glb', height: 1.5, count: 10 },
    { path: '/models/zombie/watertower.glb', height: 10, count: 2, solid: 2.2 },
    { path: '/models/zombie/prop_truck.glb', height: 4.5, count: 3, solid: 4 },
    { path: '/models/zombie/prop_couch.glb', height: 1.8, count: 5, solid: 2 },
    { path: '/models/zombie/prop_hydrant.glb', height: 1.8, count: 6, solid: 0.8 },
    { path: '/models/zombie/prop_barrier.glb', height: 1.6, count: 7, solid: 1.5 },
    { path: '/models/zombie/prop_wheels.glb', height: 1.6, count: 5, solid: 1 },
    { path: '/models/zombie/prop_pallet.glb', height: 0.9, count: 8 },
    { path: '/models/zombie/prop_trashbag.glb', height: 1.4, count: 10 },
    { path: '/models/zombie/prop_cinderblock.glb', height: 0.9, count: 8 },
  ];

  for (const p of props) {
    const base = await loadModel(scene, p.path, p.height);
    if (!base) continue;
    const place = (node: { position: { x: number; y: number; z: number }; rotation: { y: number } }) => {
      let x = 0;
      let z = 0;
      /** 避開玩家出生點（半徑 10 內）重試幾次 */
      for (let tries = 0; tries < 8; tries++) {
        x = (Math.random() * 2 - 1) * half;
        z = (Math.random() * 2 - 1) * half;
        if (x * x + z * z > 100) break;
      }
      node.position.x = x;
      node.position.z = z;
      node.position.y = heightAt(x, z);
      node.rotation.y = Math.random() * Math.PI * 2;
      if (p.solid) obstacles.push({ x, z, radius: p.solid });
    };
    place(base);
    const count = Math.round(p.count * density);
    for (let i = 1; i < count; i++) {
      const clone = base.clone(`${p.path}-${i}`, null);
      if (clone) place(clone);
    }
  }
}
