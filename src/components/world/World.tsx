"use client";
import { Environment, Lightformer, OrbitControls, SoftShadows } from "@react-three/drei";
import { EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useApp } from "@/lib/store";
import { currentStreak, todayStr } from "@/lib/stats";
import type { IslandId } from "@/lib/types";
import { Bridge, Cloud, type V3 } from "./parts";
import { ArenaIsland, DecoIsland, HubIsland, SoonIsland } from "./islands";

type IslandDef = { id: IslandId; pos: V3; r: number; label: string; emoji: string; dot: string; soon?: boolean };

const ISLANDS: IslandDef[] = [
  { id: "hub", pos: [0, 0, 0], r: 6, label: "Nhà của", emoji: "🏰", dot: "#e94b6b" },
  { id: "arena", pos: [-12.5, 0.8, 4.5], r: 4.6, label: "Đấu trường", emoji: "⚔️", dot: "#ffb703" },
  { id: "moments", pos: [12, 1.4, -4], r: 3.2, label: "Khoảnh khắc", emoji: "📸", dot: "#ff7eb6", soon: true },
  { id: "achievements", pos: [11, -0.4, 7.5], r: 3.2, label: "Thành tích", emoji: "🏆", dot: "#9b7bff", soon: true },
  { id: "info", pos: [-9, 1.8, -10.5], r: 3.2, label: "Về con", emoji: "📒", dot: "#2ec4c4", soon: true },
];

const HOME_CAM = { pos: new THREE.Vector3(0, 19, 30), target: new THREE.Vector3(0, 0, 0) };

function edgePoint(a: IslandDef, b: IslandDef): V3 {
  const dir = new THREE.Vector3(b.pos[0] - a.pos[0], 0, b.pos[2] - a.pos[2]).normalize();
  return [a.pos[0] + dir.x * (a.r - 0.3), a.pos[1] + 0.03, a.pos[2] + dir.z * (a.r - 0.3)];
}

/** Bay camera tới đảo được chọn và dịch khung hình khi có panel che một bên */
function CameraRig() {
  const focus = useApp((s) => s.focus);
  const panel = useApp((s) => s.panel);
  const { camera, controls, size } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: OrbitControlsImpl | null;
    size: { width: number; height: number };
  };
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const offset = useRef(0);

  useEffect(() => {
    const isl = ISLANDS.find((i) => i.id === focus);
    if (!isl || isl.id === "hub") {
      goal.current = { pos: HOME_CAM.pos.clone(), target: HOME_CAM.target.clone() };
      return;
    }
    const t = new THREE.Vector3(...isl.pos).add(new THREE.Vector3(0, 1, 0));
    goal.current = { pos: t.clone().add(new THREE.Vector3(0, 7.5, 12)), target: t };
  }, [focus]);

  useFrame((_, dt) => {
    // dịch khung hình: panel trái → đẩy cảnh sang phải và ngược lại
    const wide = size.width > 760;
    const panelW = Math.min(480, size.width * 0.45);
    const want = !wide ? 0 : panel === "arena" || panel === "soon" ? -panelW / 2 : panel === "settings" ? panelW / 2 : 0;
    offset.current += (want - offset.current) * (1 - Math.exp(-dt * 6));
    camera.setViewOffset(size.width, size.height, offset.current, 0, size.width, size.height);

    const g = goal.current;
    if (!g || !controls) return;
    const k = 1 - Math.exp(-dt * 2.8);
    camera.position.lerp(g.pos, k);
    controls.target.lerp(g.target, k);
    controls.update();
    if (camera.position.distanceTo(g.pos) < 0.05 && controls.target.distanceTo(g.target) < 0.05) goal.current = null;
  });

  // người dùng tự xoay → ngừng bay
  useEffect(() => {
    if (!controls) return;
    const stop = () => (goal.current = null);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);
  return null;
}

