"use client";
import { create } from "zustand";
import { DEFAULT_SETTINGS } from "./defaults";
import { repo } from "./repo";
import { sound } from "./sound";
import { uid } from "./stats";
import type { IslandId, Match, Settings } from "./types";

export type Panel = null | "arena" | "settings" | "soon";

interface AppState {
  loaded: boolean;
  error: string | null;
  settings: Settings;
  matches: Match[];
  focus: IslandId | null;
  panel: Panel;
  celebration: Match | null;
  /** Đã nhập PIN đúng tới thời điểm này (ms) */
  pinOkUntil: number;
  pinRequest: null | { resolve: (ok: boolean) => void };

  init(): Promise<void>;
  updateSettings(fn: (s: Settings) => Settings): void;
  addMatch(m: Omit<Match, "id" | "createdAt">): Promise<Match>;
  deleteMatch(id: string): Promise<void>;
  openIsland(id: IslandId | null): void;
  closePanel(): void;
  openSettings(): Promise<void>;
  clearError(): void;
  dismissCelebration(): void;
  /** Hỏi PIN nếu đã cài. Trả về true nếu được phép */
  requirePin(): Promise<boolean>;
  answerPin(ok: boolean): void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useApp = create<AppState>((set, get) => ({
  loaded: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  matches: [],
  focus: null,
  panel: null,
  celebration: null,
  pinOkUntil: 0,
  pinRequest: null,

  async init() {
    try {
      const [settings, matches] = await Promise.all([repo.loadSettings(), repo.listMatches()]);
      sound.apply(settings.sound);
      set({ settings, matches, loaded: true });
    } catch (e) {
      console.error(e);
      set({ loaded: true, error: "Không tải được dữ liệu. Kiểm tra kết nối Supabase nhé." });
    }
  },

  updateSettings(fn) {
    const settings = fn(get().settings);
    set({ settings });
    sound.apply(settings.sound);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      repo.saveSettings(settings).catch((e) => {
        console.error(e);
        set({ error: "Chưa lưu được cài đặt." });
      });
    }, 500);
  },

  async addMatch(input) {
    const match: Match = { ...input, id: uid(), createdAt: new Date().toISOString() };
    set({ matches: [...get().matches, match].sort(byDate) });
    try {
      await repo.addMatch(match);
    } catch (e) {
      console.error(e);
      set({ matches: get().matches.filter((m) => m.id !== match.id), error: "Chưa lưu được trận đấu, thử lại nhé." });
      throw e;
    }
    set({ celebration: match });
    return match;
  },

  async deleteMatch(id) {
    const prev = get().matches;
    set({ matches: prev.filter((m) => m.id !== id) });
    try {
      await repo.deleteMatch(id);
    } catch (e) {
      console.error(e);
      set({ matches: prev, error: "Chưa xoá được." });
    }
  },

  openIsland(id) {
    sound.whoosh();
    const panel: Panel = id === "arena" ? "arena" : id === "moments" || id === "achievements" || id === "info" ? "soon" : null;
    set({ focus: id, panel });
  },
  closePanel() {
    set({ panel: null, focus: null });
  },
  async openSettings() {
    if (!(await get().requirePin())) return;
    sound.whoosh();
    set({ panel: "settings", focus: null });
  },
  clearError() {
    set({ error: null });
  },
  dismissCelebration() {
    set({ celebration: null });
  },

  requirePin() {
    const { settings, pinOkUntil } = get();
    if (!settings.pin || Date.now() < pinOkUntil) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => set({ pinRequest: { resolve } }));
  },
  answerPin(ok) {
    const req = get().pinRequest;
    // Nhập đúng thì mở khoá 10 phút
    set({ pinRequest: null, pinOkUntil: ok ? Date.now() + 10 * 60_000 : get().pinOkUntil });
    req?.resolve(ok);
  },
}));

function byDate(a: Match, b: Match) {
  return a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date);
}
