# Supabase + Vercel Setup — Plan A (ใช้ Project เดิม)

> Project เดิม: `https://kwphqmvlbltxmlccmexb.supabase.co`
> ไฟล์ env โลคอล: `.env.local:1-2`
> Client: `src/lib/supabaseClient.js:1-17`

## 1. ผลตรวจวันนี้ (08/09/2026)

| ทดสอบ | ผล |
|---|---|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` โหลดได้ | ✅ `isSupabaseConfigured=true` (`supabaseClient.js:17`) |
| `supabase.auth.getSession()` | ✅ ไม่มี error, session=null (ยังไม่ login) |
| `supabase.from('maps').select('*')` | ✅ ได้ 1 แถว `comm-user-draft-17887...:public` |
| `supabase.from('users').select('*')` | ✅ 1 แถว |
| `storage.from('media').list()` | ✅ bucket `media` มีอยู่ (`supabase_schema.sql:125`) |
| RLS anon insert | ✅ ถูก block `new row violates row-level security policy` (`supabase_schema.sql:109`) |
| `npm run build` | ✅ ผ่าน (812kB) |

## 2. ทำไมต้องตั้ง Env บน Vercel (Plan A)

`.gitignore:14` มี `*.local` ทำให้ `.env.local` ไม่ถูก commit → Vercel จะไม่เห็น `VITE_SUPABASE_URL` → `supabaseClient.js:3` ได้ `''` → ตกโหมด offline demo

**Plan A: ไม่แก้ `.gitignore` ไปตั้ง Env บน Vercel แทน (ปลอดภัยกว่า)**

## 3. ขั้นตอนตั้ง Env บน Vercel

1. เปิด Vercel Dashboard → เลือก Project `Project-TravelCraft`
2. `Settings` → `Environment Variables`
3. เพิ่ม 2 ตัว:

| Key | Value (copy จาก `.env.local`) | Environment |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://kwphqmvlbltxmlccmexb.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_1Vdz9aFo75RXsNLMzUyWHg_QAW1T7TV` | Production, Preview, Development |

4. กด `Save` → `Deployments` → `Redeploy` (ต้อง redeploy ถึงจะโหลด env ใหม่)
5. ตรวจว่า Deploy log ไม่มี `Supabase map sync skipped`

> ห้ามใส่ `service_role` key ลง Vercel env ที่เป็น `VITE_` (จะหลุดไป client)

## 4. Supabase Dashboard ที่ต้องตรวจ

- `SQL Editor` → รัน `supabase_schema.sql` ทั้งไฟล์แล้วหรือยัง (ถ้ายัง: copy วางแล้ว Run)
- `Table Editor`: `public.users`, `public.admins`, `public.maps` ต้องมี
- `Storage`: bucket `media` ต้อง `public=true`
- `Authentication` → `Providers`: Email เปิดอยู่ (จำเป็น), Google/Facebook ดู `docs/OAUTH_SETUP.md`
- `Database` → `Realtime` → Enable `public.maps` + `public.users` (ไม่งั้น `src/context/AppContext.jsx:825` จะไม่ sync)

## 5. ทดสอบว่าเชื่อมจริงหลัง Deploy

1. เปิดเว็บ Vercel → สมัคร user ใหม่ → ดู `Table Editor` → `public.users` ต้องมีแถวใหม่ (trigger `handle_new_user` : `supabase_schema.sql:54`)
2. Login → สร้าง Map ใน `MapEditor` → Publish → `public.maps` ต้องมีแถวใหม่ + เปิดอีก browser ต้องเห็น Realtime
3. อัพรูป cover → `storage` → `media/maps/<mapId>/cover.jpg` ต้องมีไฟล์ + `getPublicUrl` ต้องเปิดได้ (`supabaseUploads.js:19`)

## 6. โลคอลยังใช้งาน

```bash
# .env.local มีอยู่แล้ว ไม่ต้องทำอะไร
npm run dev
# เปิด http://localhost:5173 → Login → ทดสอบตามข้อ 5
npm run build # ต้องผ่านก่อน push
```

## 7. OAuth (ถ้าจะใช้ Google/Facebook)

ทำตาม `docs/OAUTH_SETUP.md` — เพิ่ม `Site URL` = Vercel URL ใน Supabase `Authentication` → `URL Configuration` และเพิ่ม redirect URI ใน Google Cloud / Facebook Developers เป็น `https://kwphqmvlbltxmlccmexb.supabase.co/auth/v1/callback`
