/** 排行榜紀錄（存於 localStorage，依存活時間排序） */
export interface RunRecord {
  character: string;
  time: number;
  kills: number;
  level: number;
  gold: number;
  won: boolean;
  /** 紀錄時間（毫秒），由呼叫端帶入 */
  at: number;
}

const KEY = 'animal-survivors:leaderboard:v1';
const MAX = 10;

export function loadRecords(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as RunRecord[];
  } catch {
    /* 忽略損毀資料 */
  }
  return [];
}

/** 本機累積統計（純前端，無後端故為此裝置統計） */
export interface GlobalStats {
  plays: number;
  totalTime: number;
  totalKills: number;
}

const STATS_KEY = 'animal-survivors:stats:v1';

export function loadStats(): GlobalStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<GlobalStats>;
      return { plays: d.plays ?? 0, totalTime: d.totalTime ?? 0, totalKills: d.totalKills ?? 0 };
    }
  } catch {
    /* 忽略損毀資料 */
  }
  return { plays: 0, totalTime: 0, totalKills: 0 };
}

/** 累加一場遊戲統計並回傳更新後的值 */
export function recordStats(time: number, kills: number): GlobalStats {
  const s = loadStats();
  s.plays += 1;
  s.totalTime += time;
  s.totalKills += kills;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* 忽略寫入失敗 */
  }
  return s;
}

/** 新增一筆並回傳更新後（依存活時間遞減、取前 MAX）的排行榜 */
export function addRecord(record: RunRecord): RunRecord[] {
  const list = loadRecords();
  list.push(record);
  list.sort((a, b) => b.time - a.time);
  const trimmed = list.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* 忽略寫入失敗 */
  }
  return trimmed;
}
