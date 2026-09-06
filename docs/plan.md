# Plan — TravelCraft

> ระบบแนะนำสถานที่ท่องเที่ยวแบบ Gamified Interactive Map
> เวอร์ชัน: 0.1 | วันที่: 06/09/2026 | สถานะ: กำลังดำเนินการ (สัปดาห์ที่ 6–7 / 12)

---

## 1. ภาพรวมโครงการ

TravelCraft รวบรวมการค้นหาสถานที่ท่องเที่ยว รูปภาพ วิดีโอ รีวิว และเส้นทางไว้ในแผนที่
แบบ Interactive ที่ให้อารมณ์เกม (Gamified Map) เพื่อให้การค้นหาสถานที่สนุกและครบจบในที่เดียว
แทนเดิมที่ผู้ใช้ต้องเปิดหลายเว็บไซต์ (Google Maps / YouTube / Instagram / รีวิว) แยกกัน

### 1.1 ผู้ใช้งานระบบ
| บทบาท | กลุ่มเป้าหมาย | สิ่งที่ได้จากระบบ |
|---|---|---|
| User | นักท่องเที่ยว, นักศึกษา, บุคคลทั่วไป | ค้นหา/สำรวจสถานที่แบบเกม, Favorite, รีวิว, สร้างแผนที่เอง |
| Admin | ทีมงาน/เจ้าของเว็บ, หน่วยงานส่งเสริมการท่องเที่ยว | จัดการข้อมูลสถานที่/สมาชิก/รีวิว, ดูสถิติ |

### 1.2 เทคโนโลยีที่ใช้จริง (Tech Stack ที่สร้างในโค้ด)
| ชั้น | เทคโนโลยี | หน้าที่ |
|---|---|---|
| Frontend | **React 19 + Vite + Tailwind CSS v4** | SPA, UI, Responsive |
| Backend | **Supabase (Backend-as-a-Service)** | Auth, PostgreSQL, Real-time, API |
| ความปลอดภัย | **Row Level Security (RLS)** | นโยบายสิทธิ์ระดับแถวของทุกตาราง |
| ไอคอน | lucide-react | ไอคอน UI |
| CI/CD (เป้าหมาย) | GitHub Actions + Vercel/Netlify + Supabase | Auto test + Deploy |

> **หมายเหตุ:** เทคโนโลยีในเอกสารเริ่มแรก (Vue.js, Godot Engine, SQLite, Express) ถูกแทนด้วย
> ชุดเทคโนโลยีที่สร้างงานจริงแล้วข้างต้น เพื่อให้ชิ้นงานสาธิตตรงกับเอกสารและลดงานที่ซ้ำซ้อน
> ด้วยการใช้ Supabase เป็น Backend-as-a-Service (ไม่ต้องเขียน Express Server เอง)

---

## 2. เฟสโครงการ (Phases)

| เฟส | ชื่อ | ผลผลิต (Deliverable) |
|---|---|---|
| **Phase 0** | เก็บและวิเคราะห์ Requirement | `requirements.md` |
| **Phase 1** | ออกแบบ UX/UI Wireframe | `wireframe.md` |
| **Phase 2** | Frontend + Interactive Map | หน้า Home, Map, Details, Auth |
| **Phase 3** | Backend/DB + Search/Filter/Favorite | ตาราง Supabase + ระบบค้นหา/กรอง + Favorite ลง DB |
| **Phase 4** | Review/Rating + YouTube/Google Maps | รีวิว+คะแนน (DB), วิดีโอ Embedded, เส้นทาง |
| **Phase 5** | Admin Dashboard + สถิติ | จัดการข้อมูล, ตัวเลขการใช้งานจริง |
| **Phase 6** | Testing | Unit + Integration + System Test Report |
| **Phase 7** | CI/CD + Deploy | GitHub Actions + เว็บขึ้นจริง |
| **Phase 8** | เอกสาร + นำเสนอ | รายงานโครงงาน, คู่มือ, สไลด์ |

---

## 3. ตารางการดำเนินงาน 12 สัปดาห์

| สัปดาห์ | งาน | Phase | สถานะ |
|---|---|---|---|
| 1 | ศึกษาความต้องการ, รวบรวมข้อมูลสถานที่, วิเคราะห์ผู้ใช้ | 0 | ✅ เสร็จ |
| 2 | วิเคราะห์ระบบและออกแบบฐานข้อมูล | 0 | ✅ เสร็จ |
| 3 | ออกแบบ UX/UI, โครงสร้างหน้าจอ | 1 | ✅ เสร็จ |
| 4 | พัฒนา Frontend: หน้าแรก, Auth (สมัคร/ล็อกอิน), หน้า Home | 2 | ✅ เสร็จ |
| 5 | พัฒนาแผนที่ Interactive + หน้า Details + Map Editor | 2 | ✅ เสร็จ |
| 6 | Backend/DB (Supabase), เชื่อมต่อ Auth/โปรไฟล์จริง | 3 | 🚧 กำลังทำ |
| 7 | ระบบค้นหาและกรองตามหมวด + Favorite | 3 | 🚧 กำลังทำ |
| 8 | รีวิวและให้คะแนน + YouTube Embed + Google Maps เส้นทาง | 4 | ⏳ เหลือ |
| 9 | Admin Dashboard + สถิติการใช้งานจริง | 5 | ⏳ เหลือ |
| 10 | ทดสอบระบบ (Unit, Integration, System) + แก้บั๊ก | 6 | ⏳ เหลือ |
| 11 | CI/CD GitHub Actions + Deploy ขึ้นใช้งานจริง | 7 | ⏳ เหลือ |
| 12 | เอกสารโครงงาน, คู่มือการใช้งาน, เตรียมนำเสนอ | 8 | ⏳ เหลือ |

