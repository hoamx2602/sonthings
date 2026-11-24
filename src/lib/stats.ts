import type { Match, MedalTier, MemberId, Opponent } from "./types";

// ---------- Ngày tháng (theo giờ địa phương) ----------
const pad = (n: number) => String(n).padStart(2, "0");
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDateStr(new Date());
export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s: string, n: number) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
export function weekStart(s: string) {
  const d = parseDate(s);
  const dow = (d.getDay() + 6) % 7; // Thứ 2 = 0
  d.setDate(d.getDate() - dow);
  return toDateStr(d);
}
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const weekdayLabel = (s: string) => WEEKDAYS[parseDate(s).getDay()];
export const shortDate = (s: string) => {
  const d = parseDate(s);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ---------- Huy chương & chuỗi thắng ----------
const MEMBERS: MemberId[] = ["son", "dad", "mom"];

function winDates(matches: Match[], who: MemberId) {
  return new Set(matches.filter((m) => m.winner === who).map((m) => m.date));
}

function streakEndingAt(dates: Set<string>, day: string) {
  let n = 0;
  let d = day;
  while (dates.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export const tierForStreak = (streak: number): MedalTier =>
  streak >= 7 ? "gold" : streak >= 3 ? "silver" : "bronze";

/** Huy chương của 1 trận: tính theo chuỗi ngày thắng liên tiếp của người thắng tính tới ngày đó */
export function medalFor(match: Match, all: Match[]): MedalTier | null {
  if (match.winner === "draw") return null;
  return tierForStreak(streakEndingAt(winDates(all, match.winner), match.date));
}

/** Chuỗi hiện tại: vẫn "còn sống" nếu hôm nay chưa thi nhưng hôm qua thắng */
export function currentStreak(matches: Match[], who: MemberId, today = todayStr()) {
  const dates = winDates(matches, who);
  return dates.has(today) ? streakEndingAt(dates, today) : streakEndingAt(dates, addDays(today, -1));
}

export function bestStreak(matches: Match[], who: MemberId) {
  const dates = winDates(matches, who);
  let best = 0;
  for (const start of dates) {
    if (dates.has(addDays(start, -1))) continue; // không phải đầu chuỗi
    let n = 1;
    while (dates.has(addDays(start, n))) n++;
    best = Math.max(best, n);
  }
  return best;
}

export type MedalCount = Record<MedalTier, number> & { total: number; stars: number };

export function medalCounts(matches: Match[]): Record<MemberId, MedalCount> {
  const res = Object.fromEntries(
    MEMBERS.map((m) => [m, { bronze: 0, silver: 0, gold: 0, total: 0, stars: 0 }]),
  ) as Record<MemberId, MedalCount>;
  for (const m of matches) {
    const tier = medalFor(m, matches);
    if (tier && m.winner !== "draw") {
      res[m.winner][tier]++;
      res[m.winner].total++;
      const loser: MemberId = m.winner === "son" ? m.opponent : "son";
      res[loser].stars++;
    }
  }
  return res;
}

export function headToHead(matches: Match[], opp: Opponent) {
  const list = matches.filter((m) => m.opponent === opp);
  return {
    son: list.filter((m) => m.winner === "son").length,
    opp: list.filter((m) => m.winner === opp).length,
    draw: list.filter((m) => m.winner === "draw").length,
    total: list.length,
  };
}

export function weeklyWins(matches: Match[], today = todayStr()) {
  const start = weekStart(today);
  const end = addDays(start, 6);
  const wins: Record<MemberId, number> = { son: 0, dad: 0, mom: 0 };
  for (const m of matches) if (m.date >= start && m.date <= end && m.winner !== "draw") wins[m.winner]++;
  const ranking = [...MEMBERS].sort((a, b) => wins[b] - wins[a]);
  const king = wins[ranking[0]] > 0 && wins[ranking[0]] > wins[ranking[1]] ? ranking[0] : null;
  return { wins, ranking, king, start, end };
}

export function groupByDate(matches: Match[]) {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const arr = map.get(m.date) ?? [];
    arr.push(m);
    map.set(m.date, arr);
  }
  return map;
}

/** Người thắng của một ngày (nhiều trận thì ai thắng nhiều hơn) */
export function dayWinner(list: Match[]): MemberId | "draw" | null {
  if (!list.length) return null;
  const c: Record<string, number> = {};
  for (const m of list) c[m.winner] = (c[m.winner] ?? 0) + 1;
  const best = Object.entries(c)
    .filter(([k]) => k !== "draw")
    .sort((a, b) => b[1] - a[1]);
  if (!best.length || (best[1] && best[1][1] === best[0][1])) return "draw";
  return best[0][0] as MemberId;
}

// ---------- Huy hiệu ----------
export interface Badge {
  id: string;
  emoji: string;
  name: string;
  hint: string;
  unlocked: boolean;
}

export function computeBadges(matches: Match[]): Badge[] {
  const sonWins = matches.filter((m) => m.winner === "son");
  const byDate = groupByDate(sonWins);
  const doubleDay = [...byDate.values()].some((l) => l.some((m) => m.opponent === "dad") && l.some((m) => m.opponent === "mom"));
  const subjects = new Set(sonWins.map((m) => m.activityId));
  const best = bestStreak(matches, "son");

  let lossRun = 0;
  let comeback = false;
  for (const m of matches) {
    if (m.winner === "son") {
      if (lossRun >= 3) comeback = true;
      lossRun = 0;
    } else if (m.winner !== "draw") lossRun++;
  }

  const b = (id: string, emoji: string, name: string, hint: string, unlocked: boolean): Badge => ({ id, emoji, name, hint, unlocked });
  return [
    b("first_win", "🥇", "Chiến thắng đầu tiên", "Thắng trận đầu tiên", sonWins.length >= 1),
    b("beat_dad", "💪", "Hạ gục Bố", "Thắng Bố 1 trận", sonWins.some((m) => m.opponent === "dad")),
    b("beat_mom", "🌸", "Vượt mặt Mẹ", "Thắng Mẹ 1 trận", sonWins.some((m) => m.opponent === "mom")),
    b("streak_3", "🔥", "Chuỗi lửa", "Thắng 3 ngày liên tiếp", best >= 3),
    b("double", "⚡", "Song sát", "Thắng cả Bố và Mẹ trong 1 ngày", doubleDay),
    b("wins_10", "🔟", "Mười điểm", "Thắng 10 trận", sonWins.length >= 10),
    b("all_round", "🎯", "Toàn năng", "Thắng ở 5 môn khác nhau", subjects.size >= 5),
    b("comeback", "🦸", "Không bỏ cuộc", "Thắng ngay sau 3 trận thua", comeback),
    b("busy_bee", "🐝", "Ong chăm chỉ", "Thi đấu 20 trận", matches.length >= 20),
    b("streak_7", "🌈", "Tuần hoàn hảo", "Thắng 7 ngày liên tiếp", best >= 7),
    b("wins_30", "🏆", "Nhà vô địch", "Thắng 30 trận", sonWins.length >= 30),
    b("wins_100", "🚀", "Huyền thoại", "Thắng 100 trận", sonWins.length >= 100),
  ];
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
