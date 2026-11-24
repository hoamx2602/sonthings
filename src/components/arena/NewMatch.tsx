"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { medalFor, todayStr } from "@/lib/stats";
import type { Opponent, Winner } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { TIER_INFO } from "../ui/Medal3D";

const slide = {
  initial: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -dir * 60, opacity: 0 }),
};

export function NewMatch() {
  const settings = useApp((s) => s.settings);
  const matches = useApp((s) => s.matches);
  const addMatch = useApp((s) => s.addMatch);
  const requirePin = useApp((s) => s.requirePin);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [opponent, setOpponent] = useState<Opponent>("dad");
  const [activityId, setActivityId] = useState<string>("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const m = settings.members;

  const go = (s: number) => {
    setDir(s > step ? 1 : -1);
    setStep(s);
  };

  const pickWinner = async (winner: Winner) => {
    if (saving) return;
    if (!(await requirePin())) return;
    setSaving(true);
    try {
      await addMatch({ date, opponent, activityId, winner, note: note.trim() || null });
      setNote("");
      setDate(todayStr());
      go(0);
    } catch {
      /* lỗi đã hiện ở thanh thông báo */
    } finally {
      setSaving(false);
    }
  };

  const today = matches.filter((x) => x.date === todayStr());
  const act = settings.activities.find((a) => a.id === activityId);

  return (
    <div>
      {/* tiến trình */}
      <div className="mb-4 flex items-center gap-2">
        {step > 0 ? (
          <button onClick={() => go(step - 1)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f2f3f7]" aria-label="Quay lại">
            <ChevronLeft strokeWidth={3} />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
        <div className="flex flex-1 justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="h-3 rounded-full" animate={{ width: i === step ? 36 : 12, background: i <= step ? "#ffb703" : "#e1e4ec" }} />
          ))}
        </div>
        <span className="h-10 w-10" />
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        {step === 0 && (
          <motion.div key="s0" custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
            <h3 className="mb-4 text-center text-2xl font-black text-[#2b2d42]">Hôm nay thi với ai? 🤔</h3>
            <div className="grid grid-cols-2 gap-4">
              {(["dad", "mom"] as Opponent[]).map((o, i) => (
                <motion.button
                  key={o}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.08 * i }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    setOpponent(o);
                    go(1);
                  }}
                  className="btn-3d flex flex-col items-center gap-2 rounded-[28px] py-6"
                  style={{ background: m[o].color + "22", ["--btn-shadow" as string]: m[o].color + "66" }}
                >
                  <Avatar who={o} color={m[o].color} size={96} />
                  <span className="text-2xl font-black text-[#2b2d42]">{m[o].name}</span>
                </motion.button>
              ))}
            </div>
            {today.length > 0 && (
              <div className="mt-6 rounded-3xl bg-[#fff8e8] p-4">
                <div className="mb-2 text-sm font-black uppercase tracking-wider text-[#c98a1b]">Hôm nay đã thi</div>
                <div className="flex flex-wrap gap-2">
                  {today.map((x) => {
                    const a = settings.activities.find((y) => y.id === x.activityId);
                    const tier = medalFor(x, matches);
                    return (
                      <span key={x.id} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-base font-bold shadow-sm">
                        {a?.emoji ?? "❓"}
                        {x.winner === "draw" ? "🤝" : <>{m[x.winner].name} {tier && TIER_INFO[tier].emoji}</>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s1" custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
            <h3 className="mb-4 text-center text-2xl font-black text-[#2b2d42]">Thi môn gì nào? 📚</h3>
            <div className="grid grid-cols-3 gap-3">
              {settings.activities.map((a, i) => (
                <motion.button
                  key={a.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.03 * i, type: "spring", stiffness: 300 }}
                  whileHover={{ y: -4, rotate: i % 2 ? 3 : -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setActivityId(a.id);
                    go(2);
                  }}
                  className="btn-3d flex flex-col items-center gap-1 rounded-3xl bg-[#f4f6ff] py-4"
                  style={{ ["--btn-shadow" as string]: "#d9def5" }}
                >
                  <span className="text-5xl">{a.emoji}</span>
                  <span className="text-base font-extrabold text-[#2b2d42]">{a.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
            <h3 className="mb-1 text-center text-2xl font-black text-[#2b2d42]">Ai thắng? 🏁</h3>
            <p className="mb-4 text-center text-lg font-bold text-[#8a8ea6]">
              {act?.emoji} {act?.name}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {(["son", "draw", opponent] as Winner[]).map((w, i) =>
                w === "draw" ? (
                  <motion.button
                    key="draw"
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.08 }}
                    onClick={() => pickWinner("draw")}
                    disabled={saving}
                    className="btn-3d flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#f2f3f7] text-3xl"
                    style={{ ["--btn-shadow" as string]: "#d5d8e2" }}
                  >
                    🤝
                    <span className="text-xs font-black text-[#6b6f86]">Hòa</span>
                  </motion.button>
                ) : (
                  <motion.button
                    key={w}
                    initial={{ x: i === 0 ? -40 : 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => pickWinner(w)}
                    disabled={saving}
                    className="btn-3d flex flex-col items-center gap-2 rounded-[28px] py-5"
                    style={{ background: m[w as "son"].color + "22", ["--btn-shadow" as string]: m[w as "son"].color + "66" }}
                  >
                    <Avatar who={w as "son"} color={m[w as "son"].color} size={88} mood="wow" />
                    <span className="text-xl font-black text-[#2b2d42]">{m[w as "son"].name}</span>
                    <span className="rounded-full bg-white px-3 py-0.5 text-sm font-black text-[#ffb703]">🏅 Thắng!</span>
                  </motion.button>
                ),
              )}
            </div>

            <div className="mt-6 space-y-3 rounded-3xl bg-[#f7f8fb] p-4">
              <label className="flex items-center justify-between gap-3 text-base font-bold text-[#6b6f86]">
                📅 Ngày
                <input
                  type="date"
                  value={date}
                  max={todayStr()}
                  onChange={(e) => setDate(e.target.value || todayStr())}
                  className="rounded-xl bg-white px-3 py-2 font-bold text-[#2b2d42] shadow-sm outline-none"
                />
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="✍️ Ghi chú (không bắt buộc)…"
                maxLength={140}
                className="w-full rounded-xl bg-white px-3 py-2.5 font-semibold text-[#2b2d42] shadow-sm outline-none placeholder:text-[#b0b4c6]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