### สัญลักษณ์สถานะ
- ✅ เสร็จแล้ว (มีโค้ด/ชิ้นงานแล้ว)
- 🚧 กำลังดำเนินการ (สัปดาห์ปัจจุบัน)
- ⏳ ยังไม่เริ่ม (งานที่เหลือ)

---

## 4. สถานะปัจจุบันของโค้ด (ตรวจจาก repo สัปดาห์ 6–7)

### 4.1 เทียบกับฟีเจอร์ที่วางไว้
| ฟีเจอร์ | สถานะ | ไฟล์อ้างอิง |
|---|---|---|
| สมัคร/เข้าสู่ระบบ/กู้รหัสผ่าน | ✅ มีแล้ว (Supabase Auth) | `src/pages/AuthPage.jsx`, `src/components/auth/*` |
| สำรวจแผนที่ Interactive + คลิก icon | ✅ มีแล้ว (mock data) | `src/pages/WorldMapPage.jsx`, `src/components/map/MapPins.jsx` |
| ดูรายละเอียดสถานที่ (ภาพ/ประวัติ/เวลา/ค่าเข้า/สถิติ) | ✅ มีแล้ว (mock data) | `src/pages/DetailsPage.jsx`, `src/components/details/*` |
| Map Editor (วาด/วาง POI/ปรับ background) | ✅ มีแล้ว | `src/pages/MapEditor.jsx` |
| หน้า My Maps + Favorite | 🔶 บางส่วน (localStorage/mock) | `src/pages/MyMapsPage.jsx` |
| ค้นหา/กรองตามหมวด (น้ำตก/วัด/จุดชมวิว/อุทยาน) | 🔶 อยู่ระหว่างทำ | `WorldMapPage`, `AppContext.jsx` |
| Community (publish/ดูแผนที่คนอื่น) | 🔶 อยู่ระหว่างทำ (mock) | `src/pages/CommunityPage.jsx` |
| Admin Dashboard (users/base maps/settings/reports) | 🔶 มี UI แล้ว (ข้อมูล mock) | `src/pages/AdminDashboard.jsx`, `src/components/admin/*` |
| รีวิวและให้คะแนน (เก็บลง DB) | ❌ ยังไม่มี | – |
| YouTube Video Embed | ❌ ยังไม่มี | – |
| Google Maps / เส้นทางเดินทาง | ❌ ยังไม่มี | – |
| สถิติการใช้งานจากข้อมูลจริง | ❌ ยังใช้ข้อมูลจำลอง | `SystemOverviewTab.jsx` |
| CI/CD + Deploy | ❌ ยังไม่มี | – |

### 4.2 โครงสร้างซอร์สโค้ดปัจจุบัน
```
src/
├─ App.jsx / main.jsx          # Router ภายใน (state-based)
├─ context/AppContext.jsx      # State กลาง: auth, pins, favorites, admin
├─ lib/supabaseClient.js       # Supabase client
├─ pages/                      # AuthPage, HomePage, WorldMapPage, DetailsPage,
│                              # MapEditor, MyMapsPage, CommunityPage, ProfilePage, AdminDashboard
└─ components/                 # auth/, admin/, map/, details/, common/
```

---

## 5. งานที่เหลือ (สัปดาห์ 8–12) ที่ต้องทำ

### 5.1 สัปดาห์ 8 — รีวิว/คะแนน + วิดีโอ + เส้นทาง (Phase 4)
- [ ] Design ตาราง `reviews`, `favorites` ใน Supabase (`supabase_schema.sql`) + RLS Policy
- [ ] ฟอร์มรีวิว: คะแนนดาว + ข้อความ, แก้ไข/ลบของตัวเอง, แสดงคะแนนรวมของสถานที่
- [ ] Admin: ลบรีวิวที่ไม่เหมาะสม (จัดการรีวิว)
- [ ] YouTube Embed จาก URL ที่ Admin กำหนด (เพิ่มช่องวิดีโอในข้อมูล POI)
- [ ] ลิงก์เส้นทางเดินทาง Google Maps (URL เปิด external: `https://www.google.com/maps/dir/?api=1&destination=...`)
- [ ] เปลี่ยน mock data เป็นข้อมูลจาก Supabase จริงสำหรับฟีเจอร์ Details

