# Mẫu 3D

| File | Nguồn | Giấy phép |
|---|---|---|
| `nature.glb` | [KayKit Forest Nature Pack](https://kaylousberg.itch.io/kaykit-forest), Kay Lousberg | CC0 |
| `village.glb` | [KayKit Medieval Hexagon Pack](https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0), Kay Lousberg | CC0 |
| `cars/*.glb` | [Toy Car Kit](https://kenney.nl/assets/toy-car-kit), Kenney | CC0 |

`nature.glb` và `village.glb` được gộp từ các mẫu gốc bằng `scripts/build-models.sh`.
Thư mục `cars/` là file gốc của Kenney (mỗi xe một file vì bánh xe là node riêng để quay).
Muốn thêm mẫu: thêm tên vào danh sách trong script, chạy lại, rồi khai báo tên trong `src/components/world/models.tsx`.

Cảm ơn Kay Lousberg (www.kaylousberg.com) và Kenney (www.kenney.nl) ❤️
