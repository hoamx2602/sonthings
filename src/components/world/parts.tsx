"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { Nature, type NatureName } from "./models";

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

/** Biên đảo hơi lượn sóng, dùng chung cho mặt cỏ và phần đất để khớp nhau */
function edgeNoise(seed: number) {
  const r = rng(seed);
  const p = [r() * 6.28, r() * 6.28, r() * 6.28];
  return (a: number) => 1 + 0.045 * Math.sin(3 * a + p[0]) + 0.03 * Math.sin(5 * a + p[1]) + 0.015 * Math.sin(8 * a + p[2]);
}

function lathe(points: [number, number][], segments: number, warp: (x: number, y: number, z: number, a: number) => [number, number, number]) {
  // LatheGeometry cần điểm đi từ dưới lên để mặt hướng ra ngoài
  const g = new THREE.LatheGeometry(
    [...points].reverse().map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.x);
    const [x, y, z] = warp(v.x, v.y, v.z, a);
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

function paint(g: THREE.BufferGeometry, color: (y: number, i: number) => THREE.Color) {
  const pos = g.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = color(pos.getY(i), i);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return g;
}

/**
 * Đế đảo bay: mặt cỏ bo tròn mép + khối đất đá gồ ghề phía dưới.
 * Mặt cỏ nằm ở y = 0.
 */
export function IslandBase({
  radius: R,
  grass = "#8ad85c",
  seed = 1,
  children,
}: {
  radius: number;
  grass?: string;
  dirt?: string;
  seed?: number;
  children?: ReactNode;
}) {
  const { cap, body } = useMemo(() => {
    const edge = edgeNoise(seed);
    const bevel = Math.min(0.45, R * 0.09);
    // Mặt cỏ: phẳng → bo tròn mép → viền cỏ rủ xuống
    const capPts: [number, number][] = [[0, 0]];
    for (let i = 0; i <= 10; i++) {
      const t = (i / 10) * (Math.PI / 2);
      capPts.push([R - bevel + Math.sin(t) * bevel, -bevel + Math.cos(t) * bevel]);
    }
    capPts.push([R * 0.995, -bevel - 0.18], [R * 0.97, -bevel - 0.32], [R * 0.93, -bevel - 0.36]);
    const radial = (x: number, y: number, z: number, a: number): [number, number, number] => {
      const k = edge(a);
      return [x * k, y, z * k];
    };
    const cap = paint(lathe(capPts, 96, radial), (y) => {
      const top = new THREE.Color(grass);
      const side = new THREE.Color(grass).offsetHSL(0.01, 0.02, -0.12);
      return top.lerp(side, THREE.MathUtils.clamp(-y / (bevel + 0.3), 0, 1));
    });

    // Khối đất: thuôn dần xuống thành chóp, có gồ ghề theo góc và độ sâu
    const depth = R * 0.95 + 1.2;
    const bodyPts: [number, number][] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -bevel - 0.3 - t * depth;
      const r = R * 0.94 * Math.pow(1 - t, 0.85) * (1 - 0.12 * Math.sin(t * Math.PI));
      bodyPts.push([Math.max(r, 0.001), y]);
    }
    const rr = rng(seed + 7);
    const ph = [rr() * 6, rr() * 6, rr() * 6];
    const body = paint(
      lathe(bodyPts, 48, (x, y, z, a) => {
        const k = edge(a) * (1 + 0.07 * Math.sin(5 * a + y * 1.7 + ph[0]) + 0.05 * Math.sin(9 * a - y * 2.3 + ph[1]) + 0.03 * Math.sin(y * 4 + ph[2]));
        return [x * k, y, z * k];
      }),
      (y) => {
        const t = THREE.MathUtils.clamp(-y / (depth + 0.6), 0, 1);
        const c = new THREE.Color("#e0a46c").lerp(new THREE.Color("#8d5a3b"), t);
        // các lớp đá
        const band = 0.5 + 0.5 * Math.sin(y * 3.2);
        return c.offsetHSL(0, 0, (band - 0.5) * 0.06);
      },
    );
    return { cap, body };
  }, [R, grass, seed]);

  return (
    <group>
      <mesh geometry={cap} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.85} />
      </mesh>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      {children}
    </group>
  );
}

const TREES: { name: NatureName; s: number }[] = [
  { name: "Tree_4_A", s: 0.34 },
  { name: "Tree_3_A", s: 0.42 },
  { name: "Tree_4_B", s: 0.28 },
  { name: "Tree_1_A", s: 0.4 },
  { name: "Tree_3_B", s: 0.34 },
  { name: "Tree_2_A", s: 0.36 },
];
const BUSHES: { name: NatureName; s: number }[] = [
  { name: "Bush_4_C", s: 0.45 },
  { name: "Bush_2_C", s: 0.4 },
  { name: "Bush_4_A", s: 0.9 },
  { name: "Bush_2_A", s: 0.9 },
  { name: "Bush_4_E", s: 0.3 },
];
const SMALL: { name: NatureName; s: number }[] = [
  { name: "Grass_2_C", s: 0.5 },
  { name: "Grass_1_A", s: 0.7 },
  { name: "Rock_1_A", s: 0.6 },
  { name: "Bush_1_A", s: 1.2 },
  { name: "Rock_2_A", s: 1.4 },
];

