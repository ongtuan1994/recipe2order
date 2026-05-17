# CLAUDE.md - Recipe to Order

> ไฟล์นี้ใช้เป็น context สำหรับ Claude Code ในการพัฒนาโปรเจกต์ Recipe to Order
> เมื่อ Claude Code อ่านไฟล์นี้แล้ว จะเข้าใจ project ทั้งหมดและช่วย code ได้ถูกต้อง

---

## 📋 Project Overview

**Recipe to Order** เป็นเว็บแอปจัดการสูตรอาหาร/เครื่องดื่ม สต็อกวัตถุดิบ และวางแผนการสั่งซื้อ สำหรับร้านคาเฟ่/เครื่องดื่มขนาดเล็ก

**กลุ่มเป้าหมาย:** เจ้าของร้านกาแฟ/เครื่องดื่ม/ร้านอาหารโฮมเมด

**Core Value:** ช่วยจัดการสูตร → ติดตาม stock → วางแผนสั่งซื้อ → คำนวณกำลังผลิต แบบครบวงจร

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon DB (PostgreSQL Serverless) |
| ORM | Prisma |
| Auth | NextAuth.js (Email + Google OAuth) |
| Image Storage | Vercel Blob |
| Excel Processing | `xlsx` (SheetJS) |
| PDF Generation | `@react-pdf/renderer` |
| Form Validation | `react-hook-form` + `zod` |
| State Management | Zustand (สำหรับ global state) + React Query |
| i18n | `next-intl` (รองรับ ไทย/อังกฤษ) |
| Deployment | Vercel |
| Cron Jobs | Vercel Cron |

---

## 🎯 Core Features (MVP)

### 1. Recipe Management
- **Sale Recipe**: สูตรขาย (ลาเต้, อเมริกาโน่) มีหลายขนาด (12oz, 16oz)
- **Prep Recipe**: สูตรเตรียม (นมมิกซ์จืด, ไซรัป) มี yield + shelf life
- Upload รูปเมนู
- Import/Export Excel
- Multi-step instructions (step 1, step 2, ...)

### 2. Ingredient Master
- **RAW**: ของซื้อ (นมสด, เมล็ดกาแฟ)
- **PREP**: ของเตรียมเอง (link กับ Prep Recipe)
- Multiple variants ต่อ ingredient เพื่อเปรียบเทียบราคา
- Upload รูป
- Set shelf life
- Import/Export Excel

### 3. Stock Batch Management
- เก็บ stock เป็น **batch** ตามวันที่เตรียม/นำเข้า
- Auto-calc วันหมดอายุจาก shelf life
- FIFO deduction
- Expiry alert / auto-mark expired
- Discard/waste tracking

### 4. Prep Production
- บันทึกการเตรียม prep ingredient
- หัก raw ingredients ตามสูตร
- สร้าง batch ใหม่อัตโนมัติ

### 5. Production Capacity Calculator
- คำนวณว่า stock ทำได้กี่หน่วย
- **Recursive**: explode prep → raw
- แสดง bottleneck

### 6. Sale Recording (Auto-deduct Stock)
- บันทึก "ขายลาเต้ 10 แก้ว"
- ระบบ auto-deduct stock จาก batch (FIFO)
- รายงานยอดขาย

### 7. Purchase Planning
- กำหนดเป้าขาย → คำนวณ raw ingredient ที่ต้องซื้อ
- Recursive explode ผ่าน prep recipe
- Export PDF shopping list

### 8. Unit Conversion
- รองรับการแปลงหน่วยภายในกลุ่มเดียวกัน:
  - Weight: g, kg, oz, lb
  - Volume: ml, l, fl oz, cup, tsp, tbsp
- ตอน import จาก variant ที่ใช้หน่วยต่างกัน

### 9. Multi-language
- ภาษาไทย (default) + อังกฤษ
- ใช้ `next-intl` + JSON locale files

### 10. Authentication
- Email/Password + Google OAuth
- Multi-tenant: user เห็นเฉพาะข้อมูลตัวเอง

---

## 📁 Project Structure

