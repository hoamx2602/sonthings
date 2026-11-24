# 🏝️ Thế giới của con

Website lưu giữ mọi thứ về con, dạng thế giới đảo bay 3D.
Hiện có: **⚔️ Đấu trường**, nơi ghi lại các trận thi đấu hằng ngày giữa con và bố/mẹ.

## Chạy trên máy

```bash
npm install
npm run dev
# mở http://localhost:3000
```

Không cấu hình gì thì dữ liệu được lưu trong trình duyệt (localStorage).

## Dùng Supabase (để iPad và laptop thấy cùng dữ liệu)

1. Tạo project miễn phí tại https://supabase.com
2. Vào **SQL Editor**, dán nội dung `supabase/schema.sql` rồi bấm **Run**
3. Vào **Project Settings → API Keys**, copy `Project URL` và **Publishable key** (dạng `sb_publishable_...`)
4. Tạo file `.env.local` (theo mẫu `.env.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
5. Chạy lại `npm run dev`. Trong Cài đặt sẽ hiện "☁️ Dữ liệu lưu trên Supabase".

## Đưa lên mạng (Vercel)

```bash
npx vercel            # lần đầu: đăng nhập và tạo project
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx vercel --prod
```

Trên iPad: mở link bằng Safari → nút Chia sẻ → **Thêm vào MH chính** để có icon như app.

## Cấu trúc

```
app/                      Next.js (layout, trang chính, CSS)
src/lib/                  dữ liệu, thống kê/huy chương, âm thanh, store
src/components/world/     thế giới 3D (đảo, cầu, mây, nhân vật, mẫu KayKit)
public/models/            mẫu 3D .glb
scripts/build-models.sh   gộp mẫu 3D đã chọn
src/components/arena/     bảng Đấu trường (thi đấu, tỉ số, lịch sử, huy hiệu)
src/components/ui/        avatar, huy chương 3D, màn ăn mừng, cài đặt
supabase/schema.sql       bảng dữ liệu
```

## Mẫu 3D
Cây, lâu đài, nhà, giàn giáo… là mẫu **CC0** của KayKit (Kay Lousberg); ô tô ở đảo Đường đua là Toy Car Kit **CC0** của Kenney. Xem `public/models/README.md`.
Nhân vật Con/Bố/Mẹ hiện vẫn là nhân vật tròn tự dựng, có thể thay bằng file `.glb` tạo bằng AI sau.

## Luật huy chương
- Mỗi trận thắng được 1 huy chương. Thắng liên tiếp **3 ngày** thì lên 🥈, **7 ngày** thì lên 🥇
- Hòa: không ai có huy chương
- Người thua có thể nhận ⭐ "cố gắng" (bật/tắt trong Cài đặt)
