<template>
  <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm">
    <div class="max-h-[92vh] w-[min(94vw,46rem)] overflow-y-auto rounded-3xl bg-[#172238] p-5 text-white shadow-2xl ring-1 ring-white/10 sm:p-6">
      <div class="mb-4 text-center">
        <div class="text-sm font-bold tracking-widest text-amber-300">升級！ LV {{ level }}</div>
        <div class="text-2xl font-black">{{ activeQuestion ? '答對就能獲得寶物' : '選擇一項寶物' }}</div>
        <div class="mt-1 text-sm font-bold text-white/60">
          {{ activeQuestion ? '看清楚題目再選答案，答對後會自動回到戰場。' : '先挑想要的寶物，再完成一題小挑戰。' }}
        </div>
        <div class="mt-2 inline-flex rounded-full bg-lime-300/15 px-3 py-1 text-xs font-black text-lime-200 ring-1 ring-lime-200/20">
          {{ quizSelectionLabel }}題庫
        </div>
      </div>

      <div v-if="!activeQuestion" class="grid gap-3 sm:grid-cols-3">
        <button
          v-for="(c, i) in choices"
          :key="c.id"
          type="button"
          class="flex min-h-44 flex-col items-center gap-2 rounded-2xl bg-white/5 p-5 text-center ring-1 ring-white/10 transition hover:scale-[1.03] hover:bg-white/10 hover:ring-amber-300/60 active:scale-95"
          @click="startQuestion(i)"
        >
          <span class="text-5xl">{{ c.emoji }}</span>
          <span class="text-lg font-black">{{ c.name }}</span>
          <span class="text-sm text-white/70">{{ c.desc }}</span>
          <span class="mt-auto rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-black">先答題</span>
        </button>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div class="flex items-center gap-3">
            <span class="text-4xl">{{ selectedChoice?.emoji }}</span>
            <div class="min-w-0">
              <div class="text-xs font-bold text-amber-200">挑戰寶物</div>
              <div class="text-xl font-black">{{ selectedChoice?.name }}</div>
              <div class="text-sm text-white/65">{{ selectedChoice?.desc }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl bg-slate-950/45 p-4 ring-1 ring-white/10">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">{{ activeQuestion.subject }}</span>
            <span class="text-xs font-bold text-white/45">{{ gradeInfo.shortLabel }}・{{ examInfo.label }}・{{ activeQuestion.skill ?? activeQuestion.id }}</span>
          </div>
          <div class="text-xl font-black leading-relaxed">{{ activeQuestion.prompt }}</div>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="(option, i) in activeQuestion.options"
            :key="option"
            type="button"
            class="min-h-14 rounded-2xl px-4 py-3 text-left text-base font-black ring-1 transition active:scale-[0.98]"
            :class="answerClass(i)"
            :disabled="feedback !== 'idle'"
            @click="answerQuestion(i)"
          >
            <span class="mr-2 text-white/45">{{ optionLabels[i] }}</span>{{ option }}
          </button>
        </div>

        <div
          v-if="feedback !== 'idle'"
          class="rounded-2xl p-4 text-sm font-bold ring-1"
          :class="feedback === 'correct' ? 'bg-lime-300/15 text-lime-100 ring-lime-200/30' : 'bg-rose-400/15 text-rose-100 ring-rose-200/30'"
        >
          <div class="text-base font-black">{{ feedback === 'correct' ? '答對了，寶物入手！' : '這題沒過，寶物先保留。' }}</div>
          <div class="mt-1 text-white/75">{{ activeQuestion.explanation }}</div>
          <div v-if="feedback === 'wrong'" class="mt-2 text-xs font-black text-rose-100/90">
            按「換一題再挑戰」就能重新爭取這個寶物。
          </div>
          <div v-if="feedback === 'correct'" class="mt-2 text-xs font-black text-amber-100/90">
            星光正在把寶物帶回戰場...
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="rounded-full bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15 active:scale-95"
            @click="backToChoices"
          >
            返回選寶物
          </button>
          <button
            v-if="feedback === 'wrong'"
            type="button"
            class="rounded-full bg-amber-300 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-200 active:scale-95"
            @click="retryQuestion"
          >
            換一題再挑戰
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { ChoiceView } from '../game/game';
import {
  getQuestionGradeInfo,
  getQuestionExamInfo,
  getQuizSelectionLabel,
  rollQuestion,
  type QuizSelection,
  type QuizQuestion,
} from '../game/question-bank';
import { sound } from '../game/sound';

const props = defineProps<{ level: number; choices: ChoiceView[]; quizSelection: QuizSelection }>();
const emit = defineEmits<{ (e: 'choose', index: number): void }>();

const optionLabels = ['A', 'B', 'C', 'D'];
const activeQuestion = ref<QuizQuestion | null>(null);
const selectedChoiceIndex = ref<number | null>(null);
const selectedAnswerIndex = ref<number | null>(null);
const feedback = ref<'idle' | 'wrong' | 'correct'>('idle');
let correctTimer: number | undefined;

const gradeInfo = computed(() => getQuestionGradeInfo(props.quizSelection.grade));
const examInfo = computed(() => getQuestionExamInfo(props.quizSelection.exam));
const quizSelectionLabel = computed(() => getQuizSelectionLabel(props.quizSelection));
const selectedChoice = computed(() => {
  if (selectedChoiceIndex.value === null) return undefined;
  return props.choices[selectedChoiceIndex.value];
});

watch(
  () => [props.level, props.quizSelection.publisher, props.quizSelection.grade, props.quizSelection.subject, props.quizSelection.exam],
  resetQuestion,
);

onBeforeUnmount(() => {
  if (correctTimer !== undefined) window.clearTimeout(correctTimer);
});

function startQuestion(index: number) {
  sound.uiTap();
  selectedChoiceIndex.value = index;
  activeQuestion.value = rollQuestion(props.quizSelection);
  selectedAnswerIndex.value = null;
  feedback.value = 'idle';
}

function answerQuestion(index: number) {
  if (!activeQuestion.value || selectedChoiceIndex.value === null || feedback.value !== 'idle') return;
  selectedAnswerIndex.value = index;
  if (index !== activeQuestion.value.answerIndex) {
    feedback.value = 'wrong';
    sound.quizWrong();
    return;
  }

  feedback.value = 'correct';
  sound.quizCorrect();
  correctTimer = window.setTimeout(() => {
    if (selectedChoiceIndex.value !== null) emit('choose', selectedChoiceIndex.value);
  }, 900);
}

function retryQuestion() {
  sound.uiTap();
  activeQuestion.value = rollQuestion(props.quizSelection);
  selectedAnswerIndex.value = null;
  feedback.value = 'idle';
}

function backToChoices() {
  sound.uiTap();
  resetQuestion();
}

function resetQuestion() {
  if (correctTimer !== undefined) window.clearTimeout(correctTimer);
  correctTimer = undefined;
  activeQuestion.value = null;
  selectedChoiceIndex.value = null;
  selectedAnswerIndex.value = null;
  feedback.value = 'idle';
}

function answerClass(index: number) {
  if (!activeQuestion.value) return '';
  if (feedback.value === 'correct' && index === activeQuestion.value.answerIndex) {
    return 'bg-lime-300 text-slate-950 ring-lime-100';
  }
  if (feedback.value === 'wrong' && selectedAnswerIndex.value === index) {
    return 'bg-rose-400 text-white ring-rose-200';
  }
  if (feedback.value === 'wrong' && index === activeQuestion.value.answerIndex) {
    return 'bg-lime-300/20 text-lime-100 ring-lime-200/40';
  }
  return 'bg-white/5 text-white ring-white/10 hover:bg-white/10 hover:ring-cyan-200/50';
}
</script>