/** Rải cây, bụi, cỏ quanh mép đảo, chừa vùng giữa */
export function Foliage({
  radius,
  inner,
  trees,
  bushes = Math.round(trees * 1.2),
  small = Math.round(trees * 1.5),
  seed,
  scale = 1,
}: {
  radius: number;
  inner: number;
  trees: number;
  bushes?: number;
  small?: number;
  seed: number;
  scale?: number;
}) {
  const items = useMemo(() => {
    const r = rng(seed);
    const place = (n: number, pool: { name: NatureName; s: number }[], minR: number, maxR: number, k: number) =>
      Array.from({ length: n }, () => {
        const a = r() * Math.PI * 2;
        const d = minR + r() * Math.max(0, maxR - minR);
        const pick = pool[Math.floor(r() * pool.length)];
        return { name: pick.name, p: [Math.cos(a) * d, 0, Math.sin(a) * d] as V3, s: pick.s * k * (0.8 + r() * 0.45), rot: r() * Math.PI * 2 };
      });
    return [
      ...place(trees, TREES, inner, radius - 0.7, scale),
      ...place(bushes, BUSHES, inner * 0.9, radius - 0.35, scale),
      ...place(small, SMALL, inner * 0.7, radius - 0.25, scale),
    ];
  }, [radius, inner, trees, bushes, small, seed, scale]);
  return (
    <>
      {items.map((t, i) => (
        <Sway key={i} seed={i} position={t.p}>
          <Nature name={t.name} scale={t.s} rotation={t.rot} />
        </Sway>
      ))}
    </>
  );
}

/** Lắc lư nhẹ như gió thổi */
function Sway({ children, seed, position }: { children: ReactNode; seed: number; position: V3 }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1 + seed) * 0.025;
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

export function Flower({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 6]} />
        <meshStandardMaterial color="#3e9b3a" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.055, 0.26, Math.sin(a) * 0.055]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial color="#ffd43b" />
      </mesh>
    </group>
  );
}

/** Mây bông xốp, đáy phẳng */
export function Cloud({ position, scale = 1, speed = 0.3, range = 70, seed = 0 }: { position: V3; scale?: number; speed?: number; range?: number; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const r = rng(seed + 99);
    return Array.from({ length: 7 }, (_, i) => {
      const x = (i - 3) * 0.55 + (r() - 0.5) * 0.3;
      const s = 0.55 + (1 - Math.abs(i - 3) / 3) * 0.55 + r() * 0.15;
      return { p: [x, s * 0.35, (r() - 0.5) * 0.5] as V3, s };
    });
  }, [seed]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x += speed * dt;
    if (g.position.x > range / 2) g.position.x = -range / 2;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.p} scale={[p.s, p.s * 0.85, p.s]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={1} emissive="#eaf4ff" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** Cầu gỗ có dây thừng, nối hai điểm (đã ở mép đảo) */
export function Bridge({ from, to }: { from: V3; to: V3 }) {
  const plankGeo = useMemo(() => new RoundedBoxGeometry(1.25, 0.1, 0.32, 2, 0.04), []);
  const { planks, angle, ropes, posts } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const n = Math.max(3, Math.round(len / 0.4));
    const angle = Math.atan2(b.x - a.x, b.z - a.z);
    const side = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
    const at = (t: number) => {
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * 0.3; // võng nhẹ
      return p;
    };
    const planks = Array.from({ length: n + 1 }, (_, i) => at(i / n));
    const ropes = [1, -1].map((s) => {
      const pts = Array.from({ length: 21 }, (_, i) => at(i / 20).add(side.clone().multiplyScalar(0.62 * s)).add(new THREE.Vector3(0, 0.45 - Math.sin((i / 20) * Math.PI) * 0.08, 0)));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.025, 6, false);
    });
    const posts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i += 3) for (const s of [1, -1]) posts.push(at(i / n).add(side.clone().multiplyScalar(0.62 * s)));
    return { planks, angle, ropes, posts };
  }, [from, to]);
  return (
    <group>
      {planks.map((p, i) => (
        <mesh key={i} geometry={plankGeo} position={p} rotation={[0, angle + (i % 2 ? 0.03 : -0.03), 0]} castShadow receiveShadow>
          <meshStandardMaterial color={i % 2 ? "#d9a46a" : "#cb9358"} roughness={0.8} />
        </mesh>
      ))}
      {ropes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#c9a27a" roughness={1} />
        </mesh>
      ))}
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + 0.22, p.z]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.5, 10]} />
          <meshStandardMaterial color="#9b6a42" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function Flag({ position, color, height = 1.6 }: { position: V3; color: string; height?: number }) {
  const cloth = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.6, 0.38, 12, 4);
    g.translate(0.3, 0, 0);
    return g;
  }, []);
  useFrame(({ clock }) => {
    const m = cloth.current;
    if (!m) return;
    // vải gợn sóng
    const pos = m.geometry.attributes.position;
    const t = clock.elapsedTime * 4 + position[0];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(x * 7 - t) * 0.06 * x);
    }
    pos.needsUpdate = true;
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.035, height, 10]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0, height + 0.04, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ffd43b" roughness={0.3} />
      </mesh>
      <mesh ref={cloth} geometry={geo} position={[0, height - 0.22, 0]}>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
    </group>
  );
}

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
        <sphereGeometry args={[0.28, 32, 24]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, -0.34, 0]}>
        <coneGeometry args={[0.05, 0.08, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.9, 3]} />
        <meshStandardMaterial color="#777" />
      </mesh>
    </group>
  );
}

export function Lamp({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 1, 10]} />
        <meshStandardMaterial color="#555b6e" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshStandardMaterial color="#fff6c7" emissive="#ffe08a" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export function TrafficCone({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <coneGeometry args={[0.14, 0.4, 20]} />
        <meshStandardMaterial color="#ff8a3d" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.085, 0.1, 0.07, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 20]} />
        <meshStandardMaterial color="#ff8a3d" roughness={0.5} />
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
