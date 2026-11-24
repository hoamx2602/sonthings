"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useApp } from "@/lib/store";
import { weeklyWins } from "@/lib/stats";
import type { MemberId } from "@/lib/types";
import { Blob } from "./Blob";
import { Balloon, Bob, Flag, Flower, IslandBase, Lamp, Scaffold, TrafficCone, TreeRing, rng, type V3 } from "./parts";

// ---------------- Đảo trung tâm: lâu đài của con ----------------
function Tower({ position, r, h, roof }: { position: V3; r: number; h: number; roof: string }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r * 1.05, h, 24]} />
        <meshStandardMaterial color="#f6ead7" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, h + r * 0.9, 0]}>
        <coneGeometry args={[r * 1.3, r * 1.9, 24]} />
        <meshStandardMaterial color={roof} roughness={0.5} />
      </mesh>
      {/* cửa sổ */}
      <mesh position={[0, h * 0.65, r * 0.98]}>
        <boxGeometry args={[r * 0.45, r * 0.6, 0.05]} />
        <meshStandardMaterial color="#3d5a9e" />
      </mesh>
    </group>
  );
}

function Walker({ who, color, radius, speed, phase }: { who: MemberId; color: string; radius: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const a = clock.elapsedTime * speed + phase;
    g.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    g.rotation.y = -a; // nhìn theo hướng đi
  });
  return (
    <group ref={ref}>
      <Blob who={who} color={color} scale={0.75} seed={phase} />
    </group>
  );
}

export function HubIsland() {
  const members = useApp((s) => s.settings.members);
  const flowers = useMemo(() => {
    const r = rng(7);
    const cols = ["#ff7eb6", "#ffd43b", "#ffffff", "#9b7bff"];
    return Array.from({ length: 26 }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = 4.3 + r() * 1.1;
      return { p: [Math.cos(a) * d, 0, Math.sin(a) * d] as V3, c: cols[i % cols.length] };
    });
  }, []);
  return (
    <IslandBase radius={6} seed={3}>
      {/* quảng trường */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[4.2, 4.2, 0.04, 48]} />
        <meshStandardMaterial color="#f5e2bd" />
      </mesh>
      <mesh receiveShadow position={[0, 0.045, 0]}>
        <torusGeometry args={[3.6, 0.06, 6, 64]} />
        <meshStandardMaterial color="#e8c992" />
      </mesh>
      {/* lâu đài */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[2.3, 2.4, 0.5, 32]} />
        <meshStandardMaterial color="#efd9b4" />
      </mesh>
      <Tower position={[0, 0.5, 0]} r={0.95} h={2.4} roof="#e94b6b" />
      <Tower position={[1.35, 0.5, 0.6]} r={0.5} h={1.5} roof="#4f9dff" />
      <Tower position={[-1.35, 0.5, 0.6]} r={0.5} h={1.5} roof="#ffc23d" />
      <Tower position={[0.9, 0.5, -1.2]} r={0.45} h={1.7} roof="#9b7bff" />
      <Tower position={[-0.9, 0.5, -1.2]} r={0.45} h={1.3} roof="#ff8fb8" />
      <mesh position={[0, 1.0, 0.98]}>
        <boxGeometry args={[0.55, 0.9, 0.08]} />
        <meshStandardMaterial color="#a8673a" />
      </mesh>
      <Flag position={[0, 4.15, 0]} color="#ff4f6d" height={0.9} />
      {/* đài phun nước */}
      <group position={[2.6, 0, 2.4]}>
        <mesh castShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.7, 0.75, 0.3, 24]} />
          <meshStandardMaterial color="#e3e7ef" />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.05, 24]} />
          <meshStandardMaterial color="#6cc3ff" roughness={0.1} />
        </mesh>
        <Bob amp={0.08} speed={4}>
          <mesh position={[0, 0.65, 0]}>
            <coneGeometry args={[0.12, 0.7, 12]} />
            <meshStandardMaterial color="#9fdcff" transparent opacity={0.75} />
          </mesh>
        </Bob>
      </group>
      {[[-3.2, 0, 1.6], [3.4, 0, -1.2], [-2.2, 0, -3], [1.2, 0, 3.6]].map((p, i) => (
        <Lamp key={i} position={p as V3} />
      ))}
      <Walker who="son" color={members.son.color} radius={3.2} speed={0.35} phase={0} />
      <Walker who="dad" color={members.dad.color} radius={3.2} speed={0.35} phase={-0.9} />
      <Walker who="mom" color={members.mom.color} radius={3.2} speed={0.35} phase={-1.7} />
      <TreeRing radius={6} inner={4.6} count={14} seed={11} />
      {flowers.map((f, i) => (
        <Flower key={i} position={f.p} color={f.c} />
      ))}
      <Balloon position={[-2.8, 2.4, -2]} color="#ff5d7a" seed={1} />
      <Balloon position={[3.1, 2.8, 0.6]} color="#4f9dff" seed={2} />
    </IslandBase>
  );
}

