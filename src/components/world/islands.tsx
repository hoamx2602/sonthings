"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { useApp } from "@/lib/store";
import { weeklyWins } from "@/lib/stats";
import type { MemberId } from "@/lib/types";
import { Blob } from "./Blob";
import { Village } from "./models";
import { Balloon, Bob, Flag, Flower, Foliage, IslandBase, Lamp, TrafficCone, rng, type V3 } from "./parts";

// ---------------- Đảo trung tâm: lâu đài của con ----------------
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
      <Blob who={who} color={color} scale={0.7} seed={phase} />
    </group>
  );
}

function Fountain({ position }: { position: V3 }) {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current) water.current.scale.y = 1 + Math.sin(clock.elapsedTime * 6) * 0.08;
  });
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
        <torusGeometry args={[0.62, 0.13, 16, 48]} />
        <meshStandardMaterial color="#eef1f7" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 40]} />
        <meshPhysicalMaterial color="#6cc8ff" roughness={0.05} transmission={0.2} clearcoat={1} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.5, 20]} />
        <meshStandardMaterial color="#eef1f7" />
      </mesh>
      <mesh ref={water} position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshPhysicalMaterial color="#bfe9ff" roughness={0.05} transparent opacity={0.8} clearcoat={1} />
      </mesh>
    </group>
  );
}

export function HubIsland() {
  const members = useApp((s) => s.settings.members);
  const flowers = useMemo(() => {
    const r = rng(7);
    const cols = ["#ff7eb6", "#ffd43b", "#ffffff", "#b69bff", "#ff9f6b"];
    return Array.from({ length: 34 }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = 4.3 + r() * 1.2;
      return { p: [Math.cos(a) * d, 0, Math.sin(a) * d] as V3, c: cols[i % cols.length] };
    });
  }, []);
  return (
    <IslandBase radius={6} seed={3}>
      {/* quảng trường */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[4.2, 4.25, 0.05, 72]} />
        <meshStandardMaterial color="#f6e4c3" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1.9, 2.0, 0.12, 64]} />
        <meshStandardMaterial color="#ecd3a6" roughness={0.8} />
      </mesh>
      {/* lâu đài */}
      <Village name="building_castle_red" position={[0, 0.1, 0]} scale={1.05} />
      <Flag position={[0, 4.25, 0.1]} color="#ff4f6d" height={0.8} />
      {/* làng nhỏ quanh quảng trường */}
      <Village name="building_windmill_yellow" position={[-3.3, 0, -1.4]} rotation={0.9} scale={1.5} />
      <Village name="building_home_A_red" position={[3.3, 0, -1.6]} rotation={-0.9} scale={1.5} />
      <Village name="building_home_B_yellow" position={[-3.0, 0, 2.0]} rotation={2.2} scale={1.35} />
      <Village name="building_tower_A_blue" position={[0.6, 0, -3.5]} rotation={0} scale={1.1} />
      <Village name="building_well_blue" position={[3.4, 0, 1.6]} rotation={-2} scale={1.3} />
      <Fountain position={[1.6, 0.05, 2.8]} />
      {[[-2.2, 0, -3], [2.6, 0, 3.4], [-1.2, 0, 3.6], [2.2, 0, -2.8]].map((p, i) => (
        <Lamp key={i} position={p as V3} />
      ))}
      <Walker who="son" color={members.son.color} radius={2.55} speed={0.32} phase={0} />
      <Walker who="dad" color={members.dad.color} radius={2.55} speed={0.32} phase={-0.85} />
      <Walker who="mom" color={members.mom.color} radius={2.55} speed={0.32} phase={-1.6} />
      <Foliage radius={6} inner={4.6} trees={10} bushes={14} small={18} seed={11} />
      {flowers.map((f, i) => (
        <Flower key={i} position={f.p} color={f.c} />
      ))}
      <Balloon position={[-2.4, 3.2, 0.4]} color="#ff5d7a" seed={1} />
      <Balloon position={[2.4, 3.6, 0.8]} color="#4f9dff" seed={2} />
      <Balloon position={[2.0, 3.0, -1.2]} color="#ffc23d" seed={3} />
    </IslandBase>
  );
}

