#!/usr/bin/env bash
# Gộp các mẫu 3D đã chọn (CC0, KayKit by Kay Lousberg) thành 2 file .glb gọn nhẹ.
#
# Cách dùng:
#   FOREST=<thư mục gltf của KayKit Forest Nature Pack> \
#   HEX=<thư mục gltf của KayKit Medieval Hexagon Pack> \
#   bash scripts/build-models.sh
#
# Nguồn tải:
#   Forest:  https://kaylousberg.itch.io/kaykit-forest  (bản Free)
#   Hexagon: https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0
set -euo pipefail
: "${FOREST:?cần đặt FOREST}"
: "${HEX:?cần đặt HEX}"
OUT=public/models
TMP=$(mktemp -d)
mkdir -p "$OUT"

NATURE=(
  Tree_1_A_Color1 Tree_2_A_Color1 Tree_2_C_Color1 Tree_3_A_Color1 Tree_3_B_Color1
  Tree_4_A_Color1 Tree_4_B_Color1 Tree_4_C_Color1
  Bush_1_A_Color1 Bush_2_A_Color1 Bush_2_C_Color1 Bush_4_A_Color1 Bush_4_C_Color1 Bush_4_E_Color1
  Grass_1_A_Color1 Grass_2_A_Color1 Grass_2_C_Color1
  Rock_1_A_Color1 Rock_1_E_Color1 Rock_1_J_Color1 Rock_2_A_Color1
)
VILLAGE=(
  buildings/blue/building_castle_blue buildings/red/building_castle_red
  buildings/yellow/building_windmill_yellow buildings/blue/building_well_blue
  buildings/red/building_home_A_red buildings/yellow/building_home_B_yellow
  buildings/blue/building_tower_A_blue buildings/red/building_tower_B_red
  buildings/green/building_market_green buildings/blue/building_watermill_blue
  buildings/neutral/building_scaffolding buildings/neutral/building_stage_A
  buildings/neutral/building_stage_B buildings/neutral/building_stage_C
  buildings/neutral/fence_wood_straight buildings/neutral/building_bridge_A
  decoration/props/tent decoration/props/target decoration/props/barrel
  decoration/props/crate_A_big decoration/props/crate_A_small decoration/props/sack
  decoration/props/wheelbarrow decoration/props/resource_lumber decoration/props/ladder
  decoration/props/bucket_water
  decoration/props/flag_blue decoration/props/flag_red decoration/props/flag_yellow decoration/props/flag_green
  decoration/nature/cloud_big decoration/nature/cloud_small
)

merge() { # $1 = tên file ra, các tham số còn lại = file vào
  local name=$1; shift
  npx gltf-transform merge "$@" "$TMP/$name.glb" --merge-scenes
  npx gltf-transform dedup "$TMP/$name.glb" "$TMP/$name.glb"
  npx gltf-transform prune "$TMP/$name.glb" "$TMP/$name.glb"
  cp "$TMP/$name.glb" "$OUT/$name.glb"
}

merge nature $(for n in "${NATURE[@]}"; do echo "$FOREST/$n.gltf"; done)
merge village $(for n in "${VILLAGE[@]}"; do echo "$HEX/$n.gltf"; done)
rm -rf "$TMP"
ls -lh "$OUT"/*.glb
