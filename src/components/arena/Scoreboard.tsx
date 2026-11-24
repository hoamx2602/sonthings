"use client";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { currentStreak, headToHead, medalCounts, shortDate, weeklyWins } from "@/lib/stats";
import type { MemberId, Opponent } from "@/lib/types";
import { Avatar } from "../ui/Avatar";

export function Scoreboard() {
  const matches = useApp((s) => s.matches);
  const settings = useApp((s) => s.settings);
  const m = settings.members;
  const week = useMemo(() => weeklyWins(matches), [matches]);
  const medals = useMemo(() => medalCounts(matches), [matches]);
  const maxWeek = Math.max(1, ...Object.values(week.wins));

  return (
    <div className="space-y-5">
      {/* Vua của tuần */}
      <div className="rounded-3xl bg-gradient-to-br from-[#fff3c9] to-[#ffe0ec] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-lg font-black text-[#7a5a00]">👑 Vua tuần này</span>
          <span className="text-sm font-bold text-[#a0864a]">
            {shortDate(week.start)} – {shortDate(week.end)}
          </span>
        </div>
        <div className="space-y-2.5">
          {week.ranking.map((who, i) => (
            <div key={who} className="flex items-center gap-3">
              <span className="w-6 text-center text-xl font-black text-[#a0864a]">{i + 1}</span>
              <Avatar who={who} color={m[who].color} size={44} crown={week.king === who} mood={week.king === who ? "happy" : "neutral"} />
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded-full bg-white/70">
                  <motion.div className="h-full rounded-full" style={{ background: m[who].color }} initial={{ width: 0 }} animate={{ width: `${(week.wins[who] / maxWeek) * 100}%` }} transition={{ delay: 0.1 * i, type: "spring", stiffness: 80 }} />
                </div>
              </div>
              <span className="w-8 text-right text-xl font-black text-[#2b2d42]">{week.wins[who]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kéo co */}
      {(["dad", "mom"] as Opponent[]).map((o) => (
        <TugOfWar key={o} opp={o} />
      ))}

      {/* Tủ huy chương */}
      <div className="rounded-3xl bg-[#f7f8fb] p-4">
        <div className="mb-3 text-lg font-black text-[#2b2d42]">🏅 Tủ huy chương</div>
        <div className="space-y-3">
          {(["son", "dad", "mom"] as MemberId[]).map((who) => {
            const c = medals[who];
            const streak = currentStreak(matches, who);
            return (
              <div key={who} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <Avatar who={who} color={m[who].color} size={48} />
                <div className="flex-1">
                  <div className="text-lg font-black text-[#2b2d42]">{m[who].name}</div>
                  {streak > 0 && <div className="text-sm font-bold text-[#e0542a]">🔥 chuỗi {streak} ngày</div>}
                </div>
                <div className="flex gap-2 text-lg font-black">
                  <MedalPill emoji="🥇" n={c.gold} />
                  <MedalPill emoji="🥈" n={c.silver} />
                  <MedalPill emoji="🥉" n={c.bronze} />
                  {settings.consolationStar && <MedalPill emoji="⭐" n={c.stars} />}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm font-semibold text-[#8a8ea6]">Thắng liên tiếp 3 ngày được 🥈, 7 ngày được 🥇!</p>
      </div>
    </div>
  );
}

function MedalPill({ emoji, n }: { emoji: string; n: number }) {
  return (
    <span className={`flex flex-col items-center leading-none ${n ? "" : "opacity-30 grayscale"}`}>
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm text-[#2b2d42]">{n}</span>
    </span>
  );
}

function TugOfWar({ opp }: { opp: Opponent }) {
  const matches = useApp((s) => s.matches);
  const m = useApp((s) => s.settings.members);
  const h = useMemo(() => headToHead(matches, opp), [matches, opp]);
  const total = h.son + h.opp;
  const share = total ? h.son / total : 0.5;
  const leader = h.son > h.opp ? "son" : h.opp > h.son ? opp : null;
  return (
    <div className="rounded-3xl bg-[#f7f8fb] p-4">
      <div className="mb-2 text-center text-sm font-black uppercase tracking-wider text-[#8a8ea6]">
        {m.son.name} 🆚 {m[opp].name} {h.draw > 0 && <span className="normal-case">· {h.draw} hòa</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <Avatar who="son" color={m.son.color} size={56} mood={leader === "son" ? "happy" : leader ? "sad" : "neutral"} bounce={leader === "son"} />
          <span className="text-3xl font-black" style={{ color: m.son.color }}>
            {h.son}
          </span>
        </div>
        <div className="relative h-8 flex-1 overflow-hidden rounded-full" style={{ background: m[opp].color }}>
          <motion.div className="absolute inset-y-0 left-0 rounded-r-full" style={{ background: m.son.color }} initial={{ width: "50%" }} animate={{ width: `${share * 100}%` }} transition={{ type: "spring", stiffness: 60, damping: 10 }} />
          <motion.div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl" initial={{ left: "50%" }} animate={{ left: `${share * 100}%` }} transition={{ type: "spring", stiffness: 60, damping: 10 }}>
            🎀
          </motion.div>
        </div>
        <div className="flex flex-col items-center">
          <Avatar who={opp} color={m[opp].color} size={56} mood={leader === opp ? "happy" : leader ? "sad" : "neutral"} bounce={leader === opp} />
          <span className="text-3xl font-black" style={{ color: m[opp].color }}>
            {h.opp}
          </span>
        </div>
      </div>
    </div>
  );
}
