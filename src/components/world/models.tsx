"use client";
import { Clone, useGLTF } from "@react-three/drei";
import type { V3 } from "./parts";

/**
 * Mẫu 3D CC0 của KayKit (Kay Lousberg), gộp bằng scripts/build-models.sh
 *  - nature.glb : cây, bụi, cỏ, đá (KayKit Forest Nature Pack)
 *  - village.glb: lâu đài, nhà, cối xay, giàn giáo, đạo cụ (KayKit Medieval Hexagon)
 */
const NATURE = "/models/nature.glb";
const VILLAGE = "/models/village.glb";

export type NatureName =
  | "Tree_1_A" | "Tree_2_A" | "Tree_2_C" | "Tree_3_A" | "Tree_3_B" | "Tree_4_A" | "Tree_4_B" | "Tree_4_C"
  | "Bush_1_A" | "Bush_2_A" | "Bush_2_C" | "Bush_4_A" | "Bush_4_C" | "Bush_4_E"
  | "Grass_1_A" | "Grass_2_A" | "Grass_2_C"
  | "Rock_1_A" | "Rock_1_E" | "Rock_1_J" | "Rock_2_A";

export type VillageName =
  | "building_castle_blue" | "building_castle_red" | "building_windmill_yellow" | "building_well_blue"
  | "building_home_A_red" | "building_home_B_yellow" | "building_tower_A_blue" | "building_tower_B_red"
  | "building_market_green" | "building_watermill_blue" | "building_scaffolding"
  | "building_stage_A" | "building_stage_B" | "building_stage_C" | "fence_wood_straight" | "building_bridge_A"
  | "tent" | "target" | "barrel" | "crate_A_big" | "crate_A_small" | "sack" | "wheelbarrow"
  | "resource_lumber" | "ladder" | "bucket_water"
  | "flag_blue" | "flag_red" | "flag_yellow" | "flag_green" | "cloud_big" | "cloud_small";

type Props = { position?: V3; rotation?: number; scale?: number; shadow?: boolean };

function useNode(url: string, name: string) {
  const { nodes } = useGLTF(url);
  const node = nodes[name];
  if (!node) console.warn(`Không tìm thấy mẫu 3D: ${name}`);
  return node;
}

export function Nature({ name, position = [0, 0, 0], rotation = 0, scale = 1, shadow = true }: Props & { name: NatureName }) {
  const node = useNode(NATURE, `${name}_Color1`);
  if (!node) return null;
  return <Clone object={node} position={position} rotation={[0, rotation, 0]} scale={scale} castShadow={shadow} receiveShadow />;
}

export function Village({ name, position = [0, 0, 0], rotation = 0, scale = 1, shadow = true }: Props & { name: VillageName }) {
  const node = useNode(VILLAGE, name);
  if (!node) return null;
  return <Clone object={node} position={position} rotation={[0, rotation, 0]} scale={scale} castShadow={shadow} receiveShadow />;
}

useGLTF.preload(NATURE);
useGLTF.preload(VILLAGE);