### 5.2 สัปดาห์ 9 — Admin Dashboard + สถิติ (Phase 5)
- [ ] ระบบ Overview: จำนวนผู้ใช้, จำนวนแผนที่/POI, POI ยอดนิยม, จำนวนรีวิว จากข้อมูลจริง
- [ ] CRUD สถานที่ท่องเที่ยว (POI) + จัดการหมวดหมู่ (น้ำตก/วัด/จุดชมวิว/อุทยานแห่งชาติ)
- [ ] จัดการรูปภาพ/วิดีโอของ POI
- [ ] จัดการสมาชิก: ดูรายชื่อ, ระงับ/เปิดใช้งาน, กำหนดสิทธิ์ admin
- [ ] Publish/ถอดแผนที่จาก Community (Moderation)

### 5.3 สัปดาห์ 10 — การทดสอบ (Phase 6)
- [ ] Unit Test: logic ฟังก์ชันค้นหา/กรอง, การคำนวณคะแนนรวม, ฟังก์ชัน auth
- [ ] Integration Test: Supabase Auth ↔ หน้าเว็บ, Favorite ↔ DB, รีวิว ↔ DB
- [ ] System/UAT Test: ทดสอบ flow หลักทั้งระบบ (สมัคร → ค้นหา → Favorite → รีวิว → admin)
- [ ] ทดสอบ Responsive (มือถือ/แท็บเล็ต/เดสก์ท็อป) + การเข้าถึง (accessibility)
- [ ] บันทึก Test Report และแก้ไขข้อผิดพลาด

### 5.4 สัปดาห์ 11 — CI/CD + Deploy (Phase 7)
- [ ] GitHub Actions workflow: `npm ci` → `npm run lint` → `npm run build` → deploy
- [ ] Deploy ขึ้น Vercel/Netlify (URL จริง) + ตั้ง env บน production
- [ ] Supabase production project/DB migration
- [ ] ตรวจสอบว่า CI เขียวตลอดเมื่อ push `main`

### 5.5 สัปดาห์ 12 — เอกสาร + นำเสนอ (Phase 8)
- [ ] รายงานโครงงาน (เล่ม) + เอกสารข้อเสนอโครงการ
- [ ] คู่มือผู้ใช้ (User Manual) และคู่มือ Admin
- [ ] สไลด์/สื่อนำเสนอ + เตรียมสาธิต (Demo Script)

---

## 6. Definition of Done (เกณฑ์ว่าฟีเจอร์ "เสร็จ")

- [ ] ฟีเจอร์ทำงานตาม Acceptance Criteria ใน `requirements.md`
- [ ] เก็บข้อมูลจริงใน Supabase (ไม่ใช่ mock/localStorage) สำหรับฟีเจอร์ที่กำหนด
- [ ] ผ่าน RLS: ผู้ใช้เห็น/แก้ไขได้เฉพาะข้อมูลที่ตัวเองมีสิทธิ์
- [ ] `npm run lint` และ `npm run build` ผ่าน
- [ ] ทดสอบด้วยตนเองบน flow หลักแล้วไม่พบบั๊ก
- [ ] Responsive ใช้งานได้บนมือถือ และแสดง Dark/Light theme ถูกต้อง

---

## 7. ความเสี่ยงและแนวทางการจัดการ

| ความเสี่ยง | ผลกระทบ | แนวทางจัดการ |
|---|---|---|
| API ภายนอก (YouTube/Google Maps) ล่มหรือถูกบล็อก | หน้า Details ใช้งานไม่ได้ | ใช้ Embed ผ่าน URL + fallback ให้โชว์ลิงก์เปิดแยก, โหลดแบบ lazy |
| เวลาเหลือน้อยกว่าที่วาง (12 สัปดาห์) | ฟีเจอร์ไม่ครบ | ใช้ MoSCoW ใน `requirements.md`, ทำ Must ก่อน, ตัด Could ออกได้ |
| ข้อมูลสถานที่จริงไม่เพียงพอ | เว็บดูว่าง | Seed data จริงจากแหล่งท่องเที่ยวในไทย + เปิดให้ community เพิ่ม POI |
| รีวิวสแปม/ไม่เหมาะสม | เนื้อหาอันตราย | Admin จัดการรีวิวได้ + รายงาน POI (มี ReportedLocationsTab แล้ว) |
| ปัญหาสิทธิ์/RLS ผิด | ข้อมูลรั่ว | ทดสอบสิทธิ์ทุก Table ก่อน deploy |

---

## 8. Outlook หลังโครงงาน (Future Work)

- Mobile Web App / PWA / แอปพลิเคชันมือถือ
- ระบบนำทาง turn-by-turn ภายในแอป (แทนการเปิด Google Maps แยก)
- AI แนะนำสถานที่จากพฤติกรรมผู้ใช้และหมวดที่ชอบ
- ระบบเก็บ Coin/Level/เหรียญรางวัลจริงสำหรับผู้ใช้
- สถิติยอดนิยมรายภูมิภาคสำหรับหน่วยงานส่งเสริมการท่องเที่ยว