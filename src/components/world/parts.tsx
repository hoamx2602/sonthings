"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

export type V3 = [number, number, number];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Đế đảo: mặt cỏ + lớp đất + chóp đá nhọn phía dưới. Mặt cỏ ở y = 0 */
export function IslandBase({
  radius,
  grass = "#86d95a",
  dirt = "#c08a5a",
  seed = 1,
  children,
}: {
  radius: number;
  grass?: string;
  dirt?: string;
  seed?: number;
  children?: ReactNode;
}) {
  const rocks = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: Math.round(radius * 2) }, () => {
      const a = r() * Math.PI * 2;
      const rr = radius * (0.55 + r() * 0.25);
      return { pos: [Math.cos(a) * rr, -1.3 - r() * radius * 0.5, Math.sin(a) * rr] as V3, s: 0.25 + r() * 0.35 };
    });
  }, [radius, seed]);
  const coneH = radius * 1.25;
  return (
    <group>
      <mesh receiveShadow castShadow position={[0, -0.22, 0]}>
        <cylinderGeometry args={[radius, radius * 0.99, 0.44, 48]} />
        <meshStandardMaterial color={grass} roughness={0.85} />
      </mesh>
      {/* viền cỏ đậm hơn */}
      <mesh position={[0, -0.47, 0]}>
        <cylinderGeometry args={[radius * 0.99, radius * 0.95, 0.1, 48]} />
        <meshStandardMaterial color="#5fb544" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, -0.85, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.8, 0.7, 12]} />
        <meshStandardMaterial color={dirt} roughness={1} flatShading />
      </mesh>
      <mesh castShadow position={[0, -1.2 - coneH / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius * 0.8, coneH, 10]} />
        <meshStandardMaterial color="#a8724a" roughness={1} flatShading />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.pos} scale={r.s} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? "#b98657" : "#9a6a43"} flatShading />
        </mesh>
      ))}
      {children}
    </group>
  );
}

export function Tree({ position, scale = 1, color = "#4fbf4a", seed = 0 }: { position: V3; scale?: number; color?: string; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.2 + seed) * 0.03;
  });
  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.6, 8]} />
        <meshStandardMaterial color="#8b5a35" />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.12, 1.25, 0.05]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.18, 1.05, -0.1]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#62cc55" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Rải cây quanh mép đảo, tránh vùng giữa */
export function TreeRing({ radius, inner, count, seed }: { radius: number; inner: number; count: number; seed: number }) {
  const trees = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const d = inner + r() * (radius - inner - 0.4);
      return { p: [Math.cos(a) * d, 0, Math.sin(a) * d] as V3, s: 0.7 + r() * 0.6, c: r() > 0.5 ? "#4fbf4a" : "#3fae46" };
    });
  }, [radius, inner, count, seed]);
  return (
    <>
      {trees.map((t, i) => (
        <Tree key={i} position={t.p} scale={t.s} color={t.c} seed={i} />
      ))}
    </>
  );
}

export function Flower({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 4]} />
        <meshStandardMaterial color="#3e9b3a" />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export function Cloud({ position, scale = 1, speed = 0.3, range = 60 }: { position: V3; scale?: number; speed?: number; range?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x += speed * dt;
    if (g.position.x > range / 2) g.position.x = -range / 2;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {[
        [0, 0, 0, 1],
        [1, -0.1, 0.2, 0.75],
        [-1, -0.15, 0, 0.7],
        [0.4, 0.5, -0.1, 0.7],
        [-0.5, 0.35, 0.2, 0.6],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={s}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Cầu gỗ nối hai điểm (đã ở mép đảo) */
export function Bridge({ from, to }: { from: V3; to: V3 }) {
  const { planks, angle } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const n = Math.max(3, Math.round(len / 0.42));
    const angle = Math.atan2(b.x - a.x, b.z - a.z);
    const planks: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * 0.25; // võng nhẹ
      planks.push([p.x, p.y, p.z]);
    }
    return { planks, angle };
  }, [from, to]);
  const side = (s: number): V3[] => {
    const off = new THREE.Vector3(Math.cos(angle) * 0.55 * s, 0, -Math.sin(angle) * 0.55 * s);
    return planks.map((p) => [p[0] + off.x, p[1] + 0.35, p[2] + off.z]);
  };
  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} position={p} rotation={[0, angle, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.08, 0.34]} />
          <meshStandardMaterial color={i % 2 ? "#d9a46a" : "#c98f55"} />
        </mesh>
      ))}
      {[1, -1].map((s) =>
        side(s).map((p, i) =>
          i % 3 === 0 ? (
            <mesh key={`${s}-${i}`} position={[p[0], p[1] - 0.15, p[2]]}>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
              <meshStandardMaterial color="#8b5a35" />
            </mesh>
          ) : null,
        ),
      )}
    </group>
  );
}

export function Flag({ position, color, height = 1.6 }: { position: V3; color: string; height?: number }) {
  const cloth = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (cloth.current) cloth.current.rotation.y = Math.sin(clock.elapsedTime * 3 + position[0]) * 0.35;
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, height, 6]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ffd43b" metalness={0.5} roughness={0.3} />
      </mesh>
      <group position={[0, height - 0.22, 0]}>
        <mesh ref={cloth}>
          <shapeGeometry args={[flagShape]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
const flagShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.2);
  s.lineTo(0.55, 0);
  s.lineTo(0, -0.2);
  s.closePath();
  return s;
})();

export function Balloon({ position, color, seed = 0 }: { position: V3; color: string; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + seed;
    ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.15;
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.08;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow scale={[1, 1.18, 1]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color={color} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.9, 3]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
}

export function Lamp({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 1, 6]} />
        <meshStandardMaterial color="#555b6e" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#fff6c7" emissive="#ffe08a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export function TrafficCone({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <coneGeometry args={[0.14, 0.4, 12]} />
        <meshStandardMaterial color="#ff8a3d" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.085, 0.1, 0.07, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[0.32, 0.03, 0.32]} />
        <meshStandardMaterial color="#ff8a3d" />
      </mesh>
    </group>
  );
}

/** Giàn giáo đang xây */
export function Scaffold({ position, w = 1.6, h = 1.8, d = 1.6 }: { position: V3; w?: number; h?: number; d?: number }) {
  const bars = useMemo(() => {
    const out: { p: V3; s: V3 }[] = [];
    const t = 0.05;
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) out.push({ p: [x, h / 2, z], s: [t, h, t] });
    for (const y of [h * 0.5, h]) {
      for (const z of [-d / 2, d / 2]) out.push({ p: [0, y, z], s: [w, t, t] });
      for (const x of [-w / 2, w / 2]) out.push({ p: [x, y, 0], s: [t, t, d] });
    }
    return out;
  }, [w, h, d]);
  return (
    <group position={position}>
      {bars.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color="#f2b134" />
        </mesh>
      ))}
      <mesh position={[0, h * 0.5 + 0.03, 0]} receiveShadow>
        <boxGeometry args={[w, 0.04, d]} />
        <meshStandardMaterial color="#d9a46a" />
      </mesh>
    </group>
  );
}

/** Nhóm đồ vật lơ lửng nhẹ */
export function Bob({ children, amp = 0.15, speed = 1, seed = 0, spin = 0 }: { children: ReactNode; amp?: number; speed?: number; seed?: number; spin?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * speed + seed) * amp;
    if (spin) ref.current.rotation.y += spin * 0.01;
  });
  return <group ref={ref}>{children}</group>;
}
