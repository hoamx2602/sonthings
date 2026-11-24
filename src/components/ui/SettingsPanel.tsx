"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ACTIVITY_EMOJIS, MEMBER_COLORS } from "@/lib/defaults";
import { repo } from "@/lib/repo";
import { CLICK_STYLES, TRACKS, sound } from "@/lib/sound";
import { useApp } from "@/lib/store";
import { uid } from "@/lib/stats";
import type { MemberId, Settings, SoundSettings, TrackId } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Drawer, Section, Switch } from "./kit";

export function SettingsPanel() {
  const panel = useApp((s) => s.panel);
  const close = useApp((s) => s.closePanel);
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const set = (patch: Partial<Settings>) => update((s) => ({ ...s, ...patch }));
  const setSound = (patch: Partial<SoundSettings>) => update((s) => ({ ...s, sound: { ...s.sound, ...patch } }));
  const setMember = (who: MemberId, patch: Partial<Settings["members"][MemberId]>) =>
    update((s) => ({ ...s, members: { ...s.members, [who]: { ...s.members[who], ...patch } } }));

  return (
    <Drawer open={panel === "settings"} side="right" onClose={close} accent="#2b2d42" icon={<span className="text-white">⚙️</span>} title="Cài đặt">
      <Section title="Về con" emoji="👦">
        <Field label="Tên / biệt danh của con">
          <input value={settings.childName} onChange={(e) => set({ childName: e.target.value })} maxLength={24} className="input" />
        </Field>
        <Field label="Ngày sinh">
          <input type="date" value={settings.birthday ?? ""} onChange={(e) => set({ birthday: e.target.value || null })} className="input" />
        </Field>
      </Section>

      <Section title="Nhân vật" emoji="🎨">
        <div className="space-y-4">
          {(["son", "dad", "mom"] as MemberId[]).map((who) => (
            <div key={who} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <Avatar who={who} color={settings.members[who].color} size={60} bounce />
              <div className="flex-1 space-y-2">
                <input value={settings.members[who].name} onChange={(e) => setMember(who, { name: e.target.value })} maxLength={16} className="input !bg-[#f2f3f7]" aria-label="Tên gọi" />
                <div className="flex flex-wrap gap-1.5">
                  {MEMBER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setMember(who, { color: c })}
                      aria-label={`Màu ${c}`}
                      className="h-7 w-7 rounded-full transition hover:scale-110"
                      style={{ background: c, boxShadow: settings.members[who].color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : undefined }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Âm thanh" emoji="🎵">
        <Row label="Nhạc nền">
          <Switch on={settings.sound.music} onChange={(v) => setSound({ music: v })} label="Nhạc nền" />
        </Row>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {(Object.keys(TRACKS) as Exclude<TrackId, "none">[]).map((id) => (
            <ChoiceCard
              key={id}
              active={settings.sound.musicTrack === id}
              emoji={TRACKS[id].emoji}
              label={TRACKS[id].name}
              onClick={() => {
                setSound({ musicTrack: id, music: true });
                sound.preview(id);
              }}
            />
          ))}
        </div>
        <Slider label="Âm lượng nhạc" value={settings.sound.musicVolume} onChange={(v) => setSound({ musicVolume: v })} />
        <div className="my-4 h-px bg-[#e6e8ef]" />
        <Row label="Âm thanh khi bấm">
          <Switch on={settings.sound.sfx} onChange={(v) => setSound({ sfx: v })} label="Âm thanh khi bấm" />
        </Row>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {CLICK_STYLES.map((c) => (
            <ChoiceCard
              key={c.id}
              active={settings.sound.clickStyle === c.id}
              emoji={c.emoji}
              label={c.name}
              data-silent
              onClick={() => {
                setSound({ clickStyle: c.id });
                setTimeout(() => sound.click(c.id), 30);
              }}
            />
          ))}
        </div>
        <Slider label="Âm lượng hiệu ứng" value={settings.sound.sfxVolume} onChange={(v) => setSound({ sfxVolume: v })} />
        <button onClick={() => sound.fanfare()} className="mt-3 w-full rounded-2xl bg-white py-2.5 font-bold text-[#4a4e69] shadow-sm">
          🎺 Nghe thử tiếng chiến thắng
        </button>
      </Section>

      <ActivitiesSection />

      <Section title="Phụ huynh" emoji="🔒">
        <PinField />
        <Row label="Người thua nhận ⭐ cố gắng">
          <Switch on={settings.consolationStar} onChange={(v) => set({ consolationStar: v })} label="Ngôi sao cố gắng" />
        </Row>
      </Section>

      <Section title="Hiển thị" emoji="🖥️">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
          {(["high", "low"] as const).map((q) => (
            <button key={q} onClick={() => set({ quality: q })} className="relative rounded-xl py-3 font-black">
              {settings.quality === q && <motion.span layoutId="q-pill" className="absolute inset-0 rounded-xl bg-[#2b2d42]" />}
              <span className={`relative ${settings.quality === q ? "text-white" : "text-[#8a8ea6]"}`}>{q === "high" ? "✨ 3D đẹp" : "🪶 3D nhẹ"}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm font-semibold text-[#8a8ea6]">Máy chạy chậm thì chọn “3D nhẹ”.</p>
      </Section>

      <p className="pb-2 text-center text-sm font-bold text-[#a0a4b8]">
        {repo.kind === "supabase" ? "☁️ Dữ liệu lưu trên Supabase" : "💾 Dữ liệu đang lưu trên máy này"}
      </p>
    </Drawer>
  );
}

function ActivitiesSection() {
  const activities = useApp((s) => s.settings.activities);
  const update = useApp((s) => s.updateSettings);
  const [emoji, setEmoji] = useState(ACTIVITY_EMOJIS[0]);
  const [name, setName] = useState("");
  const [picking, setPicking] = useState(false);
  const add = () => {
    if (!name.trim()) return;
    update((s) => ({ ...s, activities: [...s.activities, { id: uid(), emoji, name: name.trim() }] }));
    setName("");
  };
  return (
    <Section title="Môn thi" emoji="📚">
      <div className="mb-3 flex flex-wrap gap-2">
        {activities.map((a) => (
          <span key={a.id} className="flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1 font-bold text-[#2b2d42] shadow-sm">
            {a.emoji} {a.name}
            <button
              onClick={() => update((s) => ({ ...s, activities: s.activities.filter((x) => x.id !== a.id) }))}
              disabled={activities.length <= 1}
              className="grid h-6 w-6 place-items-center rounded-full text-[#b0b4c6] hover:bg-[#ffe5e5] hover:text-[#e5484d] disabled:opacity-0"
              aria-label={`Xoá ${a.name}`}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setPicking((p) => !p)} className="h-12 w-12 shrink-0 rounded-xl bg-white text-2xl shadow-sm" aria-label="Chọn biểu tượng">
          {emoji}
        </button>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Tên môn mới…" maxLength={16} className="input flex-1" />
        <button onClick={add} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#3fbf7f] text-white shadow-sm" aria-label="Thêm môn">
          <Plus strokeWidth={3} />
        </button>
      </div>
      {picking && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 grid grid-cols-10 gap-1 rounded-2xl bg-white p-2 shadow-sm">
          {ACTIVITY_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                setEmoji(e);
                setPicking(false);
              }}
              className="aspect-square rounded-lg text-xl hover:bg-[#f2f3f7]"
            >
              {e}
            </button>
          ))}
        </motion.div>
      )}
    </Section>
  );
}

function PinField() {
  const pin = useApp((s) => s.settings.pin);
  const update = useApp((s) => s.updateSettings);
  const [val, setVal] = useState("");
  return (
    <div className="mb-3">
      <div className="mb-1.5 text-sm font-bold text-[#6b6f86]">
        Mã PIN để ghi/xoá kết quả và mở cài đặt {pin ? "· đang bật ✅" : "· đang tắt"}
      </div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="4 số"
          className="input flex-1 tracking-[0.5em]"
        />
        <button
          disabled={val.length !== 4}
          onClick={() => {
            update((s) => ({ ...s, pin: val }));
            setVal("");
          }}
          className="rounded-xl bg-[#4f9dff] px-4 font-black text-white disabled:opacity-40"
        >
          {pin ? "Đổi" : "Đặt"}
        </button>
        {pin && (
          <button onClick={() => update((s) => ({ ...s, pin: null }))} className="rounded-xl bg-white px-4 font-black text-[#e5484d] shadow-sm">
            Tắt
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1.5 block text-sm font-bold text-[#6b6f86]">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="font-bold text-[#2b2d42]">{label}</span>
      {children}
    </div>
  );
}

function ChoiceCard({ active, emoji, label, onClick, ...rest }: { active: boolean; emoji: string; label: string; onClick: () => void; "data-silent"?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      {...rest}
      className={`flex flex-col items-center gap-1 rounded-2xl py-3 transition ${active ? "bg-white shadow-md ring-[3px] ring-[#2b2d42]" : "bg-white/60"}`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-xs font-black text-[#2b2d42]">{label}</span>
    </motion.button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-sm font-bold text-[#6b6f86]">{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="slider flex-1" />
    </label>
  );
}
