import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mergeSettings } from "./defaults";
import type { Match, Settings } from "./types";

/**
 * Lớp lưu trữ. Nếu có biến môi trường Supabase → dùng Supabase
 * (mỗi lần mở web là tải dữ liệu mới nhất). Không có → lưu localStorage.
 */
export interface Repo {
  kind: "supabase" | "local";
  loadSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  listMatches(): Promise<Match[]>;
  addMatch(m: Match): Promise<void>;
  deleteMatch(id: string): Promise<void>;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type MatchRow = {
  id: string;
  date: string;
  opponent: Match["opponent"];
  activity_id: string;
  winner: Match["winner"];
  note: string | null;
  created_at: string;
};

const toRow = (m: Match): MatchRow => ({
  id: m.id,
  date: m.date,
  opponent: m.opponent,
  activity_id: m.activityId,
  winner: m.winner,
  note: m.note ?? null,
  created_at: m.createdAt,
});

const fromRow = (r: MatchRow): Match => ({
  id: r.id,
  date: r.date,
  opponent: r.opponent,
  activityId: r.activity_id,
  winner: r.winner,
  note: r.note,
  createdAt: r.created_at,
});

function supabaseRepo(db: SupabaseClient): Repo {
  return {
    kind: "supabase",
    async loadSettings() {
      const { data, error } = await db.from("app_settings").select("data").eq("id", 1).maybeSingle();
      if (error) throw error;
      return mergeSettings(data?.data as Partial<Settings> | undefined);
    },
    async saveSettings(s) {
      const { error } = await db
        .from("app_settings")
        .upsert({ id: 1, data: s, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async listMatches() {
      const { data, error } = await db
        .from("matches")
        .select("*")
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as MatchRow[]).map(fromRow);
    },
    async addMatch(m) {
      const { error } = await db.from("matches").insert(toRow(m));
      if (error) throw error;
    },
    async deleteMatch(id) {
      const { error } = await db.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

const LS_SETTINGS = "sonworld.settings";
const LS_MATCHES = "sonworld.matches";

function readLS<T>(k: string): T | null {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function writeLS(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* bộ nhớ đầy hoặc chế độ riêng tư */
  }
}

const localRepo: Repo = {
  kind: "local",
  async loadSettings() {
    return mergeSettings(readLS<Partial<Settings>>(LS_SETTINGS));
  },
  async saveSettings(s) {
    writeLS(LS_SETTINGS, s);
  },
  async listMatches() {
    return readLS<Match[]>(LS_MATCHES) ?? [];
  },
  async addMatch(m) {
    writeLS(LS_MATCHES, [...(readLS<Match[]>(LS_MATCHES) ?? []), m]);
  },
  async deleteMatch(id) {
    writeLS(LS_MATCHES, (readLS<Match[]>(LS_MATCHES) ?? []).filter((m) => m.id !== id));
  },
};

export const repo: Repo = url && key ? supabaseRepo(createClient(url, key)) : localRepo;
