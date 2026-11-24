"use client";
import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { sound } from "@/lib/sound";
import { Nature } from "./models";
import { Balloon, Bob, Flag, Flower, IslandBase, rng, type V3 } from "./parts";

/** Xe & đạo cụ: Kenney Toy Car Kit (CC0) */
const CAR_DIR = "/models/cars";
const CARS = ["vehicle-racer", "vehicle-monster-truck", "vehicle-speedster", "vehicle-truck"] as const;
type CarName = (typeof CARS)[number];
const PROPS = ["gate-finish", "item-coin-gold", "item-box", "item-cone"] as const;

const ROAD_W = 1.9;
/**
 * 2 làn, mỗi làn 2 xe chạy cách nhau nửa vòng với cùng tốc độ trung bình
 * → xe cùng làn không bao giờ đụng nhau; xe khác làn vẫn vượt nhau.
 */
const LANES = [-0.45, 0.45, -0.45, 0.45];
const LANE_SPEED = [0.07, 0.078];
const CAR_SCALE: Record<string, number> = { "vehicle-monster-truck": 0.95, "vehicle-truck": 1.05 };

/** Đường đua khép kín hình hạt đậu */
function useTrack(radius: number) {
  return useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rx = radius * 0.64 * (1 + 0.08 * Math.cos(2 * a));
      const rz = radius * 0.44 * (1 - 0.18 * Math.cos(2 * a) * Math.sin(a));
      pts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    return curve;
  }, [radius]);
}

function ribbon(curve: THREE.Curve<THREE.Vector3>, segments: number, inner: number, outer: number, y: number, color?: (i: number) => THREE.Color) {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPointAt(u % 1);
    const t = curve.getTangentAt(u % 1);
    const side = new THREE.Vector3().crossVectors(up, t).normalize();
    const a = p.clone().addScaledVector(side, inner);
    const b = p.clone().addScaledVector(side, outer);
    pos.push(a.x, y, a.z, b.x, y, b.z);
    if (color) {
      const c = color(i);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    if (i < segments) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); // mặt hướng lên
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (color) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Track({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const { road, curbL, curbR, dashes, start } = useMemo(() => {
    const segs = 240;
    const red = new THREE.Color("#ff5d5d");
    const white = new THREE.Color("#ffffff");
    const curb = (i: number) => (Math.floor(i / 4) % 2 ? red : white);
    const road = ribbon(curve, segs, -ROAD_W / 2, ROAD_W / 2, 0.04);
    const curbL = ribbon(curve, segs, -ROAD_W / 2 - 0.16, -ROAD_W / 2, 0.06, curb);
    const curbR = ribbon(curve, segs, ROAD_W / 2, ROAD_W / 2 + 0.16, 0.06, curb);
    const dashes = Array.from({ length: 36 }, (_, i) => {
      const u = (i + 0.5) / 36;
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      return { p: [p.x, 0.05, p.z] as V3, rot: Math.atan2(t.x, t.z) };
    });
    const sp = curve.getPointAt(0);
    const st = curve.getTangentAt(0);
    return { road, curbL, curbR, dashes, start: { p: [sp.x, 0.055, sp.z] as V3, rot: Math.atan2(st.x, st.z) } };
  }, [curve]);
  const checker = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 16;
    const x = c.getContext("2d")!;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) {
      x.fillStyle = (i + j) % 2 ? "#222" : "#fff";
      x.fillRect(i * 4, j * 4, 4, 4);
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color="#5f6680" roughness={0.9} />
      </mesh>
      <mesh geometry={curbL} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </mesh>
      <mesh geometry={curbR} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </mesh>
      {dashes.map((d, i) => (
        <mesh key={i} position={d.p} rotation={[-Math.PI / 2, 0, d.rot]}>
          <planeGeometry args={[0.08, 0.32]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh position={start.p} rotation={[-Math.PI / 2, 0, start.rot + Math.PI / 2]}>
        <planeGeometry args={[ROAD_W, 0.4]} />
        <meshStandardMaterial map={checker} />
      </mesh>
      <Prop name="gate-finish" position={[start.p[0], 0.05, start.p[2]]} rotation={start.rot} scale={2.5} />
    </group>
  );
}

function Prop({ name, position, rotation = 0, scale = 1 }: { name: (typeof PROPS)[number]; position: V3; rotation?: number; scale?: number }) {
  const { scene } = useGLTF(`${CAR_DIR}/${name}.glb`);
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = m.receiveShadow = true;
    });
    return o;
  }, [scene]);
  return <primitive object={obj} position={position} rotation={[0, rotation, 0]} scale={scale} />;
}

function Car({ name, curve, lane, speed, phase, seed }: { name: CarName; curve: THREE.CatmullRomCurve3; lane: number; speed: number; phase: number; seed: number }) {
  const { scene } = useGLTF(`${CAR_DIR}/${name}.glb`);
  const { obj, wheels } = useMemo(() => {
    const o = scene.clone(true);
    const wheels: THREE.Object3D[] = [];
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) m.castShadow = true;
      if (m.name.startsWith("wheel")) wheels.push(m);
    });
    return { obj: o, wheels };
  }, [scene]);
  const ref = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const state = useRef({ u: phase, offset: 0, boost: 0, hop: 0 });
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const side = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    const s = state.current;
    const t = clock.elapsedTime;
    // Vị trí tính thẳng từ thời gian: nhanh/chậm dao động (để vượt nhau) nhưng có giới hạn,
    // cộng thêm phần tăng tốc khi bé chạm vào xe — phần này tự giảm dần về 0.
    s.offset += s.boost * speed * dt;
    s.offset *= Math.exp(-dt * 0.35);
    s.boost = Math.max(0, s.boost - dt * 0.8);
    s.hop = Math.max(0, s.hop - dt * 2.2);
    const u = phase + speed * (t + 0.6 * Math.sin(t * 0.45 + seed * 1.7) + 0.12 * Math.sin(t * 1.1 + seed)) + s.offset;
    const du = (((u - s.u) % 1) + 1) % 1;
    s.u = u;
    const uu = ((u % 1) + 1) % 1;
    const p = curve.getPointAt(uu);
    const tan = curve.getTangentAt(uu);
    side.crossVectors(up, tan).normalize();
    g.position.set(p.x + side.x * lane, 0.06, p.z + side.z * lane);
    g.rotation.y = Math.atan2(-tan.x, -tan.z);
    if (body.current) {
      const hop = Math.sin(s.hop * Math.PI) * 0.5;
      body.current.position.y = hop + Math.abs(Math.sin(t * 14 + seed)) * 0.012;
      body.current.rotation.x = -s.hop * 0.4;
    }
    for (const w of wheels) w.rotation.x -= du * 60;
  });

  const onTap = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    state.current.boost = 1.2;
    state.current.hop = 1;
    sound.honk(seed);
  };

  return (
    <group ref={ref}>
      <group ref={body} onClick={onTap} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
        <primitive object={obj} scale={CAR_SCALE[name] ?? 1.15} />
      </group>
    </group>
  );
}