```
recipe-to-order/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar layout
│   │   ├── dashboard/page.tsx      # Overview + alerts
│   │   ├── recipes/
│   │   │   ├── page.tsx            # List
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx       # Detail
│   │   │   ├── [id]/edit/page.tsx
│   │   │   └── import/page.tsx     # Import wizard
│   │   ├── prep-recipes/
│   │   │   └── ... (same as recipes)
│   │   ├── ingredients/
│   │   │   └── ...
│   │   ├── stock/
│   │   │   ├── page.tsx            # Stock + batches
│   │   │   ├── prep/page.tsx       # Prep production
│   │   │   └── adjust/page.tsx
│   │   ├── capacity/page.tsx
│   │   ├── sales/
│   │   │   ├── page.tsx            # Sales list
│   │   │   └── new/page.tsx        # Record sale
│   │   └── purchase-plans/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── upload/route.ts         # Vercel Blob
│   │   ├── export/
│   │   │   ├── recipes/route.ts
│   │   │   └── ingredients/route.ts
│   │   ├── import/
│   │   │   ├── recipes/route.ts
│   │   │   └── ingredients/route.ts
│   │   ├── pdf/shopping-list/route.ts
│   │   └── cron/expire-batches/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── recipe/
│   ├── ingredient/
│   ├── stock/
│   └── shared/
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth config
│   ├── blob.ts                     # Vercel Blob helpers
│   ├── excel/
│   │   ├── recipe-export.ts
│   │   ├── recipe-import.ts
│   │   ├── ingredient-export.ts
│   │   └── ingredient-import.ts
│   ├── pdf/
│   │   └── shopping-list.tsx
│   ├── stock/
│   │   ├── fifo.ts                 # FIFO deduction logic
│   │   ├── capacity.ts             # Recursive capacity calc
│   │   └── explode.ts              # Explode prep → raw
│   ├── units/
│   │   └── conversion.ts           # Unit conversion
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── messages/                       # i18n
│   ├── th.json
│   └── en.json
├── middleware.ts                   # i18n + auth middleware
├── .env.example
├── package.json
└── README.md
```

---

## 🗄 Database Schema (Summary)

ดูรายละเอียดเต็มที่ `prisma/schema.prisma`

**Key Models:**
- `User` - ผู้ใช้
- `Category` - หมวดหมู่สูตร (กาแฟ, ชา, ฯลฯ)
- `Recipe` - สูตร (มี `recipeType`: SALE | PREP)
- `RecipeSize` - ขนาดของสูตร SALE (12oz, 16oz)
- `RecipeIngredient` - วัตถุดิบในสูตร
- `RecipeStep` - ขั้นตอนการทำ (step 1, 2, ...)
- `Ingredient` - วัตถุดิบ (มี `type`: RAW | PREP)
- `IngredientVariant` - variants เปรียบเทียบราคา
- `StockBatch` - batch ของ stock พร้อมวันหมดอายุ
- `StockMovement` - log การเคลื่อนไหวของ stock
- `PrepProduction` - บันทึกการเตรียม prep ingredient
- `Sale` - บันทึกการขาย
- `SaleItem` - รายการในบิลขาย
- `PurchasePlan` - แผนสั่งซื้อ
- `PurchasePlanItem` - เป้าขายในแผน

---

## 🧠 Critical Business Logic

### 1. FIFO Stock Deduction
เมื่อต้องการหัก stock ของ ingredient ใดๆ:
1. ดึง batch ที่ status=ACTIVE เรียงตาม `expiresAt` ASC (batch ใกล้หมดก่อน)
2. หักจาก batch ทีละตัว จนครบจำนวนที่ต้องการ
3. ถ้า batch หมด → status=DEPLETED
4. ถ้า stock ไม่พอ → throw error

```typescript
// lib/stock/fifo.ts
export async function deductStockFIFO(
  ingredientId: string,
  quantity: number,
  reason: string
): Promise<{ batchId: string; qty: number }[]>
```

### 2. Recursive Capacity Calculation
"สูตรนี้ทำได้กี่หน่วย?"
- สำหรับแต่ละ ingredient ในสูตร:
  - ถ้า RAW: ใช้ stock ตรง
  - ถ้า PREP: stock ปัจจุบัน + (ทำเพิ่มได้จาก raw)
- หาตัวที่จำกัด (min) = bottleneck

```typescript
// lib/stock/capacity.ts
export async function calculateCapacity(
  recipeSizeId: string
): Promise<{ maxUnits: number; bottleneck: Ingredient }>
```