// ---------------- Đảo Đấu trường ----------------
function Trophy({ position }: { position: V3 }) {
  const points = useMemo(
    () =>
      [
        [0.0, 0], [0.32, 0], [0.33, 0.04], [0.3, 0.08], [0.14, 0.12], [0.08, 0.3], [0.08, 0.4], [0.12, 0.46],
        [0.3, 0.56], [0.4, 0.72], [0.43, 0.95], [0.42, 1.02], [0.38, 1.02], [0.36, 0.95], [0.0, 0.95],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  const gold = <meshPhysicalMaterial color="#ffc93c" metalness={0.35} roughness={0.25} clearcoat={1} emissive="#b07800" emissiveIntensity={0.2} />;
  return (
    <group position={position}>
      <RoundedBox args={[0.9, 0.5, 0.9]} radius={0.08} position={[0, 0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#7a5af5" roughness={0.6} />
      </RoundedBox>
      <group position={[0, 0.5, 0]}>
        <Bob amp={0.1} speed={1.4} spin={0.6}>
          <group position={[0, 0.15, 0]}>
            <mesh castShadow>
              <latheGeometry args={[points, 48]} />
              {gold}
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0.42 * s, 0.72, 0]} rotation={[0, 0, (Math.PI / 2) * s]}>
                <torusGeometry args={[0.15, 0.04, 12, 24, Math.PI]} />
                {gold}
              </mesh>
            ))}
          </group>
        </Bob>
      </group>
    </group>
  );
}

/** Khán đài: các bậc ghế bo tròn xếp theo cung phía sau sân */
function Bleachers({ radius, from, length, colors }: { radius: number; from: number; length: number; colors: string[] }) {
  const rows = useMemo(
    () =>
      colors.map((c, row) => {
        const r = radius + row * 0.46;
        const n = Math.round((length * r) / 0.75);
        const w = (length * r) / n - 0.05;
        const h = 0.3 + row * 0.32;
        const geo = new RoundedBoxGeometry(w, h, 0.42, 2, 0.06);
        const seats = Array.from({ length: n }, (_, k) => {
          const a = from + ((k + 0.5) / n) * length;
          return { p: [Math.sin(a) * r, h / 2, Math.cos(a) * r] as V3, rot: a };
        });
        return { c, geo, seats };
      }),
    [radius, from, length, colors],
  );
  return (
    <group>
      {rows.map((row, ri) =>
        row.seats.map((s, i) => (
          <mesh key={`${ri}-${i}`} geometry={row.geo} position={s.p} rotation={[0, s.rot, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={row.c} roughness={0.6} />
          </mesh>
        )),
      )}
    </group>
  );
}

const BLEACHER_COLORS = ["#ffa9c9", "#b69bff", "#7cc8ff"];

export function ArenaIsland() {
  const members = useApp((s) => s.settings.members);
  const matches = useApp((s) => s.matches);
  const { ranking, king } = useMemo(() => weeklyWins(matches), [matches]);
  // bục: giữa = hạng 1, trái = hạng 2, phải = hạng 3
  const podium: { x: number; h: number; color: string; who: MemberId }[] = [
    { x: 0, h: 0.8, color: "#ffd166", who: ranking[0] },
    { x: -1.08, h: 0.55, color: "#dfe6ee", who: ranking[1] },
    { x: 1.08, h: 0.36, color: "#f4a261", who: ranking[2] },
  ];
  return (
    <IslandBase radius={4.6} seed={5} grass="#93dc63">
      {/* sân thi đấu */}
      <mesh receiveShadow position={[0, 0.02, 0.3]}>
        <cylinderGeometry args={[2.9, 2.95, 0.05, 72]} />
        <meshStandardMaterial color="#bdeb8f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.06, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.045, 8, 96]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Bleachers radius={3.2} from={Math.PI * 0.72} length={Math.PI * 0.56} colors={BLEACHER_COLORS} />
      {podium.map((p, i) => (
        <group key={i} position={[p.x, 0, 0.3]}>
          <RoundedBox args={[1, p.h, 0.95]} radius={0.1} smoothness={4} position={[0, p.h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={p.color} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, p.h / 2, 0.48]}>
            <circleGeometry args={[0.16 - i * 0.03, 5]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <Blob
            who={p.who}
            color={members[p.who].color}
            position={[0, p.h, 0]}
            scale={0.72}
            crown={i === 0 && king === p.who}
            mood={i === 2 && king ? "sad" : "happy"}
            bounce={i === 0 ? 1.2 : 0.6}
            seed={i}
          />
        </group>
      ))}
      <Trophy position={[0, 0, -1.7]} />
      <Village name="tent" position={[-3.3, 0, -0.6]} rotation={0.6} scale={1.8} />
      <Village name="tent" position={[3.3, 0, -0.6]} rotation={-0.6} scale={1.8} />
      <Village name="target" position={[-2.2, 0, 2.6]} rotation={0.5} scale={2.2} />
      <Village name="barrel" position={[2.6, 0, 2.3]} scale={2} />
      <Village name="crate_A_big" position={[2.95, 0, 2.0]} rotation={0.4} scale={2} />
      <Flag position={[-2.5, 0, 1.7]} color="#4f9dff" />
      <Flag position={[2.5, 0, 1.7]} color="#ff7eb6" />
      <Flag position={[-1.7, 0, -2.5]} color="#ffc23d" />
      <Flag position={[1.7, 0, -2.5]} color="#3fbf7f" />
      <Balloon position={[-3.4, 2.6, 0.8]} color="#ffc23d" seed={3} />
      <Balloon position={[3.3, 2.9, 0.4]} color="#b69bff" seed={4} />
      <Balloon position={[3.7, 2.4, 1.2]} color="#ff5d7a" seed={5} />
      <Foliage radius={4.6} inner={3.75} trees={5} bushes={10} small={10} seed={21} />
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
    <mesh castShadow position={[0, 0, -0.1]}>
      <extrudeGeometry args={[shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6 }]} />
      <meshPhysicalMaterial color="#ffc93c" roughness={0.3} clearcoat={1} emissive="#b07800" emissiveIntensity={0.2} />
    </mesh>
  );
}

function Camera3D() {
  return (
    <group>
      <RoundedBox args={[1.2, 0.8, 0.5]} radius={0.14} smoothness={4} castShadow>
        <meshPhysicalMaterial color="#ff8fbf" roughness={0.35} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.2, 40]} />
        <meshStandardMaterial color="#3d3d55" />
      </mesh>
      <mesh position={[0, 0, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.02, 40]} />
        <meshPhysicalMaterial color="#7cc8ff" roughness={0.05} clearcoat={1} />
      </mesh>
      <RoundedBox args={[0.24, 0.14, 0.22]} radius={0.05} position={[0.38, 0.45, 0]}>
        <meshStandardMaterial color="#ffd166" />
      </RoundedBox>
    </group>
  );
}