/** Các nhãn là DOM thường nằm trên canvas; LabelProjector cập nhật vị trí mỗi khung hình */
const labelEls = new Map<string, HTMLDivElement>();
const labelAnchor = (isl: IslandDef) => new THREE.Vector3(isl.pos[0], isl.pos[1] + (isl.id === "hub" ? 5.6 : 4.4), isl.pos[2]);

function LabelProjector() {
  const anchors = useMemo(() => ISLANDS.map((i) => [i.id, labelAnchor(i)] as const), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const [id, a] of anchors) {
      const el = labelEls.get(id);
      if (!el) continue;
      v.copy(a).project(camera);
      const visible = v.z < 1;
      el.style.opacity = visible ? "1" : "0";
      el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0) translate(-50%, -100%)`;
    }
  });
  return null;
}

function Label({ isl, bubble }: { isl: IslandDef; bubble?: string }) {
  const openIsland = useApp((s) => s.openIsland);
  const childName = useApp((s) => s.settings.childName);
  const text = isl.id === "hub" ? `${isl.label} ${childName}` : isl.label;
  return (
    <div
      ref={(el) => {
        if (el) labelEls.set(isl.id, el);
        else labelEls.delete(isl.id);
      }}
      className="absolute left-0 top-0 flex flex-col items-center gap-1.5 opacity-0 will-change-transform select-none"
    >
      {bubble && (
        <div className="bubble animate-floaty whitespace-nowrap rounded-2xl bg-[#fff7e6] px-3 py-1.5 text-sm font-semibold text-[#5b4a2f] shadow-md ring-2 ring-[#ffe2a8]">
          {bubble}
        </div>
      )}
      <button
        onClick={() => openIsland(isl.id)}
        className="pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 py-1.5 pl-1.5 pr-4 text-[17px] font-extrabold text-[#2b2d42] shadow-lg ring-[3px] transition hover:scale-110 active:scale-95"
        style={{ ["--tw-ring-color" as string]: isl.dot + "66" }}
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-full text-lg" style={{ background: isl.dot + "22" }}>
          {isl.emoji}
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: isl.dot }} />
        </span>
        {text}
        {isl.soon && <span className="rounded-full bg-[#fff1d6] px-2 py-0.5 text-xs font-bold text-[#c98a1b]">🚧 Sắp mở</span>}
      </button>
    </div>
  );
}

function Labels() {
  const bubbles = useBubbles();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ISLANDS.map((isl) => (
        <Label key={isl.id} isl={isl} bubble={isl.id === "arena" ? bubbles.arena : isl.id === "hub" ? bubbles.hub : isl.soon ? bubbles.soon : undefined} />
      ))}
    </div>
  );
}

function Clickable({ id, children }: { id: IslandId; children: ReactNode }) {
  const openIsland = useApp((s) => s.openIsland);
  const [hover, setHover] = useState(false);
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const s = hover ? 1.03 : 1;
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * (1 - Math.exp(-dt * 10)));
  });
  useEffect(() => {
    document.body.style.cursor = hover ? "pointer" : "";
  }, [hover]);
  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        openIsland(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {children}
    </group>
  );
}

function useBubbles() {
  const matches = useApp((s) => s.matches);
  const members = useApp((s) => s.settings.members);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 6000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    const today = todayStr();
    const playedToday = matches.some((m) => m.date === today);
    const streak = currentStreak(matches, "son");
    const arena = [
      playedToday ? "Hôm nay thi xong rồi! 🎉" : "Hôm nay thi gì nhỉ? 🤔",
      streak >= 2 ? `${members.son.name} đang chuỗi ${streak} ngày 🔥` : `${members.dad.name} ơi, ${members.son.name} sẽ thắng! 💪`,
      "Bấm vào đây để thi đấu nha!",
    ];
    const hub = ["Chào mừng về nhà! 🏡", "Bay qua cầu để khám phá nè~", "Hôm nay vui không? 😊"];
    return {
      arena: arena[tick % arena.length],
      hub: hub[tick % hub.length],
      soon: ["Đang xây nè~ 🔨", "Sắp xong rồi!", "Chờ chút nha~"][tick % 3],
    };
  }, [matches, members, tick]);
}

function Scene() {
  const hub = ISLANDS[0];
  const quality = useApp((s) => s.settings.quality);
  return (
    <>
      <hemisphereLight args={["#ffffff", "#bfe3ff", 0.6]} />
      <directionalLight
        castShadow={quality === "high"}
        position={[14, 26, 12]}
        intensity={2.2}
        color="#fff6e6"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      {/* Ánh sáng môi trường mềm như studio, không cần tải file HDR */}
      <Environment resolution={128} frames={1} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#cfe8ff" position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fff0d6" position={[8, 2, -4]} rotation-y={-Math.PI / 2} scale={[20, 6, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#d9f2ff" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>
      <fog attach="fog" args={["#d6eeff", 50, 120]} />

      {ISLANDS.map((isl) => (
        <group key={isl.id} position={isl.pos}>
          <Clickable id={isl.id}>
            {isl.id === "hub" && <HubIsland />}
            {isl.id === "arena" && <ArenaIsland />}
            {isl.id === "moments" && <SoonIsland kind="moments" seed={31} />}
            {isl.id === "achievements" && <SoonIsland kind="achievements" seed={41} />}
            {isl.id === "info" && <SoonIsland kind="info" seed={51} />}
          </Clickable>
        </group>
      ))}
      {ISLANDS.slice(1).map((isl) => (
        <Bridge key={isl.id} from={edgePoint(hub, isl)} to={edgePoint(isl, hub)} />
      ))}
      <LabelProjector />

      <group position={[1, -3, -17]}>
        <DecoIsland radius={2.2} seed={61} building="windmill" />
      </group>
      <group position={[-22, -1.5, -3]}>
        <DecoIsland radius={1.6} seed={71} />
      </group>
      <group position={[21, -2.5, 0]}>
        <DecoIsland radius={1.4} seed={81} />
      </group>
      <group position={[-3, -5, 15]}>
        <DecoIsland radius={1.8} seed={91} />
      </group>
      <group position={[-20, 2, -16]}>
        <DecoIsland radius={1.6} seed={101} building="tower" />
      </group>

      <Cloud position={[-20, 6, -12]} scale={1.6} speed={0.4} seed={1} />
      <Cloud position={[8, 8, -20]} scale={2.2} speed={0.25} seed={2} />
      <Cloud position={[18, 3, 10]} scale={1.3} speed={0.35} seed={3} />
      <Cloud position={[-6, -6, 8]} scale={2} speed={0.2} seed={4} />
      <Cloud position={[-28, -2, 12]} scale={1.4} speed={0.3} seed={5} />
    </>
  );
}

export default function World() {
  const quality = useApp((s) => s.settings.quality);
  const closePanel = useApp((s) => s.closePanel);
  return (
    <>
    <Canvas
      shadows={quality === "high"}
      dpr={quality === "high" ? [1, 2] : [1, 1.25]}
      camera={{ position: HOME_CAM.pos.toArray() as V3, fov: 42, near: 0.5, far: 200 }}
      gl={{ antialias: quality !== "high", alpha: true, toneMapping: THREE.NeutralToneMapping }}
      onPointerMissed={() => closePanel()}
    >
      {quality === "high" && <SoftShadows size={22} samples={12} focus={0.5} />}
      <Suspense fallback={null}>
        <Scene />
        {quality === "high" && (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <N8AO halfRes aoRadius={1.2} distanceFalloff={0.6} intensity={2.4} color="#3d3566" />
            <SMAA />
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
          </EffectComposer>
        )}
      </Suspense>
      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={9}
        maxDistance={50}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.25}
        rotateSpeed={0.6}
      />
    </Canvas>
    <Labels />
    </>
  );
}
