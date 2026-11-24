"use client";
import { motion } from "motion/react";
import type { MemberId } from "@/lib/types";

export type AvatarMood = "happy" | "sad" | "wow" | "neutral";

/** Nhân vật 2D dùng trong các bảng (nhẹ hơn 3D, giống phong cách đảo) */
export function Avatar({
  who,
  color,
  size = 64,
  mood = "happy",
  bounce = false,
  crown = false,
}: {
  who: MemberId;
  color: string;
  size?: number;
  mood?: AvatarMood;
  bounce?: boolean;
  crown?: boolean;
}) {
  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={bounce ? { y: [0, -size * 0.18, 0], scaleY: [1, 1.06, 0.94, 1] } : undefined}
      transition={bounce ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" } : undefined}
      className="relative shrink-0"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id={`g-${who}-${color}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="45%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="94" rx="30" ry="5" fill="#000" opacity="0.1" />
        <path d="M50 14 C80 14 92 38 92 60 C92 82 74 92 50 92 C26 92 8 82 8 60 C8 38 20 14 50 14 Z" fill={`url(#g-${who}-${color})`} />
        {/* phụ kiện */}
        {who === "son" && (
          <g>
            <path d="M50 16 L50 4" stroke="#4f9a35" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="40" cy="5" rx="11" ry="6" fill="#7fd858" transform="rotate(-25 40 5)" />
            <ellipse cx="60" cy="5" rx="11" ry="6" fill="#7fd858" transform="rotate(25 60 5)" />
          </g>
        )}
        {who === "dad" && (
          <g>
            <path d="M22 30 C24 8 76 8 78 30 Z" fill="#2f5fd0" />
            <rect x="46" y="26" width="42" height="7" rx="3.5" fill="#2f5fd0" />
          </g>
        )}
        {who === "mom" && (
          <g transform="translate(72 22) rotate(-20)">
            <path d="M0 0 L-14 -9 L-14 9 Z" fill="#ff4f8b" />
            <path d="M0 0 L14 -9 L14 9 Z" fill="#ff4f8b" />
            <circle r="4.5" fill="#ff2e75" />
          </g>
        )}
        {/* mắt */}
        {mood === "sad" ? (
          <g stroke="#1d1d2b" strokeWidth="4" strokeLinecap="round">
            <path d="M30 50 L40 54" />
            <path d="M70 50 L60 54" />
          </g>
        ) : (
          <g fill="#1d1d2b">
            <ellipse cx="36" cy="52" rx="6" ry={mood === "wow" ? 9 : 7.5} />
            <ellipse cx="64" cy="52" rx="6" ry={mood === "wow" ? 9 : 7.5} />
            <circle cx="38" cy="49" r="2.2" fill="#fff" />
            <circle cx="66" cy="49" r="2.2" fill="#fff" />
          </g>
        )}
        <ellipse cx="24" cy="64" rx="7" ry="4" fill="#ff8fa3" opacity="0.7" />
        <ellipse cx="76" cy="64" rx="7" ry="4" fill="#ff8fa3" opacity="0.7" />
        {mood === "happy" && <path d="M42 66 Q50 75 58 66" stroke="#6b2737" strokeWidth="4" fill="none" strokeLinecap="round" />}
        {mood === "neutral" && <path d="M44 68 L56 68" stroke="#6b2737" strokeWidth="4" strokeLinecap="round" />}
        {mood === "wow" && <ellipse cx="50" cy="70" rx="5" ry="6" fill="#6b2737" />}
        {mood === "sad" && (
          <>
            <path d="M42 72 Q50 64 58 72" stroke="#6b2737" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M68 58 Q66 66 70 68 Q74 66 68 58 Z" fill="#7cc8ff" />
          </>
        )}
        {crown && (
          <g transform="translate(50 6)">
            <path d="M-18 6 L-18 -8 L-9 0 L0 -12 L9 0 L18 -8 L18 6 Z" fill="#ffc93c" stroke="#e0a100" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="0" cy="1" r="3" fill="#ff4f6d" />
          </g>
        )}
      </svg>
    </motion.div>
  );
}
