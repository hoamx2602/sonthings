"use client";
import { Environment, Lightformer, RoundedBox, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MedalTier } from "@/lib/types";

export const TIER_INFO: Record<MedalTier, { name: string; color: string; dark: string; emoji: string; sparkle: string }> = {
  gold: { name: "Huy chương Vàng", color: "#ffcb45", dark: "#e09a12", emoji: "🥇", sparkle: "#fff1a8" },
  silver: { name: "Huy chương Bạc", color: "#e9eef5", dark: "#a9b6c6", emoji: "🥈", sparkle: "#ffffff" },
  bronze: { name: "Huy chương Đồng", color: "#f6ad78", dark: "#c8733d", emoji: "🥉", sparkle: "#ffd8b8" },
};

/** Hồ sơ đồng xu: mặt sau → vành bo tròn → vành nổi → mặt trước lõm (quay quanh trục Y) */
const COIN_PROFILE: [number, number][] = [
  [0, -0.1], [0.9, -0.1], [0.97, -0.08], [1.0, -0.03], [1.0, 0.04], [0.98, 0.09], [0.94, 0.12],
  [0.88, 0.12], [0.84, 0.1], [0.82, 0.06], [0.0, 0.06],
];

const STAR = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.2 : 0.46;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
})();

function Metal({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} metalness={1} roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} />;
}

/** Vòng nguyệt quế: các lá nhỏ xếp theo hai cung */
function Laurel({ color }: { color: string }) {
  const leaves = useMemo(() => {
    const out: { p: [number, number, number]; rot: number }[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + side * (0.35 + i * 0.27);
        const r = 0.66;
        out.push({ p: [Math.cos(a) * r, Math.sin(a) * r, 0.09], rot: a + (side > 0 ? Math.PI / 2 : -Math.PI / 2) + side * 0.5 });
      }
    }
    return out;
  }, []);
  return (
    <>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p} rotation={[0, 0, l.rot]} scale={[0.05, 0.11, 0.03]}>
          <sphereGeometry args={[1, 16, 12]} />
          <Metal color={color} />
        </mesh>
      ))}
    </>
  );
}

function Medal({ tier, ribbon }: { tier: MedalTier; ribbon: string }) {
  const ref = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  const info = TIER_INFO[tier];
  const coin = useMemo(() => {
    const g = new THREE.LatheGeometry(
      [...COIN_PROFILE].map(([x, y]) => new THREE.Vector2(x, y)),
      96,
    );
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (born.current === null) born.current = clock.elapsedTime;
    const t = clock.elapsedTime - born.current;
    // rơi từ trên xuống, xoay 2 vòng, rồi đung đưa nhẹ để luôn thấy mặt trước
    const drop = Math.max(0, 1 - t / 0.8);
    const ease = drop * drop * drop;
    g.position.y = ease * 4 + Math.sin(Math.max(0, t - 0.8) * 7) * 0.06 * Math.exp(-Math.max(0, t - 0.8) * 2.5);
    g.rotation.y = t < 1.2 ? (1 - Math.pow(1 - t / 1.2, 3)) * Math.PI * 4 : Math.sin((t - 1.2) * 1.6) * 0.35;
    g.rotation.z = Math.sin(t * 1.3) * 0.04;
    g.scale.setScalar(Math.min(1, 0.3 + t * 1.8));
  });

  return (
    <group ref={ref}>
      {/* dây ruy băng chữ V */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.3 * s, 1.55, -0.08]} rotation={[0, 0, 0.35 * s]}>
          <RoundedBox args={[0.42, 1.5, 0.04]} radius={0.015}>
            <meshStandardMaterial color={ribbon} roughness={0.55} />
          </RoundedBox>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.1, 1.5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* khoen nối */}
      <mesh position={[0, 1.08, 0]}>
        <torusGeometry args={[0.13, 0.04, 16, 32]} />
        <Metal color={info.dark} />
      </mesh>
      {/* đồng xu */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={coin} castShadow>
          <Metal color={info.color} />
        </mesh>
      </group>
      {/* mặt sau cũng có sao */}
      <mesh position={[0, 0.03, -0.1]} rotation={[0, Math.PI, 0]}>
        <extrudeGeometry args={[STAR, { depth: 0.03, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4 }]} />
        <Metal color={info.dark} />
      </mesh>
      {/* ngôi sao dập nổi + nguyệt quế ở mặt trước */}
      <mesh position={[0, 0.03, 0.06]}>
        <extrudeGeometry args={[STAR, { depth: 0.05, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.05, bevelSegments: 6 }]} />
        <Metal color={info.dark} />
      </mesh>
      <Laurel color={info.dark} />
    </group>
  );
}

export function Medal3D({ tier, ribbon, size = 240 }: { tier: MedalTier; ribbon: string; size?: number }) {
  const info = TIER_INFO[tier];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${info.sparkle} 0%, ${info.color}88 45%, transparent 70%)` }}
      />
      <Canvas
        camera={{ position: [0, 0.55, 4.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.NeutralToneMapping }}
        resize={{ offsetSize: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 4, 5]} intensity={1.5} />
        {/* ánh kim: môi trường studio nhiều dải sáng để vàng/bạc phản chiếu */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={3} position={[0, 4, 5]} scale={[8, 2, 1]} />
          <Lightformer intensity={2} position={[-5, 1, 3]} rotation-y={Math.PI / 3} scale={[2, 8, 1]} color="#fff4d6" />
          <Lightformer intensity={2} position={[5, 0, 3]} rotation-y={-Math.PI / 3} scale={[2, 8, 1]} color="#dff1ff" />
          <Lightformer intensity={1} position={[0, -4, 2]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} color="#ffe9b0" />
          <Lightformer form="ring" intensity={2.5} position={[0, 0, -6]} scale={4} />
        </Environment>
        <group position={[0, -0.3, 0]}>
          <Medal tier={tier} ribbon={ribbon} />
        </group>
        <Sparkles count={36} scale={[3.4, 3.2, 1.5]} size={5} speed={0.5} color={info.sparkle} position={[0, -0.1, 0.5]} />
      </Canvas>
    </div>
  );
}
