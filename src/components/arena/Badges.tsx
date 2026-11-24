"use client";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { computeBadges } from "@/lib/stats";

export function Badges() {
  const matches = useApp((s) => s.matches);
  const badges = useMemo(() => computeBadges(matches), [matches]);
  const got = badges.filter((b) => b.unlocked).length;
  return (
    <div>
      <div className="mb-4 rounded-3xl bg-gradient-to-r from-[#e9e2ff] to-[#dff3ff] p-4 text-center">
        <div className="text-4xl font-black text-[#5a3fd0]">
          {got}
          <span className="text-2xl text-[#9a8ad8]">/{badges.length}</span>
        </div>
        <div className="font-bold text-[#6b6f86]">huy hiệu đã mở khoá</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 15 }}
            whileHover={b.unlocked ? { rotate: [0, -8, 8, 0], scale: 1.08 } : undefined}
            className={`flex flex-col items-center rounded-3xl p-3 text-center ${b.unlocked ? "bg-[#fff8e3] shadow-[0_5px_0_#f3dca0]" : "bg-[#f2f3f7]"}`}
          >
            <div className={`relative grid h-16 w-16 place-items-center rounded-full text-4xl ${b.unlocked ? "badge-shine bg-gradient-to-br from-[#ffe28a] to-[#ffb703]" : "bg-[#e1e4ec] grayscale"}`}>
              <span className={b.unlocked ? "" : "opacity-30"}>{b.emoji}</span>
              {!b.unlocked && <span className="absolute -bottom-1 -right-1 text-lg">🔒</span>}
            </div>
            <div className={`mt-2 text-sm font-black leading-tight ${b.unlocked ? "text-[#2b2d42]" : "text-[#a0a4b8]"}`}>{b.name}</div>
            <div className="mt-0.5 text-[11px] font-semibold leading-tight text-[#8a8ea6]">{b.hint}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
