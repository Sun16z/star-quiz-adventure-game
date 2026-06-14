<template>
  <div class="absolute inset-0 overflow-auto bg-gradient-to-b from-[#0b1020] to-[#161f38] text-white">
    <!-- 返回首頁 -->
    <button
      class="absolute left-3 top-3 z-10 rounded-full bg-white/10 px-4 py-1 text-sm font-black backdrop-blur-md transition hover:bg-white/20 active:scale-95"
      @click="emit('home')"
    >
      ← 首頁
    </button>

    <!-- Debug 開關 -->
    <div class="absolute right-3 top-3 z-10 flex items-center gap-2">
      <button
        class="rounded-full px-3 py-1 text-xs font-black transition"
        :class="debug ? 'bg-lime-400 text-black' : 'bg-white/10 text-white/60'"
        @click="toggleDebug"
      >
        🛠 Debug {{ debug ? 'ON' : 'OFF' }}
      </button>
      <button
        v-if="debug"
        class="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-black"
        @click="emit('add-gold', 1000)"
      >
        +1000💰
      </button>
    </div>

    <div class="mx-auto flex max-w-5xl flex-col gap-6 p-6 pb-28">
      <!-- 標題 -->
      <div class="pt-4 text-center">
        <div class="text-5xl font-black tracking-wider">星願問答大冒險</div>
        <div class="mt-1 text-sm text-white/60">公主闖關前先答題・答對才能拿寶物</div>
        <div class="mt-3 inline-block rounded-full bg-amber-400/90 px-5 py-1 text-lg font-black text-black">
          💰 {{ meta.gold }}
        </div>
      </div>

      <!-- 題庫 -->
      <div>
        <div class="mb-2 text-lg font-black">選擇出版社</div>
        <div class="mb-4 grid grid-cols-3 gap-2">
          <button
            v-for="publisher in questionPublishers"
            :key="publisher.id"
            type="button"
            class="min-h-20 rounded-xl p-3 text-left ring-2 transition active:scale-[0.98]"
            :class="quizPublisher === publisher.id ? 'bg-fuchsia-300/20 ring-fuchsia-200' : 'bg-white/5 ring-white/10 hover:ring-white/30'"
            @click="selectQuizPublisher(publisher.id)"
          >
            <div class="text-2xl">{{ publisher.icon }}</div>
            <div class="mt-1 text-base font-black">{{ publisher.label }}</div>
            <div class="text-[0.68rem] leading-snug text-white/55">{{ publisher.desc }}</div>
          </button>
        </div>

        <div class="mb-2 text-lg font-black">選擇年級學期</div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <button
            v-for="g in questionGrades"
            :key="g.id"
            type="button"
            class="min-h-28 rounded-xl p-3 text-left ring-2 transition active:scale-[0.98]"
            :class="quizGrade === g.id ? 'bg-lime-400/20 ring-lime-300' : 'bg-white/5 ring-white/10 hover:ring-white/30'"
            @click="selectQuizGrade(g.id)"
          >
            <div class="text-xl font-black text-lime-200">{{ g.shortLabel }}</div>
            <div class="mt-1 text-xs font-black leading-tight">{{ g.label }}</div>
            <div class="mt-1 text-[0.68rem] leading-snug text-white/60">{{ g.desc }}</div>
          </button>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div class="mb-2 text-sm font-black text-white/75">選擇科目</div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                v-for="subject in questionSubjects"
                :key="subject.id"
                type="button"
                class="min-h-20 rounded-xl p-3 text-left ring-2 transition active:scale-[0.98]"
                :class="quizSubject === subject.id ? 'bg-cyan-300/20 ring-cyan-200' : 'bg-white/5 ring-white/10 hover:ring-white/30'"
                @click="selectQuizSubject(subject.id)"
              >
                <div class="text-2xl">{{ subject.icon }}</div>
                <div class="mt-1 text-base font-black">{{ subject.label }}</div>
                <div class="text-[0.68rem] leading-snug text-white/55">{{ subject.desc }}</div>
              </button>
            </div>
          </div>

          <div>
            <div class="mb-2 text-sm font-black text-white/75">選擇考次</div>
            <div class="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button
                v-for="exam in questionExams"
                :key="exam.id"
                type="button"
                class="min-h-20 rounded-xl p-3 text-left ring-2 transition active:scale-[0.98]"
                :class="quizExam === exam.id ? 'bg-amber-300/20 ring-amber-200' : 'bg-white/5 ring-white/10 hover:ring-white/30'"
                @click="selectQuizExam(exam.id)"
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{{ exam.icon }}</span>
                  <span class="text-base font-black">{{ exam.label }}</span>
                </div>
                <div class="mt-1 text-[0.68rem] leading-snug text-white/55">{{ exam.desc }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色 -->
      <div>
        <div class="mb-2 text-lg font-black">選擇角色</div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            v-for="c in characters"
            :key="c.id"
            class="flex cursor-pointer flex-col items-center gap-1 rounded-2xl p-3 text-center ring-2 transition"
            :class="cardClass(c.id)"
            @click="onCard(c)"
          >
            <div class="relative h-36 w-36">
              <canvas
                :ref="(el) => setCanvas(c.id, el)"
                class="h-36 w-36 rounded-xl ring-1 ring-white/10"
                width="384"
                height="384"
              />
              <span
                v-if="!ready[c.id]"
                class="absolute inset-0 flex items-center justify-center text-5xl"
              >
                {{ c.emoji }}
              </span>
            </div>
            <span class="font-black">{{ c.name }}</span>
            <span class="text-[0.72rem] font-bold leading-tight text-amber-200/80">{{ c.trait }}</span>
            <span class="text-[0.66rem] leading-snug text-white/55">{{ c.desc }}</span>
            <span
              v-if="!isUnlocked(c.id)"
              class="mt-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-black"
              :class="{ 'opacity-40': meta.gold < c.cost }"
            >
              解鎖 💰{{ c.cost }}
            </span>
          </div>
        </div>
      </div>

      <!-- 商店 -->
      <div>
        <div class="mb-2 text-lg font-black">永久強化</div>
        <div class="flex flex-col gap-2">
          <div
            v-for="p in perma"
            :key="p.id"
            class="flex items-center gap-3 rounded-2xl bg-white/5 p-3"
          >
            <span class="text-2xl">{{ p.emoji }}</span>
            <div class="flex-1">
              <div class="font-black">{{ p.name }} <span class="text-white/50">{{ level(p.id) }}/{{ p.maxLevel }}</span></div>
              <div class="text-xs text-white/60">{{ p.desc }}</div>
            </div>
            <button
              class="rounded-full px-4 py-2 text-sm font-black transition"
              :class="buyClass(p)"
              :disabled="!canBuy(p)"
              @click="emit('buy', p.id)"
            >
              {{ level(p.id) >= p.maxLevel ? '已滿' : `💰${cost(p)}` }}
            </button>
          </div>
        </div>
      </div>

      <!-- 開始 -->
      <button
        class="mt-2 w-full rounded-full bg-amber-400 py-4 text-2xl font-black text-black shadow-lg transition hover:bg-amber-300 active:scale-95"
        @click="emit('start', selectedId, quizSelection)"
      >
        ▶ 開始（{{ selectedName }}・{{ selectedQuizLabel }}）
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { CHARACTERS, getCharacter, type Character } from '../game/characters';
import { PERMA, permaCost, type MetaData, type PermaUpgrade } from '../game/meta';
import { setupCharacterPreview, type PreviewHandle } from '../game/character-previews';
import {
  DEFAULT_QUESTION_GRADE,
  DEFAULT_QUESTION_PUBLISHER,
  DEFAULT_QUIZ_SELECTION,
  QUESTION_EXAMS,
  QUESTION_GRADES,
  QUESTION_PUBLISHERS,
  QUESTION_SUBJECTS,
  getQuizSelectionLabel,
  isQuestionExam,
  isQuestionGrade,
  isQuestionPublisher,
  isQuestionSubject,
  type QuestionExam,
  type QuestionGrade,
  type QuestionPublisher,
  type QuizSubject,
  type QuizSelection,
} from '../game/question-bank';

const props = defineProps<{ meta: MetaData }>();
const emit = defineEmits<{
  (e: 'start', characterId: string, quizSelection: QuizSelection): void;
  (e: 'buy', permaId: string): void;
  (e: 'unlock', characterId: string): void;
  (e: 'add-gold', amount: number): void;
  (e: 'home'): void;
}>();

const characters = CHARACTERS;
const perma = PERMA;
const selectedId = ref('matt');
const QUIZ_PUBLISHER_KEY = 'animal-survivors:quiz-publisher';
const QUIZ_GRADE_KEY = 'animal-survivors:quiz-grade';
const QUIZ_SUBJECT_KEY = 'animal-survivors:quiz-subject';
const QUIZ_EXAM_KEY = 'animal-survivors:quiz-exam';
const savedQuizPublisher = localStorage.getItem(QUIZ_PUBLISHER_KEY) ?? '';
const savedQuizGrade = localStorage.getItem(QUIZ_GRADE_KEY) ?? '';
const savedQuizSubject = localStorage.getItem(QUIZ_SUBJECT_KEY) ?? '';
const savedQuizExam = localStorage.getItem(QUIZ_EXAM_KEY) ?? '';
const quizPublisher = ref<QuestionPublisher>(isQuestionPublisher(savedQuizPublisher) ? savedQuizPublisher : DEFAULT_QUESTION_PUBLISHER);
const quizGrade = ref<QuestionGrade>(isQuestionGrade(savedQuizGrade) ? savedQuizGrade : DEFAULT_QUESTION_GRADE);
const quizSubject = ref<QuizSubject>(isQuestionSubject(savedQuizSubject) ? savedQuizSubject : DEFAULT_QUIZ_SELECTION.subject);
const quizExam = ref<QuestionExam>(isQuestionExam(savedQuizExam) ? savedQuizExam : DEFAULT_QUIZ_SELECTION.exam);
const questionPublishers = QUESTION_PUBLISHERS;
const questionGrades = QUESTION_GRADES;
const questionSubjects = QUESTION_SUBJECTS;
const questionExams = QUESTION_EXAMS;
const quizSelection = computed<QuizSelection>(() => ({
  publisher: quizPublisher.value,
  grade: quizGrade.value,
  subject: quizSubject.value,
  exam: quizExam.value,
}));
const selectedQuizLabel = computed(() => getQuizSelectionLabel(quizSelection.value));

function selectQuizPublisher(id: QuestionPublisher) {
  quizPublisher.value = id;
  localStorage.setItem(QUIZ_PUBLISHER_KEY, id);
}

function selectQuizGrade(id: QuestionGrade) {
  quizGrade.value = id;
  localStorage.setItem(QUIZ_GRADE_KEY, id);
}

function selectQuizSubject(id: QuizSubject) {
  quizSubject.value = id;
  localStorage.setItem(QUIZ_SUBJECT_KEY, id);
}

function selectQuizExam(id: QuestionExam) {
  quizExam.value = id;
  localStorage.setItem(QUIZ_EXAM_KEY, id);
}

/** 角色即時 3D 預覽：每張卡一個引擎，播 idle 並旋轉；就緒前以 emoji 替代 */
const ready = ref<Record<string, boolean>>({});
const canvases = new Map<string, HTMLCanvasElement>();
const handles: PreviewHandle[] = [];
function setCanvas(id: string, el: unknown) {
  if (el instanceof HTMLCanvasElement) canvases.set(id, el);
}
onMounted(async () => {
  await nextTick();
  for (const c of CHARACTERS) {
    const canvas = canvases.get(c.id);
    if (!canvas) continue;
    const h = await setupCharacterPreview(canvas, c.model, c.princessStyle);
    if (h) {
      handles.push(h);
      ready.value = { ...ready.value, [c.id]: true };
    }
  }
});
onBeforeUnmount(() => {
  for (const h of handles) h.dispose();
});

const DEBUG_KEY = 'animal-survivors:debug';
const debug = ref(localStorage.getItem(DEBUG_KEY) === '1');
function toggleDebug() {
  /** 開啟需通過驗證；關閉不需要 */
  if (!debug.value) {
    const answer = window.prompt('請問作者的全名（三個字）？');
    if (answer === null) return;
    if (answer.trim() !== '黃國書') {
      window.alert('答錯了，無法開啟 Debug');
      return;
    }
  }
  debug.value = !debug.value;
  localStorage.setItem(DEBUG_KEY, debug.value ? '1' : '0');
}

const selectedName = computed(() => getCharacter(selectedId.value).name);

function isUnlocked(id: string) {
  return debug.value || props.meta.unlocked.includes(id) || getCharacter(id).cost === 0;
}
function level(id: string) {
  return props.meta.perma[id] ?? 0;
}
function cost(p: PermaUpgrade) {
  return permaCost(p, level(p.id));
}
function canBuy(p: PermaUpgrade) {
  return level(p.id) < p.maxLevel && props.meta.gold >= cost(p);
}
function buyClass(p: PermaUpgrade) {
  return canBuy(p) ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white/10 text-white/40';
}
function cardClass(id: string) {
  if (selectedId.value === id) return 'bg-amber-400/20 ring-amber-300';
  if (isUnlocked(id)) return 'bg-white/5 ring-white/10 hover:ring-white/30';
  return 'bg-black/30 ring-white/5 opacity-80';
}
function onCard(c: Character) {
  if (isUnlocked(c.id)) {
    selectedId.value = c.id;
  } else if (props.meta.gold >= c.cost) {
    emit('unlock', c.id);
    selectedId.value = c.id;
  }
}
</script>