function Book3D() {
  return (
    <group rotation={[0.25, 0, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} rotation={[0, 0, 0.22 * s]}>
          <RoundedBox args={[0.82, 0.07, 1.12]} radius={0.03} position={[0.43 * s, 0, 0]} castShadow>
            <meshStandardMaterial color="#6c7bff" roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[0.74, 0.06, 1.02]} radius={0.02} position={[0.4 * s, 0.05, 0]}>
            <meshStandardMaterial color="#fffdf5" />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

export function SoonIsland({ kind, seed }: { kind: "moments" | "achievements" | "info"; seed: number }) {
  const grass = kind === "moments" ? "#9be36a" : kind === "achievements" ? "#8ad85c" : "#86d96e";
  return (
    <IslandBase radius={3.2} seed={seed} grass={grass}>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.9, 1.95, 0.05, 48]} />
        <meshStandardMaterial color="#f1dcb5" roughness={0.9} />
      </mesh>
      <Village name="building_scaffolding" position={[-0.35, 0.02, -0.3]} scale={1.05} />
      <Village name={kind === "moments" ? "building_stage_B" : kind === "achievements" ? "building_stage_C" : "building_stage_A"} position={[-0.35, 0.02, -0.3]} scale={1.3} />
      <Village name="resource_lumber" position={[1.2, 0, 0.5]} rotation={0.8} scale={1.6} />
      <Village name="wheelbarrow" position={[0.6, 0, 1.4]} rotation={-0.6} scale={2} />
      <Village name="ladder" position={[-1.45, 0, 0.6]} rotation={1.2} scale={1.6} />
      <Village name="crate_A_small" position={[1.4, 0, -0.6]} rotation={0.3} scale={2.2} />
      <TrafficCone position={[0.2, 0, 1.9]} />
      <TrafficCone position={[-0.8, 0, 1.7]} />
      <group position={[0.9, 2.5, 0.3]}>
        <Bob amp={0.18} speed={1.5} seed={seed} spin={kind === "achievements" ? 1 : 0.4}>
          {kind === "moments" && <Camera3D />}
          {kind === "achievements" && <StarShape />}
          {kind === "info" && <Book3D />}
        </Bob>
      </group>
      <Foliage radius={3.2} inner={2.2} trees={3} bushes={6} small={7} seed={seed * 3} />
    </IslandBase>
  );
}

export function DecoIsland({ radius, seed, building }: { radius: number; seed: number; building?: "windmill" | "tower" }) {
  return (
    <Bob amp={0.25} speed={0.6} seed={seed}>
      <IslandBase radius={radius} seed={seed}>
        {building === "windmill" && <Village name="building_windmill_yellow" scale={1.2} rotation={seed} />}
        {building === "tower" && <Village name="building_tower_B_red" scale={0.8} rotation={seed} />}
        <Foliage radius={radius} inner={building ? radius * 0.55 : 0} trees={Math.max(1, Math.round(radius * 1.3))} bushes={3} small={3} seed={seed} />
      </IslandBase>
    </Bob>
  );
}
