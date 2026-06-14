<template>
  <div class="absolute inset-0 overflow-hidden" :style="bgStyle">
    <div
      v-for="s in shapes"
      :key="s.id"
      class="absolute shape"
      :style="s.style"
    />
    <!-- 暗角，聚焦中央 -->
    <div class="absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)" />
  </div>
</template>

<script setup lang="ts">
interface ShapeData {
  id: number;
  style: Record<string, string>;
}

/** 夢境色盤：星空藍、莓果粉、薄荷綠、奶油黃、薰衣草紫 */
const COLORS = ['#7dd3fc', '#f9a8d4', '#a7f3d0', '#fde68a', '#c4b5fd', '#f0abfc'];
const SHAPES = ['circle', 'square', 'triangle'] as const;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const bgStyle = {
  background: 'linear-gradient(160deg, #152044 0%, #3f2c68 48%, #1b315e 100%)',
};

const shapes: ShapeData[] = Array.from({ length: 22 }, (_, i) => {
  const size = rand(2, 11);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const base: Record<string, string> = {
    left: `${rand(-5, 100)}%`,
    top: `${rand(-5, 100)}%`,
    width: `${size}rem`,
    height: `${size}rem`,
    opacity: `${rand(0.12, 0.3)}`,
    background: shape === 'triangle' ? 'transparent' : color,
    transform: `rotate(${rand(0, 360)}deg)`,
    animationDuration: `${rand(14, 34)}s`,
    animationDelay: `${-rand(0, 20)}s`,
  };
  if (shape === 'circle') base.borderRadius = '9999px';
  else if (shape === 'square') base.borderRadius = '0.6rem';
  else {
    base.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
    base.background = color;
  }
  return { id: i, style: base };
});
</script>

<style scoped>
.shape {
  animation-name: drift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}
@keyframes drift {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-3rem, -4rem) rotate(40deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}
</style>
