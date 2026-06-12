<template>
  <div class="absolute inset-0 overflow-auto text-white">
    <background-polygons />

    <div class="relative mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <div class="flex items-center gap-3 pt-4">
        <button
          class="rounded-full bg-white/10 px-4 py-2 font-black backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          @click="emit('back')"
        >
          ← 返回
        </button>
        <h1 class="text-3xl font-black tracking-wider">🏆 排行榜</h1>
      </div>

      <div v-if="records.length === 0" class="rounded-2xl bg-white/5 p-8 text-center text-white/60">
        尚無紀錄，快去殭屍潮中拚一場！
      </div>

      <div v-else class="overflow-hidden rounded-2xl bg-black/40 backdrop-blur-md ring-1 ring-white/10">
        <div class="grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem_3rem] gap-2 border-b border-white/10 px-4 py-2 text-xs font-black text-white/50">
          <span>#</span>
          <span>角色</span>
          <span class="text-right">存活</span>
          <span class="text-right">擊殺</span>
          <span class="text-right">等級</span>
        </div>
        <div
          v-for="(r, i) in records"
          :key="i"
          class="grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem_3rem] items-center gap-2 px-4 py-2 text-sm"
          :class="i % 2 ? 'bg-white/0' : 'bg-white/5'"
        >
          <span class="font-black" :class="rankClass(i)">{{ i + 1 }}</span>
          <span class="font-bold">
            {{ r.character }}
            <span v-if="r.won" class="ml-1 rounded bg-amber-400/90 px-1 text-[0.6rem] font-black text-black">破關</span>
          </span>
          <span class="text-right font-mono">{{ timeText(r.time) }}</span>
          <span class="text-right">{{ r.kills }}</span>
          <span class="text-right">{{ r.level }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BackgroundPolygons from './background-polygons.vue';
import { loadRecords } from '../game/leaderboard';

const emit = defineEmits<{ (e: 'back'): void }>();

const records = ref(loadRecords());

function timeText(t: number) {
  const total = Math.floor(t);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function rankClass(i: number) {
  return ['text-amber-300', 'text-slate-200', 'text-orange-400'][i] ?? 'text-white/50';
}
</script>