// ---------------- Đảo Đấu trường ----------------
function Trophy({ position }: { position: V3 }) {
  const points = useMemo(
    () =>
      [
        [0.0, 0], [0.32, 0], [0.32, 0.06], [0.12, 0.12], [0.08, 0.35], [0.1, 0.45],
        [0.35, 0.6], [0.42, 1.0], [0.4, 1.05], [0.0, 1.05],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  return (
    <group position={position}>
      <Bob amp={0.1} speed={1.4} spin={0.6}>
        <mesh castShadow>
          <latheGeometry args={[points, 32]} />
          <meshStandardMaterial color="#ffc93c" metalness={0.3} roughness={0.3} emissive="#b07800" emissiveIntensity={0.25} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.42 * s, 0.75, 0]} rotation={[0, 0, (Math.PI / 2) * s]}>
            <torusGeometry args={[0.15, 0.035, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#ffc93c" metalness={0.3} roughness={0.3} emissive="#b07800" emissiveIntensity={0.25} />
          </mesh>
        ))}
      </Bob>
    </group>
  );
}

/** Khán đài: các bậc ghế xếp theo cung tròn phía sau sân */
function Bleachers({ radius, from, length, colors }: { radius: number; from: number; length: number; colors: string[] }) {
  const seats = useMemo(() => {
    const out: { p: V3; rot: number; w: number; h: number; c: string }[] = [];
    colors.forEach((c, row) => {
      const r = radius + row * 0.42;
      const n = Math.round((length * r) / 0.7);
      for (let k = 0; k < n; k++) {
        const a = from + ((k + 0.5) / n) * length;
        const h = 0.28 + row * 0.3;
        out.push({ p: [Math.sin(a) * r, h / 2, Math.cos(a) * r], rot: a, w: (length * r) / n - 0.04, h, c });
      }
    });
    return out;
  }, [radius, from, length, colors]);
  return (
    <group>
      {seats.map((s, i) => (
        <mesh key={i} position={s.p} rotation={[0, s.rot, 0]} castShadow receiveShadow>
          <boxGeometry args={[s.w, s.h, 0.4]} />
          <meshStandardMaterial color={s.c} />
        </mesh>
      ))}
    </group>
  );
}