### 3. Recursive Explode (Purchase Plan)
"ต้องซื้อ raw อะไรเท่าไหร่?"
- รับ list ของ {ingredientId, quantity}
- ถ้า ingredient เป็น PREP → recurse ผ่าน prep recipe → ได้ raw
- ถ้า RAW → คืนค่าตรง
- รวม raw ที่ซ้ำกัน
- หัก current stock

```typescript
// lib/stock/explode.ts
export async function explodeToRaw(
  items: { ingredientId: string; quantity: number }[]
): Promise<{ ingredientId: string; needed: number; toBuy: number }[]>
```

### 4. Unit Conversion
รองรับหน่วยใน 2 กลุ่ม:
- **Weight** (base = g): g, kg, oz, lb
- **Volume** (base = ml): ml, l, fl_oz, tsp, tbsp, cup

```typescript
// lib/units/conversion.ts
export function convert(value: number, fromUnit: string, toUnit: string): number
export function getBaseUnit(unit: string): 'g' | 'ml' | null
```

### 5. Auto-expire Cron
- Vercel Cron Job: ทุกวัน 00:01 (Asia/Bangkok)
- Endpoint: `/api/cron/expire-batches`
- Logic: หา batch ที่ `expiresAt < now()` AND `status=ACTIVE` → set status=EXPIRED + create StockMovement

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Mobile-first** - พนักงานใช้บนมือถือ/แท็บเล็ตขณะทำเครื่องดื่ม
2. **Information-dense** - แสดงข้อมูลที่จำเป็นเยอะแต่อ่านง่าย (เหมือนตาราง Coffee Menu)
3. **Quick actions** - ปุ่มสำคัญต้อง 1-2 tap
4. **Color coding** - ใช้สีบอกสถานะ:
   - 🟢 Green: stock OK
   - 🟡 Yellow: ใกล้หมด / ใกล้หมดอายุ
   - 🔴 Red: หมด / หมดอายุแล้ว
   - 🔵 Blue: PREP type
   - ⚪️ Gray: RAW type

### Component Library
- ใช้ **shadcn/ui** เป็นหลัก (Card, Button, Dialog, Form, Table, Badge, Tabs)
- Charts: **Recharts**
- Icons: **Lucide React**

### Typography
- ไทย: `IBM Plex Sans Thai` หรือ `Noto Sans Thai`
- อังกฤษ: `Inter`
- Code/Numbers: `JetBrains Mono`

---

## 🌍 Internationalization (i18n)

ใช้ `next-intl` + JSON locale files

```
messages/
├── th.json   # default
└── en.json
```

### Translation Keys Pattern
```json
{
  "common": {
    "save": "บันทึก",
    "cancel": "ยกเลิก"
  },
  "recipe": {
    "title": "สูตร",
    "create": "สร้างสูตรใหม่",
    "type": {
      "sale": "สูตรขาย",
      "prep": "สูตรเตรียม"
    }
  }
}
```

URL pattern: `/th/recipes` หรือ `/en/recipes`

---

## 🔐 Security & Best Practices

1. **Row-Level Security**: ทุก query ต้อง filter ด้วย `userId` ของ user ปัจจุบัน
2. **Server Actions** > API Routes สำหรับ mutation
3. **Zod validation** ทั้ง client + server
4. **No raw SQL** ยกเว้นจำเป็น (ใช้ Prisma)
5. **Image upload**: validate type + size ก่อน upload
6. **Excel import**: limit rows (สูงสุด 1000 rows ต่อครั้ง)
7. **Rate limiting** สำหรับ public endpoints (Upstash หรือ in-memory)
8. **Environment variables**: ห้าม commit `.env`

---

## 🧪 Testing Strategy

- **Unit tests**: Vitest สำหรับ business logic (FIFO, capacity, explode, conversion)
- **Integration tests**: Playwright สำหรับ critical flows
- **Manual testing**: PR ทุกครั้งต้องผ่าน manual checklist

### Critical Test Cases
1. FIFO deduction ข้าม batch
2. Recursive capacity ผ่าน 2 levels (sale → prep → raw)
3. Unit conversion ทุก pair
4. Import Excel ที่มี error (validation)
5. Auto-expire batch

---

## 📦 Environment Variables

```bash
# .env.example
# Database
DATABASE_URL="postgresql://..."           # Neon connection string (pooled)
DIRECT_URL="postgresql://..."             # Neon direct (สำหรับ migration)

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."                      # openssl rand -base64 32
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="..."

# Cron
CRON_SECRET="..."                          # for Vercel Cron auth

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEFAULT_LOCALE="th"
```

