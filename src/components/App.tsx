"use client";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Settings as Gear, Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sound";
import { useApp } from "@/lib/store";
import { currentStreak, medalCounts, weeklyWins } from "@/lib/stats";
import { ArenaPanel, SoonPanel } from "./arena/ArenaPanel";
import { Avatar } from "./ui/Avatar";
import { Celebration } from "./ui/Celebration";
import { PinPad } from "./ui/kit";
import { SettingsPanel } from "./ui/SettingsPanel";

const World = dynamic(() => import("./world/World"), { ssr: false });

function TopBar() {
  const settings = useApp((s) => s.settings);
  const matches = useApp((s) => s.matches);
  const openIsland = useApp((s) => s.openIsland);
  const openSettings = useApp((s) => s.openSettings);
  const closePanel = useApp((s) => s.closePanel);
  const update = useApp((s) => s.updateSettings);
  const m = settings.members;
  const stats = useMemo(
    () => ({ medals: medalCounts(matches).son.total, streak: currentStreak(matches, "son"), king: weeklyWins(matches).king }),
    [matches],
  );
  const musicOn = settings.sound.music;

  return (
    <motion.header
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 flex h-[76px] items-center gap-2 px-3 sm:gap-3 sm:px-5"
    >
      <button onClick={closePanel} className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 p-1.5 shadow-lg backdrop-blur lg:pr-4">
        <Avatar who="son" color={m.son.color} size={44} />
        <span className="hidden max-w-[220px] truncate whitespace-nowrap text-lg font-black text-[#2b2d42] lg:inline">Thế giới của {settings.childName}</span>
      </button>

      <nav className="mx-auto flex min-w-0 items-center gap-0.5 rounded-full bg-white/90 p-1 shadow-lg backdrop-blur sm:gap-1 sm:p-1.5">
        <Chip onClick={() => openIsland("arena")} emoji="🏅" value={stats.medals} label="huy chương" />
        <Chip onClick={() => openIsland("arena")} emoji="🔥" value={stats.streak} label="ngày" hot={stats.streak >= 3} />
        <Chip onClick={() => openIsland("arena")} emoji="👑" value={stats.king ? m[stats.king].name : "—"} label="tuần này" />
      </nav>

      <button
        onClick={() => update((s) => ({ ...s, sound: { ...s.sound, music: !s.sound.music } }))}
        aria-label={musicOn ? "Tắt nhạc" : "Bật nhạc"}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/90 text-[#2b2d42] shadow-lg backdrop-blur transition hover:scale-105 sm:h-14 sm:w-14"
      >
        {musicOn ? <Volume2 size={26} strokeWidth={2.5} /> : <VolumeX size={26} strokeWidth={2.5} />}
      </button>
      <button onClick={openSettings} aria-label="Cài đặt" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#2b2d42] text-white shadow-lg transition hover:rotate-45 sm:h-14 sm:w-14">
        <Gear size={26} strokeWidth={2.5} />
      </button>
    </motion.header>
  );
}

function Chip({ emoji, value, label, onClick, hot }: { emoji: string; value: string | number; label: string; onClick: () => void; hot?: boolean }) {
  return (
    <button onClick={onClick} className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 transition hover:bg-[#f2f3f7] sm:gap-1.5 sm:px-3 xl:px-4">
      <motion.span className="text-xl sm:text-2xl" animate={hot ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : undefined} transition={{ duration: 1.2, repeat: Infinity }}>
        {emoji}
      </motion.span>
      <motion.span key={String(value)} initial={{ scale: 1.6, color: "#ffb703" }} animate={{ scale: 1, color: "#2b2d42" }} className="max-w-[64px] truncate text-lg font-black sm:text-xl">
        {value}
      </motion.span>
      <span className="hidden text-sm font-bold text-[#8a8ea6] xl:inline">{label}</span>
    </button>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  const loaded = useApp((s) => s.loaded);
  const settings = useApp((s) => s.settings);
  const m = settings.members;
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#8fd0ff] via-[#bfe5ff] to-[#eaf7ff]"
      exit={{ opacity: 0, scale: 1.3, filter: "blur(8px)" }}
      transition={{ duration: 0.6 }}
    >
      <div className="sunburst pointer-events-none absolute h-[1200px] w-[1200px] opacity-40" />
      <div className="relative flex items-end gap-4">
        <motion.div initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }}>
          <Avatar who="dad" color={m.dad.color} size={100} bounce />
        </motion.div>
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}>
          <Avatar who="son" color={m.son.color} size={150} bounce crown />
        </motion.div>
        <motion.div initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }}>
          <Avatar who="mom" color={m.mom.color} size={100} bounce />
        </motion.div>
      </div>
      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="relative mt-6 px-4 text-center text-4xl font-black text-white sm:text-6xl"
        style={{ textShadow: "0 4px 0 #3f8fd8, 0 10px 30px rgba(30,80,160,.35)" }}
      >
        Thế giới của {settings.childName}
      </motion.h1>
      <motion.button
        disabled={!loaded}
        onClick={onStart}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1, scale: loaded ? [1, 1.06, 1] : 1 }}
        transition={{ delay: 0.8, scale: { repeat: Infinity, duration: 1.4 } }}
        className="btn-3d relative mt-10 rounded-full bg-[#ffb703] px-14 py-5 text-3xl font-black text-white disabled:opacity-60"
        style={{ ["--btn-shadow" as string]: "#d98e00" }}
      >
        {loaded ? "▶  Vào chơi!" : "Đang tải…"}
      </motion.button>
    </motion.div>
  );
}

function ErrorToast() {
  const error = useApp((s) => s.error);
  const clear = useApp((s) => s.clearError);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clear, 4500);
    return () => clearTimeout(t);
  }, [error, clear]);
  return (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-[#2b2d42] px-5 py-3 font-bold text-white shadow-xl">
          ⚠️ {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const init = useApp((s) => s.init);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  // Mở khoá âm thanh ở lần chạm đầu tiên + tiếng click cho mọi nút
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      sound.unlock();
      const el = (e.target as HTMLElement | null)?.closest("button, [role=switch]");
      if (el && !el.closest("[data-silent]") && !(el as HTMLButtonElement).disabled) sound.click();
    };
    window.addEventListener("pointerdown", onDown, { capture: true });
    return () => window.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);

  return (
    <main className="sky fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">{started && <World />}</div>
      {started && (
        <>
          <TopBar />
          <ArenaPanel />
          <SoonPanel />
          <SettingsPanel />
          <Celebration />
          <Hint />
        </>
      )}
      <PinPad />
      <ErrorToast />
      <AnimatePresence>{!started && <StartScreen onStart={() => setStarted(true)} />}</AnimatePresence>
    </main>
  );
}

function Hint() {
  const panel = useApp((s) => s.panel);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 7000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && !panel && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ delay: 1.2 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-30 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full bg-white/90 px-5 py-3 text-center text-base font-bold text-[#4a4e69] shadow-lg sm:text-lg"
        >
          👆 Chạm vào đảo để khám phá · Kéo để xoay
        </motion.div>
      )}
    </AnimatePresence>
  );
}
