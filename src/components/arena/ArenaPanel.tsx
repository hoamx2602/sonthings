"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Drawer, Tabs } from "../ui/kit";
import { Badges } from "./Badges";
import { NewMatch } from "./NewMatch";
import { Road } from "./Road";
import { Scoreboard } from "./Scoreboard";

type Tab = "play" | "score" | "road" | "badges";

export function ArenaPanel() {
  const panel = useApp((s) => s.panel);
  const close = useApp((s) => s.closePanel);
  const [tab, setTab] = useState<Tab>("play");
  return (
    <Drawer open={panel === "arena"} side="left" onClose={close} accent="#ffb703" icon="⚔️" title="Đấu trường">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "play", label: "Thi đấu", emoji: "🏁" },
          { id: "score", label: "Tỉ số", emoji: "📊" },
          { id: "road", label: "Lịch sử", emoji: "🛤️" },
          { id: "badges", label: "Huy hiệu", emoji: "🎖️" },
        ]}
      />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {tab === "play" && <NewMatch />}
          {tab === "score" && <Scoreboard />}
          {tab === "road" && <Road />}
          {tab === "badges" && <Badges />}
        </motion.div>
      </AnimatePresence>
    </Drawer>
  );
}

const SOON: Record<string, { emoji: string; title: string; color: string; items: string[] }> = {
  moments: {
    emoji: "📸",
    title: "Khoảnh khắc",
    color: "#ff7eb6",
    items: ["Lưu ảnh & video hài hước", "Ghi lại câu nói ngộ nghĩnh của con", "Dòng thời gian theo năm tháng"],
  },
  achievements: {
    emoji: "🏆",
    title: "Thành tích",
    color: "#9b7bff",
    items: ["Giấy khen, điểm số ở trường", "Cột mốc: biết đi xe đạp, biết bơi…", "Phòng trưng bày cúp 3D"],
  },
  info: {
    emoji: "📒",
    title: "Về con",
    color: "#2ec4c4",
    items: ["Chiều cao, cân nặng theo thời gian", "Sở thích, món ăn yêu thích", "Bạn bè & thầy cô"],
  },
};

export function SoonPanel() {
  const panel = useApp((s) => s.panel);
  const focus = useApp((s) => s.focus);
  const close = useApp((s) => s.closePanel);
  const info = focus ? SOON[focus] : null;
  return (
    <Drawer open={panel === "soon" && !!info} side="left" onClose={close} accent={info?.color} icon={info?.emoji} title={info?.title}>
      {info && (
        <div className="text-center">
          <motion.div className="my-4 text-[110px] leading-none" animate={{ rotate: [-6, 6, -6], y: [0, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
            🚧
          </motion.div>
          <h3 className="text-2xl font-black text-[#2b2d42]">Đảo này đang được xây!</h3>
          <p className="mt-1 font-bold text-[#8a8ea6]">Các bác thợ đang làm việc chăm chỉ 🔨</p>
          <div className="mt-6 space-y-2 text-left">
            {info.items.map((t, i) => (
              <motion.div
                key={t}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 rounded-2xl bg-[#f7f8fb] p-3 font-bold text-[#4a4e69]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: info.color }}>
                  {i + 1}
                </span>
                {t}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
