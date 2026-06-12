<template>
  <landing-screen
    v-if="screen === 'landing'"
    @start="screen = 'menu'"
    @leaderboard="screen = 'leaderboard'"
    @bestiary="screen = 'bestiary'"
  />
  <leaderboard-screen v-else-if="screen === 'leaderboard'" @back="screen = 'landing'" />
  <bestiary-screen v-else-if="screen === 'bestiary'" @back="screen = 'landing'" />
  <menu-screen
    v-else-if="screen === 'menu'"
    :meta="meta"
    @start="onStart"
    @buy="onBuy"
    @unlock="onUnlock"
    @add-gold="onAddGold"
    @home="screen = 'landing'"
  />
  <game-view
    v-else
    :character-color="characterColor"
    :character-model="characterModel"
    :start-run-state="startRun"
    :gold-multiplier="goldMul"
    @gameover="onGameOver"
    @menu="screen = 'landing'"
  />
</template>

<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue';
import MenuScreen from './components/menu-screen.vue';
import GameView from './components/game-view.vue';
import LandingScreen from './components/landing-screen.vue';
import LeaderboardScreen from './components/leaderboard-screen.vue';
import BestiaryScreen from './components/bestiary-screen.vue';
import { loadMeta, saveMeta, computeStartRunState, goldMultiplier, PERMA, permaCost } from './game/meta';
import { getCharacter } from './game/characters';
import { addRecord, recordStats } from './game/leaderboard';
import type { RunState } from './game/upgrades';
import type { RunResult } from './game/game';

const meta = reactive(loadMeta());
const screen = ref<'landing' | 'menu' | 'game' | 'leaderboard' | 'bestiary'>('landing');

const startRun = shallowRef<RunState>();
const characterColor = ref<[number, number, number]>([1, 1, 1]);
const characterModel = ref<string>();
const goldMul = ref(1);
let lastCharId = 'matt';

function onStart(charId: string) {
  const ch = getCharacter(charId);
  lastCharId = charId;
  startRun.value = computeStartRunState(charId, meta.perma);
  characterColor.value = ch.bodyColor;
  characterModel.value = ch.model;
  goldMul.value = goldMultiplier(meta.perma);
  screen.value = 'game';
}

function onGameOver(result: RunResult) {
  meta.gold += result.gold;
  saveMeta(meta);
  recordStats(result.time, result.kills);
  addRecord({
    character: getCharacter(lastCharId).name,
    time: result.time,
    kills: result.kills,
    level: result.level,
    gold: result.gold,
    won: result.won,
    at: Date.now(),
  });
}

function onBuy(permaId: string) {
  const p = PERMA.find((x) => x.id === permaId);
  if (!p) return;
  const lvl = meta.perma[permaId] ?? 0;
  if (lvl >= p.maxLevel) return;
  const c = permaCost(p, lvl);
  if (meta.gold < c) return;
  meta.gold -= c;
  meta.perma[permaId] = lvl + 1;
  saveMeta(meta);
}

function onUnlock(charId: string) {
  const ch = getCharacter(charId);
  if (meta.unlocked.includes(charId) || meta.gold < ch.cost) return;
  meta.gold -= ch.cost;
  meta.unlocked.push(charId);
  saveMeta(meta);
}

function onAddGold(amount: number) {
  meta.gold += amount;
  saveMeta(meta);
}
</script>