function Spinner({ children, position }: { children: React.ReactNode; position: V3 }) {
  return (
    <group position={position}>
      <Bob amp={0.15} speed={2} spin={2} seed={position[0]}>
        {children}
      </Bob>
    </group>
  );
}

export function RaceIsland() {
  const R = 6.2;
  const k = R / 5.4;
  const curve = useTrack(R);
  const flowers = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: 14 }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = 0.4 + r() * 1.2;
      return { p: [Math.cos(a) * d * 1.2, 0, Math.sin(a) * d * 0.5] as V3, c: ["#ff7eb6", "#ffd43b", "#ffffff"][i % 3] };
    });
  }, []);
  return (
    <IslandBase radius={R} seed={77} grass="#8fdc5c">
      <Track curve={curve} />
      {CARS.map((c, i) => (
        <Car key={c} name={c} curve={curve} lane={LANES[i % LANES.length]} speed={LANE_SPEED[i % 2]} phase={i * 0.25} seed={i} />
      ))}
      {/* sân cỏ giữa đường đua */}
      <Spinner position={[-0.9, 0.7, -0.1]}>
        <Prop name="item-box" position={[0, 0, 0]} scale={1.3} />
      </Spinner>
      <Spinner position={[0.9, 0.8, 0.1]}>
        <Prop name="item-coin-gold" position={[0, 0, 0]} scale={2} />
      </Spinner>
      <Spinner position={[0, 1.0, -0.3]}>
        <Prop name="item-coin-gold" position={[0, 0, 0]} scale={2} />
      </Spinner>
      {[[-1.5, 0.3], [1.5, -0.3], [0, 0.5]].map(([x, z], i) => (
        <Prop key={i} name="item-cone" position={[x, 0.02, z]} scale={1.6} />
      ))}
      {flowers.map((f, i) => (
        <Flower key={i} position={f.p} color={f.c} />
      ))}
      <Flag position={[-5.4, 0, 0.4]} color="#ff5d5d" />
      <Flag position={[5.4, 0, -0.4]} color="#4f9dff" />
      <Balloon position={[-4.8, 2.8, -2.2]} color="#ffc23d" seed={7} />
      <Balloon position={[4.9, 3.1, 2.0]} color="#ff7eb6" seed={8} />
      {/* cây quanh mép, chừa đường đua */}
      {[
        ["Tree_4_A", -4.4, -2.4, 0.3], ["Tree_3_A", 4.5, 2.3, 0.36], ["Tree_4_B", 3.2, -3.9, 0.24], ["Tree_1_A", -3.4, 3.7, 0.33],
        ["Bush_4_C", -0.6, 4.6, 0.4], ["Bush_2_C", 1.4, -4.7, 0.35], ["Bush_4_A", -4.9, 1.6, 0.9], ["Bush_2_A", 4.9, -1.5, 0.9],
      ].map(([n, x, z, s], i) => (
        <Nature key={i} name={n as "Tree_4_A"} position={[(x as number) * k, 0, (z as number) * k]} scale={s as number} rotation={i} />
      ))}
    </IslandBase>
  );
}

for (const c of [...CARS, ...PROPS]) useGLTF.preload(`${CAR_DIR}/${c}.glb`);
