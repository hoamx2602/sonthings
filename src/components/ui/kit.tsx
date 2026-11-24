"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";

/** Ngăn kéo trượt ra từ trái/phải, giống bảng thông tin trong ảnh mẫu */
export function Drawer({
  open,
  side,
  onClose,
  accent = "#e94b6b",
  title,
  icon,
  children,
}: {
  open: boolean;
  side: "left" | "right";
  onClose: () => void;
  accent?: string;
  title: ReactNode;
  icon: ReactNode;
  children: ReactNode;
}) {
  const from = side === "left" ? -520 : 520;
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: from, opacity: 0, rotate: side === "left" ? -2 : 2 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          exit={{ x: from, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className={`fixed bottom-3 top-[88px] z-40 flex w-[min(480px,calc(100vw-24px))] flex-col overflow-hidden rounded-[32px] bg-white/97 shadow-2xl backdrop-blur ${
            side === "left" ? "left-3" : "right-3"
          }`}
          style={{ boxShadow: `0 0 0 3px ${accent}55, 0 24px 60px -12px rgba(30,40,80,.35)` }}
        >
          <header className="flex items-center gap-3 px-5 pb-3 pt-4">
            <motion.div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl"
              style={{ background: accent }}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring" }}
            >
              {icon}
            </motion.div>
            <h2 className="flex-1 text-[28px] font-black leading-tight text-[#2b2d42]">{title}</h2>
            <button onClick={onClose} aria-label="Đóng" className="grid h-11 w-11 place-items-center rounded-full bg-[#f2f3f7] text-[#555] transition hover:rotate-90 hover:bg-[#e8e9ef]">
              <X size={22} strokeWidth={3} />
            </button>
          </header>
          <div className="scroll-soft flex-1 overflow-y-auto px-5 pb-6">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; emoji: string }[];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-4 flex gap-1 rounded-full bg-[#f2f3f7] p-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="relative flex-1 rounded-full px-1 py-2.5 text-[15px] font-extrabold">
          {value === t.id && (
            <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-white shadow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          )}
          <span className={`relative flex flex-col items-center leading-tight ${value === t.id ? "text-[#2b2d42]" : "text-[#8a8ea6]"}`}>
            <span className="text-xl">{t.emoji}</span>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${on ? "bg-[#3fbf7f]" : "bg-[#d5d8e2]"}`}>
      <motion.span className="absolute top-1 h-7 w-7 rounded-full bg-white shadow" animate={{ left: on ? 32 : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}

export function Section({ title, emoji, children }: { title: string; emoji: string; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-3xl bg-[#f7f8fb] p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#7a7f99]">
        <span className="text-lg">{emoji}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Bàn phím nhập PIN cho bố mẹ */
export function PinPad() {
  const req = useApp((s) => s.pinRequest);
  const pin = useApp((s) => s.settings.pin);
  const answer = useApp((s) => s.answerPin);
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(0);

  useEffect(() => setVal(""), [req]);
  useEffect(() => {
    if (val.length < 4) return;
    if (val === pin) answer(true);
    else {
      setShake((s) => s + 1);
      setTimeout(() => setVal(""), 350);
    }
  }, [val, pin, answer]);

  return (
    <AnimatePresence>
      {req && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-[#1b2a4a]/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            key={shake}
            className="w-full max-w-[340px] rounded-[36px] bg-white p-6 text-center shadow-2xl"
            initial={shake ? { x: 0 } : { scale: 0.7 }}
            animate={shake ? { x: [0, -16, 16, -10, 10, 0] } : { scale: 1 }}
            transition={{ duration: shake ? 0.4 : 0.25 }}
          >
            <div className="text-5xl">🔒</div>
            <h3 className="mt-2 text-2xl font-black text-[#2b2d42]">Bố mẹ nhập mã nhé</h3>
            <div className="my-5 flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <motion.span key={i} className="h-5 w-5 rounded-full" animate={{ scale: val.length > i ? 1.2 : 1, background: val.length > i ? "#4f9dff" : "#e1e4ec" }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "✕", "0", "⌫"].map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === "✕") answer(false);
                    else if (k === "⌫") setVal((v) => v.slice(0, -1));
                    else setVal((v) => (v.length < 4 ? v + k : v));
                  }}
                  className="btn-3d h-16 rounded-2xl bg-[#f2f3f7] text-2xl font-black text-[#2b2d42]"
                  style={{ ["--btn-shadow" as string]: "#d5d8e2" }}
                >
                  {k}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
