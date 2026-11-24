"use client";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { addDays, dayWinner, groupByDate, medalFor, parseDate, shortDate, todayStr, weekStart, weekdayLabel } from "@/lib/stats";
import type { MedalTier } from "@/lib/types";
import { TIER_INFO } from "../ui/Medal3D";

const WEEKS = 5;
const TIER_RANK: Record<MedalTier, number> = { gold: 3, silver: 2, bronze: 1 };

/** Con đường gạch màu: mỗi viên gạch là một ngày, màu theo người thắng */
export function Road() {
  const matches = useApp((s) => s.matches);
  const settings = useApp((s) => s.settings);
  const deleteMatch = useApp((s) => s.deleteMatch);
  const requirePin = useApp((s) => s.requirePin);
  const [page, setPage] = useState(0);
  const today = todayStr();
  const [selected, setSelected] = useState<string>(today);
  const byDate = useMemo(() => groupByDate(matches), [matches]);
  const m = settings.members;

  const start = addDays(weekStart(today), -7 * (WEEKS - 1 + page * WEEKS));
  const weeks = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  const month = parseDate(weeks[WEEKS - 1][6]);
  const dayList = byDate.get(selected) ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setPage((p) => p + 1)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f2f3f7]" aria-label="Trước">
          <ChevronLeft strokeWidth={3} />
        </button>
        <span className="text-lg font-black text-[#2b2d42]">
          Tháng {month.getMonth() + 1}/{month.getFullYear()}
        </span>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="grid h-10 w-10 place-items-center rounded-full bg-[#f2f3f7] disabled:opacity-30" aria-label="Sau">
          <ChevronRight strokeWidth={3} />
        </button>
      </div>

      <div className="rounded-3xl bg-[#e8f6dc] p-3">
        <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-xs font-black text-[#6c9a52]">
          {weeks[0].map((d) => (
            <span key={d}>{weekdayLabel(d)}</span>
          ))}
        </div>
        <div className="space-y-1.5">
          {weeks.map((row, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {row.map((d, di) => {
                const list = byDate.get(d) ?? [];
                const w = dayWinner(list);
                const future = d > today;
                const color = w && w !== "draw" ? m[w].color : w === "draw" ? "#c7cbe0" : "#ffffff";
                const best = list
                  .filter((x) => x.winner === w)
                  .map((x) => medalFor(x, matches))
                  .filter((t): t is MedalTier => !!t)
                  .sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0];
                return (
                  <motion.button
                    key={d}
                    disabled={future}
                    onClick={() => setSelected(d)}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: (wi * 7 + di) * 0.012, type: "spring", stiffness: 400, damping: 18 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.88 }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-black ${future ? "opacity-30" : ""} ${selected === d ? "ring-4 ring-[#ffb703]" : ""}`}
                    style={{
                      background: color,
                      color: w && w !== "draw" ? "#fff" : "#9aa0b8",
                      boxShadow: `0 4px 0 ${w ? "rgba(0,0,0,.15)" : "#d6e8c8"}`,
                    }}
                  >
                    {best ? <span className="text-xl leading-none">{TIER_INFO[best].emoji}</span> : w === "draw" ? <span className="text-lg">🤝</span> : null}
                    <span className={best || w === "draw" ? "text-[10px] leading-none" : ""}>{parseDate(d).getDate()}</span>
                    {d === today && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#ff4f6d] ring-2 ring-white" />}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm font-bold text-[#557a40]">
          {(["son", "dad", "mom"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded" style={{ background: m[k].color }} />
              {m[k].name} thắng
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
          <div className="mb-2 text-base font-black text-[#2b2d42]">
            📅 {weekdayLabel(selected)}, {shortDate(selected)}
          </div>
          {dayList.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f8fb] p-4 text-center font-bold text-[#a0a4b8]">Ngày này chưa có trận nào 💤</div>
          ) : (
            <div className="space-y-2">
              {dayList.map((x) => {
                const a = settings.activities.find((y) => y.id === x.activityId);
                const tier = medalFor(x, matches);
                return (
                  <div key={x.id} className="flex items-center gap-3 rounded-2xl bg-[#f7f8fb] p-3">
                    <span className="text-3xl">{a?.emoji ?? "❓"}</span>
                    <div className="flex-1">
                      <div className="font-black text-[#2b2d42]">
                        {a?.name ?? "Môn đã xoá"} · {m.son.name} 🆚 {m[x.opponent].name}
                      </div>
                      <div className="text-sm font-bold" style={{ color: x.winner === "draw" ? "#8a8ea6" : m[x.winner].color }}>
                        {x.winner === "draw" ? "🤝 Hòa" : `🏆 ${m[x.winner].name} thắng ${tier ? TIER_INFO[tier].emoji : ""}`}
                      </div>
                      {x.note && <div className="text-sm font-semibold text-[#6b6f86]">“{x.note}”</div>}
                    </div>
                    <button
                      onClick={async () => {
                        if (await requirePin()) deleteMatch(x.id);
                      }}
                      className="grid h-10 w-10 place-items-center rounded-full text-[#c0c4d4] hover:bg-[#ffe5e5] hover:text-[#e5484d]"
                      aria-label="Xoá trận"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
