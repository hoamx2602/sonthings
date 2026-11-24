export type MemberId = "son" | "dad" | "mom";
export type Opponent = "dad" | "mom";
export type Winner = MemberId | "draw";
export type MedalTier = "bronze" | "silver" | "gold";

export interface Activity {
  id: string;
  emoji: string;
  name: string;
}

export interface Match {
  id: string;
  /** YYYY-MM-DD (giờ địa phương) */
  date: string;
  opponent: Opponent;
  activityId: string;
  winner: Winner;
  note?: string | null;
  createdAt: string;
}

export interface MemberProfile {
  name: string;
  color: string;
}

export type TrackId = "none" | "sunny" | "breeze" | "adventure";
export type ClickStyle = "pop" | "bubble" | "ting" | "wood";

export interface SoundSettings {
  music: boolean;
  musicTrack: TrackId;
  musicVolume: number; // 0..1
  sfx: boolean;
  clickStyle: ClickStyle;
  sfxVolume: number; // 0..1
}

export interface Settings {
  childName: string;
  birthday: string | null;
  members: Record<MemberId, MemberProfile>;
  activities: Activity[];
  sound: SoundSettings;
  /** Mã PIN 4 số để ghi/xoá kết quả. null = không khoá */
  pin: string | null;
  /** Người thua nhận "ngôi sao cố gắng" */
  consolationStar: boolean;
  quality: "high" | "low";
}

export type IslandId = "hub" | "arena" | "moments" | "achievements" | "info" | "race";
