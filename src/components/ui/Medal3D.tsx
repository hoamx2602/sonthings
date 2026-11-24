"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MedalTier } from "@/lib/types";

export const TIER_INFO: Record<MedalTier, { name: string; color: string; dark: string; emoji: string }> = {
  gold: { name: "Huy chương Vàng", color: "#ffc93c", dark: "#d99a00", emoji: "🥇" },
  silver: { name: "Huy chương Bạc", color: "#dfe6ee", dark: "#9aa8b8", emoji: "🥈" },
  bronze: { name: "Huy chương Đồng", color: "#e9a06a", dark: "#b8683a", emoji: "🥉" },
};

function Medal({ tier, ribbon }: { tier: MedalTier; ribbon: string }) {
  const ref = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  const star = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.22 : 0.5;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    return s;
  }, []);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (born.current === null) born.current = clock.elapsedTime;
    const t = clock.elapsedTime - born.current;
    // rơi xuống, nảy, rồi xoay
    const drop = Math.max(0, 1 - t / 0.7);
    g.position.y = drop * drop * 4 + Math.abs(Math.sin(Math.min(t, 1.4) * 9)) * 0.25 * Math.max(0, 1.4 - t);
    g.rotation.y = t < 0.7 ? t * 14 : (t - 0.7) * 1.6 + Math.sin(t * 2) * 0.3 + 9.8;
    const s = Math.min(1, t * 2.5);
    g.scale.setScalar(s);
  });
  const info = TIER_INFO[tier];
  return (
    <group ref={ref}>
      {/* dây đeo */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.32 * s, 1.5, -0.05]} rotation={[0, 0, 0.32 * s]}>
          <boxGeometry args={[0.38, 1.4, 0.04]} />
          <meshStandardMaterial color={ribbon} roughness={0.6} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.2, 64]} />
        <meshStandardMaterial color={info.color} metalness={0.35} roughness={0.28} emissive={info.color} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0, 0.11]}>
        <torusGeometry args={[0.82, 0.05, 12, 64]} />
        <meshStandardMaterial color={info.dark} metalness={0.35} roughness={0.3} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, -0.02, 0.06 * s]} rotation={[0, s < 0 ? Math.PI : 0, 0]}>
          <extrudeGeometry args={[star, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }]} />
          <meshStandardMaterial color={info.dark} metalness={0.35} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function Medal3D({ tier, ribbon, size = 240 }: { tier: MedalTier; ribbon: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0.5, 4.2], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true }} resize={{ offsetSize: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-3, -1, 3]} intensity={18} color="#fff3c4" />
        <pointLight position={[2, -2, -3]} intensity={10} color="#9ad0ff" />
        <Medal tier={tier} ribbon={ribbon} />
      </Canvas>
    </div>
  );
}
