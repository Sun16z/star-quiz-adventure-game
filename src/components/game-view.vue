<template>
  <div class="relative w-full h-full overflow-hidden bg-[#0b1020]">
    <canvas ref="canvasRef" class="w-full h-full block outline-none touch-none" />

    <hud :stats="stats" />

    <!-- 右上控制：debug（經驗 x10）＋ 暫停 -->
    <div v-show="stats.state === 'running'" class="absolute right-4 top-4 z-10 flex items-center gap-2">
      <button
        class="rounded-full px-3 py-2 text-xs font-black backdrop-blur-md transition active:scale-95"
        :class="xpDebug ? 'bg-lime-400 text-black' : 'bg-black/40 text-white/70'"
        @click="onToggleXpDebug"
      >
        🐞 EXP×10 {{ xpDebug ? 'ON' : 'OFF' }}
      </button>
      <button
        class="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95"
        @click="onTogglePause"
      >
        ⏸
      </button>
    </div>

    <joystick
      v-show="stats.state === 'running'"
      class="absolute bottom-8 left-8 z-10"
      @move="onJoyMove"
      @end="onJoyEnd"
    />

    <!-- 跳躍鈕（手機，遊玩中顯示） -->
    <button
      v-show="stats.state === 'running'"
      class="absolute bottom-12 right-10 z-10 flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/70 text-base font-black text-white backdrop-blur-md transition active:scale-90"
      @pointerdown.prevent="onJump"
    >
      跳躍
    </button>

    <level-up-modal
      v-if="stats.state === 'levelup'"
      :level="stats.level"
      :choices="stats.choices"
      @choose="onChoose"
    />

    <game-over-modal
      v-if="stats.state === 'dead'"
      :stats="stats"
      @restart="onRestart"
      @menu="emit('menu')"
    />

    <victory-modal
      v-if="stats.state === 'won'"
      :stats="stats"
      @restart="onRestart"
      @menu="emit('menu')"
    />

    <pause-menu-modal
      v-if="stats.state === 'paused'"
      @resume="onTogglePause"
      @restart="onRestart"
      @menu="emit('menu')"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { createGame, type GameHandle, type GameStats, type RunResult } from '../game/game';
import type { RunState } from '../game/upgrades';
import Hud from './hud.vue';
import Joystick from './joystick.vue';
import LevelUpModal from './level-up-modal.vue';
import GameOverModal from './game-over-modal.vue';
import VictoryModal from './victory-modal.vue';
import PauseMenuModal from './pause-menu-modal.vue';

const props = defineProps<{
  characterColor: [number, number, number];
  characterModel?: string;
  startRunState?: RunState;
  goldMultiplier: number;
}>();
const emit = defineEmits<{
  (e: 'gameover', result: RunResult): void;
  (e: 'menu'): void;
}>();

const canvasRef = ref<HTMLCanvasElement>();
const stats = reactive<GameStats>({
  fps: 0,
  enemies: 0,
  kills: 0,
  time: 0,
  hp: 0,
  maxHp: 0,
  level: 1,
  xp: 0,
  xpToNext: 1,
  state: 'running',
  choices: [],
  bossActive: false,
  bossHp: 0,
  bossMaxHp: 0,
  bossName: '',
  bossSkill: '',
  bossDefeated: 0,
  bossTotal: 5,
  goldEarned: 0,
});

let game: GameHandle | undefined;

const XP_DEBUG_KEY = 'animal-survivors:xpDebug';
const xpDebug = ref(localStorage.getItem(XP_DEBUG_KEY) === '1');

onMounted(() => {
  if (!canvasRef.value) return;
  game = createGame(canvasRef.value, {
    startRunState: props.startRunState,
    characterColor: props.characterColor,
    characterModel: props.characterModel,
    goldMultiplier: props.goldMultiplier,
    onStats: (s) => Object.assign(stats, s),
    onGameOver: (r) => emit('gameover', r),
  });
  game.setXpDebug(xpDebug.value);
});

onBeforeUnmount(() => game?.dispose());

function onJoyMove(dir: { x: number; z: number }) {
  game?.setJoystick(dir.x, dir.z);
}
function onJoyEnd() {
  game?.setJoystick(0, 0);
}
function onChoose(index: number) {
  game?.chooseUpgrade(index);
}
function onRestart() {
  game?.restart();
}
function onTogglePause() {
  game?.togglePause();
}
function onJump() {
  game?.jump();
}
function onToggleXpDebug() {
  xpDebug.value = !xpDebug.value;
  localStorage.setItem(XP_DEBUG_KEY, xpDebug.value ? '1' : '0');
  game?.setXpDebug(xpDebug.value);
}
</script>