export function ArenaIsland() {
  const members = useApp((s) => s.settings.members);
  const matches = useApp((s) => s.matches);
  const { ranking, king } = useMemo(() => weeklyWins(matches), [matches]);
  // bục: giữa = hạng 1, trái = hạng 2, phải = hạng 3
  const podium: { x: number; h: number; color: string; who: MemberId }[] = [
    { x: 0, h: 0.75, color: "#ffd166", who: ranking[0] },
    { x: -1.05, h: 0.5, color: "#cfd8e3", who: ranking[1] },
    { x: 1.05, h: 0.32, color: "#f4a261", who: ranking[2] },
  ];
  return (
    <IslandBase radius={4.6} seed={5} grass="#8fdc5f">
      {/* sân thi đấu */}
      <mesh receiveShadow position={[0, 0.02, 0.3]}>
        <cylinderGeometry args={[2.9, 2.9, 0.04, 48]} />
        <meshStandardMaterial color="#b6ec8a" />
      </mesh>
      <mesh position={[0, 0.05, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.05, 6, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Bleachers radius={3.2} from={Math.PI * 0.7} length={Math.PI * 0.6} colors={["#ff9fc1", "#9b7bff", "#6cc3ff"]} />
      {podium.map((p, i) => (
        <group key={i} position={[p.x, 0, 0.2]}>
          <mesh castShadow receiveShadow position={[0, p.h / 2, 0]}>
            <boxGeometry args={[1, p.h, 0.9]} />
            <meshStandardMaterial color={p.color} roughness={0.5} />
          </mesh>
          {/* ngôi sao trên mặt bục */}
          <mesh position={[0, p.h / 2, 0.46]}>
            <circleGeometry args={[0.16 - i * 0.03, 5]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <Blob
            who={p.who}
            color={members[p.who].color}
            position={[0, p.h, 0]}
            scale={0.75}
            crown={i === 0 && king === p.who}
            mood={i === 2 && king ? "sad" : "happy"}
            bounce={i === 0 ? 1.2 : 0.6}
            seed={i}
          />
        </group>
      ))}
      <Trophy position={[0, 0, -1.6]} />
      <Flag position={[-2.4, 0, 1.6]} color="#4f9dff" />
      <Flag position={[2.4, 0, 1.6]} color="#ff7eb6" />
      <Flag position={[-1.6, 0, -2.4]} color="#ffc23d" />
      <Flag position={[1.6, 0, -2.4]} color="#3fbf7f" />
      <Balloon position={[-3.4, 2.4, 0.4]} color="#ffc23d" seed={3} />
      <Balloon position={[3.3, 2.7, -0.6]} color="#9b7bff" seed={4} />
      <Balloon position={[3.6, 2.2, 0.8]} color="#ff5d7a" seed={5} />
      <TreeRing radius={4.6} inner={3.6} count={7} seed={21} />
    </IslandBase>
  );
}

// ---------------- Các đảo đang xây ----------------
function StarShape() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.28 : 0.65;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }, []);
  return (
    <mesh castShadow>
      <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }]} />
      <meshStandardMaterial color="#ffc93c" metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

function Camera3D() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.8, 0.5]} />
        <meshStandardMaterial color="#ff7eb6" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.2, 24]} />
        <meshStandardMaterial color="#3d3d55" />
      </mesh>
      <mesh position={[0, 0, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
        <meshStandardMaterial color="#7cc8ff" roughness={0.05} metalness={0.3} />
      </mesh>
      <mesh position={[0.4, 0.46, 0]}>
        <boxGeometry args={[0.22, 0.12, 0.2]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>
    </group>
  );
}

function Book3D() {
  return (
    <group rotation={[0.2, 0, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} rotation={[0, 0, 0.25 * s]}>
          <mesh castShadow position={[0.42 * s, 0, 0]}>
            <boxGeometry args={[0.8, 0.06, 1.1]} />
            <meshStandardMaterial color="#6c7bff" />
          </mesh>
          <mesh position={[0.4 * s, 0.05, 0]}>
            <boxGeometry args={[0.74, 0.05, 1.02]} />
            <meshStandardMaterial color="#fffdf5" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function SoonIsland({ kind, seed }: { kind: "moments" | "achievements" | "info"; seed: number }) {
  const grass = kind === "moments" ? "#9be36a" : kind === "achievements" ? "#86d95a" : "#7fd66b";
  return (
    <IslandBase radius={3.2} seed={seed} grass={grass}>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.04, 32]} />
        <meshStandardMaterial color="#f1dcb5" />
      </mesh>
      <Scaffold position={[-0.4, 0, -0.3]} w={1.6} h={1.6} d={1.4} />
      <group position={[0.7, 2.4, 0.4]}>
        <Bob amp={0.18} speed={1.5} seed={seed} spin={kind === "achievements" ? 1 : 0.4}>
          {kind === "moments" && <Camera3D />}
          {kind === "achievements" && <StarShape />}
          {kind === "info" && <Book3D />}
        </Bob>
      </group>
      <TrafficCone position={[1.2, 0, 1.2]} />
      <TrafficCone position={[0.4, 0, 1.6]} />
      <TrafficCone position={[-1.4, 0, 1.0]} />
      <TreeRing radius={3.2} inner={2.2} count={6} seed={seed * 3} />
    </IslandBase>
  );
}

export function DecoIsland({ radius, seed }: { radius: number; seed: number }) {
  return (
    <Bob amp={0.25} speed={0.6} seed={seed}>
      <IslandBase radius={radius} seed={seed}>
        <TreeRing radius={radius} inner={0} count={Math.max(1, Math.round(radius * 1.5))} seed={seed} />
      </IslandBase>
    </Bob>
  );
}
