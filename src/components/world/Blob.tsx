"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { MemberId } from "@/lib/types";
import type { V3 } from "./parts";

export type Mood = "happy" | "sad" | "wow";

/** Nhân vật tròn tròn. Con có mầm cây, Bố đội mũ, Mẹ có nơ */
export function Blob({
  who,
  color,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  mood = "happy",
  crown = false,
  bounce = 1,
  seed = 0,
}: {
  who: MemberId;
  color: string;
  position?: V3;
  rotationY?: number;
  scale?: number;
  mood?: Mood;
  crown?: boolean;
  bounce?: number;
  seed?: number;
}) {
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = body.current;
    if (!g) return;
    const t = clock.elapsedTime * (mood === "happy" ? 3.2 : 1.4) + seed;
    const b = Math.abs(Math.sin(t)) * 0.18 * bounce;
    g.position.y = b;
    const squash = 1 - (0.18 - b) * 0.35 * bounce;
    g.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* bóng dưới chân */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
      </mesh>
      <group ref={body}>
        <mesh castShadow position={[0, 0.48, 0]} scale={[1, 0.92, 1]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
        {/* mắt */}
        {[-0.16, 0.16].map((x) => (
          <group key={x} position={[x, 0.56, 0.43]}>
            {mood === "sad" ? (
              <mesh rotation={[0, 0, x > 0 ? 0.4 : -0.4]}>
                <boxGeometry args={[0.12, 0.03, 0.03]} />
                <meshStandardMaterial color="#1d1d2b" />
              </mesh>
            ) : (
              <>
                <mesh scale={[1, mood === "wow" ? 1.3 : 1.15, 0.6]}>
                  <sphereGeometry args={[0.07, 16, 16]} />
                  <meshStandardMaterial color="#1d1d2b" roughness={0.2} />
                </mesh>
                <mesh position={[0.02, 0.03, 0.04]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </>
            )}
          </group>
        ))}
        {/* má hồng */}
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x, 0.44, 0.38]} scale={[1, 0.6, 0.4]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#ff8fa3" transparent opacity={0.7} />
          </mesh>
        ))}
        {/* miệng */}
        {mood === "wow" ? (
          <mesh position={[0, 0.4, 0.46]} scale={[1, 1.2, 0.5]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color="#6b2737" />
          </mesh>
        ) : (
          <mesh position={[0, mood === "sad" ? 0.36 : 0.43, 0.46]} rotation={[0, 0, mood === "sad" ? 0 : Math.PI]}>
            <torusGeometry args={[0.07, 0.018, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#6b2737" />
          </mesh>
        )}
        {mood === "sad" && (
          <mesh position={[0.2, 0.46, 0.44]} scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color="#7cc8ff" roughness={0.1} />
          </mesh>
        )}
        <Accessory who={who} />
        {crown && <Crown />}
      </group>
    </group>
  );
}

function Accessory({ who }: { who: MemberId }) {
  if (who === "son")
    return (
      <group position={[0, 0.92, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.18, 6]} />
          <meshStandardMaterial color="#5aa83c" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.11 * s, 0.18, 0]} rotation={[0, 0, -0.5 * s]} scale={[1, 0.45, 0.6]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#7fd858" />
          </mesh>
        ))}
      </group>
    );
  if (who === "dad")
    return (
      <group position={[0, 0.86, 0]} rotation={[-0.15, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2f5fd0" />
        </mesh>
        <mesh position={[0, 0.0, 0.28]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.34, 0.03, 0.22]} />
          <meshStandardMaterial color="#2f5fd0" />
        </mesh>
      </group>
    );
  return (
    <group position={[0.22, 0.86, 0.05]} rotation={[0, 0, -0.4]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.09 * s, 0, 0]} rotation={[0, 0, (Math.PI / 2) * s]}>
          <coneGeometry args={[0.08, 0.16, 12]} />
          <meshStandardMaterial color="#ff4f8b" />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#ff4f8b" />
      </mesh>
    </group>
  );
}

function Crown() {
  return (
    <group position={[0, 0.95, 0]}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.22, 0.12, 16, 1, true]} />
        <meshStandardMaterial color="#ffc93c" metalness={0.3} roughness={0.3} emissive="#b07800" emissiveIntensity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.2, 0.12, Math.cos(a) * 0.2]}>
            <coneGeometry args={[0.05, 0.14, 6]} />
            <meshStandardMaterial color="#ffc93c" metalness={0.3} roughness={0.3} emissive="#b07800" emissiveIntensity={0.25} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.02, 0.21]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ff4f6d" />
      </mesh>
    </group>
  );
}
