import type { Activity, Settings } from "./types";

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: "math", emoji: "🧮", name: "Toán" },
  { id: "read", emoji: "📖", name: "Đọc sách" },
  { id: "write", emoji: "✏️", name: "Tập viết" },
  { id: "english", emoji: "🔤", name: "Tiếng Anh" },
  { id: "draw", emoji: "🎨", name: "Vẽ tranh" },
  { id: "tidy", emoji: "🧸", name: "Dọn đồ" },
  { id: "puzzle", emoji: "🧩", name: "Xếp hình" },
  { id: "sport", emoji: "⚽", name: "Vận động" },
];

export const DEFAULT_SETTINGS: Settings = {
  childName: "Bé",
  birthday: null,
  members: {
    son: { name: "Con", color: "#4f9dff" },
    dad: { name: "Bố", color: "#3fbf7f" },
    mom: { name: "Mẹ", color: "#ff7eb6" },
  },
  activities: DEFAULT_ACTIVITIES,
  sound: {
    music: true,
    musicTrack: "sunny",
    musicVolume: 0.35,
    sfx: true,
    clickStyle: "pop",
    sfxVolume: 0.7,
  },
  pin: null,
  consolationStar: true,
  quality: "high",
};

export const MEMBER_COLORS = [
  "#4f9dff", "#3fbf7f", "#ff7eb6", "#ff8a4c", "#9b7bff",
  "#ffc83d", "#2ec4c4", "#ff5d5d", "#8bd450", "#6c7bff",
];

export const ACTIVITY_EMOJIS = [
  "🧮", "📖", "✏️", "🔤", "🎨", "🧸", "🧩", "⚽", "🎹", "🧪",
  "🌍", "🏃", "🍽️", "🛏️", "🦷", "🚲", "🏊", "♟️", "🎤", "🧠",
];

/** Gộp settings lưu trữ với mặc định, để thêm field mới không làm hỏng dữ liệu cũ */
export function mergeSettings(raw: Partial<Settings> | null | undefined): Settings {
  if (!raw) return structuredClone(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    members: {
      son: { ...DEFAULT_SETTINGS.members.son, ...raw.members?.son },
      dad: { ...DEFAULT_SETTINGS.members.dad, ...raw.members?.dad },
      mom: { ...DEFAULT_SETTINGS.members.mom, ...raw.members?.mom },
    },
    sound: { ...DEFAULT_SETTINGS.sound, ...raw.sound },
    activities: raw.activities?.length ? raw.activities : DEFAULT_ACTIVITIES,
  };
}