---

## 🚀 Deployment

### Vercel Setup
1. Connect GitHub repo
2. Set environment variables
3. Build command: `prisma generate && next build`
4. Set Vercel Cron Jobs ใน `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/expire-batches",
    "schedule": "1 17 * * *"
  }]
}
```
> Note: schedule เป็น UTC (17:01 UTC = 00:01 Thai time)

### Neon DB Setup
1. สร้าง project ที่ neon.tech
2. Copy connection strings (pooled + direct)
3. รัน migration: `npx prisma migrate deploy`
4. Seed (optional dev only): `npm run seed`

---

## 🎯 Development Workflow

### Coding Conventions
- **TypeScript strict mode** เปิด
- **ESLint** + **Prettier** ทุกไฟล์
- **Naming**:
  - Components: `PascalCase.tsx`
  - Utilities: `kebab-case.ts`
  - Server actions: ขึ้นต้นด้วย verb (`createRecipe`, `deductStock`)
- **File structure** ใน component:
  ```tsx
  // 1. imports
  // 2. types
  // 3. component
  // 4. helpers
  ```

### Git Workflow
- Branch: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- Commit message: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- PR template: description, testing, screenshots

### When Adding Features
1. อ่าน CLAUDE.md ก่อนเสมอ
2. เช็คว่าตรงกับ MVP scope หรือเป็น Phase 2/3
3. Update schema → migrate → generate types
4. เขียน business logic ใน `lib/` ก่อน (testable)
5. สร้าง UI ใน `app/` + `components/`
6. Update i18n keys ทั้งไทย/อังกฤษ
7. Test → commit → PR

---

## 📚 Reference Examples

### ตัวอย่างสูตรจริงจาก Coffee Menu (ใช้ใน seed data)

**SALE Recipes (ลาเต้เย็น 16oz):**
- เทนมมิกซ์จืด 120g
- ใส่น้ำแข็ง (1 ช้อนจากปาดแก้ว)
- Espresso (M) 40g
- ราดด้านบน
- ปิดฝาซิปเสิร์ฟ

**SALE Recipes (อเมริกาโน่ 16oz):**
- เทน้ำเย็น 120g
- ใส่น้ำแข็ง (1 ช้อนจากปาดแก้ว)
- Espresso (M) 40g
- ราดด้านบน
- ปิดฝาซิปเสิร์ฟ

**PREP Recipes (ตัวอย่าง นมมิกซ์จืด):**
- Yield: 1200g, Shelf life: 2 วัน
- นมสด 1000g + วิปครีม 200g

---

## 🤝 For Claude Code

เมื่อช่วย code ในโปรเจกต์นี้:

1. ✅ **อ่าน schema ก่อนเสมอ** - `prisma/schema.prisma`
2. ✅ **ใช้ types ที่ Prisma generate** - import จาก `@prisma/client`
3. ✅ **Server Actions** สำหรับ mutation - มี `'use server'` directive
4. ✅ **Validate ด้วย Zod** - schema ใน `lib/validations/`
5. ✅ **Multi-tenant**: ทุก query ต้องมี `userId` filter
6. ✅ **i18n**: ใช้ `useTranslations()` ใน client, `getTranslations()` ใน server
7. ✅ **เขียน comments** เป็นภาษาอังกฤษ (โค้ด) แต่ commit message สามารถเป็นไทยได้
8. ❌ **อย่าใช้** `any` type
9. ❌ **อย่า commit** ข้อมูลสำคัญ (passwords, API keys)
10. ❌ **อย่าข้าม** validation (ทั้ง client + server)

### Quick Commands
```bash
# Dev
npm run dev

# Database
npx prisma migrate dev      # create migration
npx prisma migrate deploy   # production
npx prisma studio           # GUI
npm run seed                # seed data

# Build
npm run build
npm run start

# Quality
npm run lint
npm run format
npm run type-check
```

---

## 📞 Need Help?

หากมีคำถามเกี่ยวกับ business logic หรือ requirement ที่ไม่ชัดเจน อ้างอิงจาก:
1. PRD เวอร์ชันล่าสุด (ในแชท)
2. ตาราง Coffee Menu (ไฟล์รูปใน chat history)
3. Wireframe เอกสาร (`docs/wireframes.md`)
4. Sprint Plan (`docs/sprint-plan.md`)
