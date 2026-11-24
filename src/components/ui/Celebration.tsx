"use client";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { sound } from "@/lib/sound";
import { useApp } from "@/lib/store";
import { currentStreak, medalFor } from "@/lib/stats";
import type { MemberId } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Medal3D, TIER_INFO } from "./Medal3D";

export function Celebration() {
  const match = useApp((s) => s.celebration);
  const matches = useApp((s) => s.matches);
  const settings = useApp((s) => s.settings);
  const dismiss = useApp((s) => s.dismissCelebration);

  const info = useMemo(() => {
    if (!match) return null;
    const tier = medalFor(match, matches);
    const winner = match.winner;
    const loser: MemberId | null = winner === "draw" ? null : winner === "son" ? match.opponent : "son";
    const streak = winner === "draw" ? 0 : currentStreak(matches, winner, match.date);
    const act = settings.activities.find((a) => a.id === match.activityId);
    return { tier, winner, loser, streak, act };
  }, [match, matches, settings.activities]);

  useEffect(() => {
    if (!info) return;
    if (info.winner === "draw") {
      sound.tada();
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors: ["#4f9dff", "#ff7eb6", "#ffd166"] });
      return;
    }
    sound.fanfare();
    const color = settings.members[info.winner].color;
    const colors = [color, "#ffd166", "#ffffff", "#ff7eb6", "#7fd858"];
    const end = Date.now() + 1600;
    confetti({ particleCount: 160, spread: 120, startVelocity: 45, origin: { y: 0.55 }, colors, scalar: 1.2 });
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    if (info.loser) setTimeout(() => sound.wahwah(), 1700);
  }, [info, settings.members]);

  const m = settings.members;
  return (
    <AnimatePresence>
      {match && info && (
        <motion.div
          key={match.id}
          className="fixed inset-0 z-[60] grid place-items-center bg-[#1b2a4a]/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          {/* tia sáng xoay phía sau */}
          <div className="sunburst pointer-events-none absolute h-[900px] w-[900px] opacity-60" />
          <motion.div
            className="relative mt-24 flex max-h-[calc(100dvh-7rem)] w-full max-w-[560px] flex-col items-center rounded-[40px] bg-white px-6 pb-7 pt-4 text-center shadow-2xl ring-8 ring-white/60"
            initial={{ scale: 0.4, y: 80, rotate: -6 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.6, y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            {info.winner === "draw" ? (
              <>
                <div className="mt-6 text-[96px] leading-none">🤝</div>
                <h2 className="mt-3 text-4xl font-black text-[#2b2d42]">Hòa rồi!</h2>
                <p className="mt-1 text-lg font-semibold text-[#6b6f86]">Cả hai đều giỏi quá!</p>
                <div className="mt-5 flex items-end gap-6">
                  <Avatar who="son" color={m.son.color} size={96} mood="happy" bounce />
                  <Avatar who={match.opponent} color={m[match.opponent].color} size={96} mood="happy" bounce />
                </div>
              </>
            ) : (
              <>
                {info.tier && (
                  <div className="-mb-3 -mt-40">
                    <Medal3D tier={info.tier} ribbon={m[info.winner].color} size={280} />
                  </div>
                )}
                <motion.h2
                  className="-mt-2 text-[40px] font-black leading-tight"
                  style={{ color: m[info.winner].color, textShadow: "0 3px 0 rgba(0,0,0,.08)" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.25, 1] }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  {m[info.winner].name} thắng rồi! 🎉
                </motion.h2>
                {info.tier && (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-base font-bold text-[#6b6f86]">
                    <span className="rounded-full bg-[#fff6dc] px-3 py-1 text-[#b07800]">
                      {TIER_INFO[info.tier].emoji} {TIER_INFO[info.tier].name}
                    </span>
                    {info.streak >= 2 && <span className="rounded-full bg-[#ffe9e0] px-3 py-1 text-[#e0542a]">🔥 Chuỗi {info.streak} ngày</span>}
                    {info.act && (
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[#3f66c4]">
                        {info.act.emoji} {info.act.name}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-5 flex items-end justify-center gap-8">
                  <div className="flex flex-col items-center">
                    <Avatar who={info.winner} color={m[info.winner].color} size={104} mood="happy" bounce crown />
                    <span className="mt-1 text-lg font-extrabold text-[#2b2d42]">{m[info.winner].name}</span>
                  </div>
                  {info.loser && (
                    <div className="flex flex-col items-center opacity-90">
                      <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 1.6, repeat: Infinity }}>
                        <Avatar who={info.loser} color={m[info.loser].color} size={72} mood="sad" />
                      </motion.div>
                      <span className="mt-1 text-base font-bold text-[#8a8ea6]">{m[info.loser].name}</span>
                      {settings.consolationStar && (
                        <motion.span
                          className="mt-1 rounded-full bg-[#fff6dc] px-2 py-0.5 text-sm font-bold text-[#b07800]"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 2 }}
                        >
                          +⭐ cố gắng
                        </motion.span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={dismiss}
              className="btn-3d mt-7 rounded-full bg-[#ffb703] px-10 py-4 text-2xl font-black text-white"
              style={{ ["--btn-shadow" as string]: "#d98e00" }}
            >
              Tuyệt vời! 👏
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
