# 📅 Sprint Plan - Recipe to Order (Phase 1 MVP)

> แผนพัฒนา **MVP** เป็นเวลา **8 สัปดาห์** (8 sprints)
> 1 sprint = 1 สัปดาห์
> เหมาะสำหรับ 1 developer ที่ใช้ Claude Code ช่วยพัฒนา

---

## 📋 Overview

| Sprint | สัปดาห์ | Focus | Key Deliverables |
|--------|---------|-------|------------------|
| 0 | Pre-work | Setup & Foundation | Project init, schema, auth |
| 1 | Week 1 | Recipe Management | CRUD Sale Recipe + UI |
| 2 | Week 2 | Ingredient + Variants | RAW + variants + comparison |
| 3 | Week 3 | Prep Recipe + Production | PREP type + production flow |
| 4 | Week 4 | Stock & Batch | Batch management + FIFO |
| 5 | Week 5 | Capacity + Sales | Recursive calc + sale recording |
| 6 | Week 6 | Purchase Plan + PDF | Plan + explode + PDF export |
| 7 | Week 7 | Excel + Images | Import/Export Excel + image upload |
| 8 | Week 8 | i18n + Polish + Deploy | TH/EN + testing + deployment |

---

## 🛠 Sprint 0 — Setup & Foundation (Pre-week)

**เป้าหมาย:** วาง infrastructure ให้พร้อม dev ใน sprint ถัดไป

### Tasks
- [ ] Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] สร้าง repository ที่ GitHub
- [ ] สร้าง Neon DB project + ดึง connection strings
- [ ] ติดตั้ง Prisma + import schema (จากไฟล์ที่เตรียมไว้)
- [ ] รัน `prisma migrate dev` สร้าง tables
- [ ] รัน seed data (`npm run seed`)
- [ ] Setup NextAuth.js (Email + Google OAuth)
- [ ] สร้าง login/register pages
- [ ] Setup `next-intl` + ไฟล์ `messages/th.json`, `messages/en.json` เปล่า
- [ ] สร้าง side nav layout + bottom tab nav (mobile)
- [ ] Setup ESLint + Prettier + Husky pre-commit
- [ ] Deploy แรกขึ้น Vercel (เพื่อเทสต์ pipeline)
- [ ] Setup CLAUDE.md ใน root project

### Definition of Done
- ✅ Login/Register ทำงานได้
- ✅ Database มี seed data
- ✅ Vercel deploy ได้
- ✅ Layout + nav แสดงผลถูกต้อง

### Tools/Libraries
```bash
npm install next@latest react react-dom typescript
npm install @prisma/client prisma
npm install next-auth @auth/prisma-adapter bcryptjs
npm install next-intl
npm install tailwindcss postcss autoprefixer
npm install lucide-react
npx shadcn-ui@latest init
```

---

## 🍵 Sprint 1 — Recipe Management (Week 1)

**เป้าหมาย:** จัดการสูตรขายแบบเต็มรูปแบบ (CRUD)

### User Stories
- US-1.1: เป็น user ฉันต้องการสร้างสูตรขายพร้อมหลายขนาด
- US-1.2: เป็น user ฉันต้องการเพิ่ม/ลบวัตถุดิบและขั้นตอนในสูตร
- US-1.3: เป็น user ฉันต้องการดู/แก้ไข/ลบสูตรที่มีอยู่
- US-1.4: เป็น user ฉันต้องการจัดหมวดหมู่สูตร

### Tasks
- [ ] สร้าง Category CRUD (server actions + UI)
- [ ] สร้างหน้า `/recipes` (list + filter + search)
- [ ] สร้างหน้า `/recipes/new` (form)
  - [ ] Component `RecipeForm` พร้อม react-hook-form + zod
  - [ ] Component `RecipeSizeEditor` (multi-size)
  - [ ] Component `IngredientPicker` (autocomplete)
  - [ ] Component `StepEditor` (drag-to-reorder)
- [ ] สร้างหน้า `/recipes/[id]` (detail view)
- [ ] สร้างหน้า `/recipes/[id]/edit`
- [ ] Server Actions:
  - [ ] `createRecipe()`
  - [ ] `updateRecipe()`
  - [ ] `deleteRecipe()` (soft delete)
  - [ ] `duplicateRecipe()`

### Definition of Done
- ✅ สร้างสูตร "ลาเต้เย็น 16oz" ได้ครบทั้ง ingredients + steps
- ✅ List page แสดง grid view สวยงาม
- ✅ Edit + delete ทำงาน
- ✅ Form validation ทำงาน (client + server)

### Files to Create
```
app/(dashboard)/recipes/page.tsx
app/(dashboard)/recipes/new/page.tsx
app/(dashboard)/recipes/[id]/page.tsx
app/(dashboard)/recipes/[id]/edit/page.tsx
components/recipe/RecipeForm.tsx
components/recipe/RecipeCard.tsx
components/recipe/RecipeSizeEditor.tsx
components/recipe/IngredientPicker.tsx
components/recipe/StepEditor.tsx
lib/actions/recipe.ts
lib/validations/recipe.ts
```

---

## 🥕 Sprint 2 — Ingredient + Variants (Week 2)

**เป้าหมาย:** จัดการวัตถุดิบ + เปรียบเทียบราคา

### User Stories
- US-2.1: เป็น user ฉันต้องการสร้าง/แก้ไข/ลบวัตถุดิบ
- US-2.2: เป็น user ฉันต้องการเพิ่ม variants หลายตัวเพื่อเปรียบเทียบราคา
- US-2.3: เป็น user ฉันต้องการเห็นว่ายี่ห้อไหนคุ้มที่สุด (auto-highlight)
- US-2.4: เป็น user ฉันต้องการตั้ง default variant ที่ใช้คำนวณราคา
- US-2.5: เป็น user ฉันต้องการตั้ง min stock alert

### Tasks
- [ ] สร้าง Ingredient CRUD (RAW only ก่อน — PREP ใน sprint 3)
- [ ] สร้างหน้า `/ingredients` (list + filter + search)
- [ ] สร้างหน้า `/ingredients/[id]` (detail with variants)
- [ ] Variant Management:
  - [ ] `IngredientVariantForm` (add/edit)
  - [ ] Auto-calc `pricePerBaseUnit`
  - [ ] Auto-highlight cheapest
  - [ ] Set default variant
- [ ] **Unit Conversion utility** (`lib/units/conversion.ts`):
  ```typescript
  convert(value: number, from: string, to: string): number
  ```
- [ ] Tests for unit conversion
- [ ] Server Actions: `createIngredient`, `updateIngredient`, `setDefaultVariant`

### Definition of Done
- ✅ สร้างนมสด 2 ยี่ห้อแล้วเห็นว่ายี่ห้อไหนคุ้มกว่า
- ✅ ตั้ง default variant ได้
- ✅ Unit conversion ทำงานทุก pair (g↔kg↔oz, ml↔l, etc.)
- ✅ Test coverage > 80% สำหรับ conversion logic

### Files to Create
```
app/(dashboard)/ingredients/page.tsx
app/(dashboard)/ingredients/[id]/page.tsx
components/ingredient/IngredientForm.tsx
components/ingredient/VariantList.tsx
components/ingredient/VariantForm.tsx
lib/actions/ingredient.ts
lib/units/conversion.ts
lib/units/conversion.test.ts
lib/validations/ingredient.ts
```

---

## 🧪 Sprint 3 — Prep Recipe + Production (Week 3)

**เป้าหมาย:** สูตรเตรียม + การเตรียม prep ingredient

### User Stories
- US-3.1: เป็น user ฉันต้องการสร้าง Prep Recipe พร้อม yield + shelf life
- US-3.2: เป็น user ฉันต้องการให้ระบบสร้าง PREP ingredient อัตโนมัติเมื่อสร้าง Prep Recipe
- US-3.3: เป็น user ฉันต้องการบันทึกการเตรียม prep (Prep Production)
- US-3.4: เป็น user ฉันต้องการให้ระบบหัก raw ingredients ตอน prep

### Tasks
- [ ] เพิ่ม Prep Recipe support (recipeType = PREP)
  - [ ] สร้างหน้า `/prep-recipes`
  - [ ] Form มี yield + shelf life
  - [ ] Auto-create linked Ingredient (type=PREP)
- [ ] สร้างหน้า `/stock/prep` (Prep Production form)
- [ ] Logic:
  - [ ] Calculate raw needed (with conversion)
  - [ ] Check availability
  - [ ] Deduct raw via FIFO (basic version)
  - [ ] Create new batch สำหรับ PREP output
  - [ ] Set `expiresAt = preparedAt + shelfLifeDays`
- [ ] Server Action: `createPrepProduction()`
- [ ] Edge case: ถ้า raw ไม่พอ ห้าม submit

### Definition of Done
- ✅ สร้าง "นมมิกซ์จืด" prep recipe + auto-create PREP ingredient
- ✅ เตรียมนมมิกซ์ 2 รอบ (2400g) → หัก นมสด 2000g + วิปครีม 400g
- ✅ batch ใหม่ของนมมิกซ์ทึ่มี expiresAt = +2 วัน
- ✅ ถ้า raw ไม่พอ ระบบเตือน + ปิดปุ่ม

### Files to Create
```
app/(dashboard)/prep-recipes/page.tsx
app/(dashboard)/prep-recipes/new/page.tsx
app/(dashboard)/prep-recipes/[id]/page.tsx
app/(dashboard)/stock/prep/page.tsx
components/prep/PrepRecipeForm.tsx
components/prep/PrepProductionForm.tsx
lib/actions/prep.ts
lib/stock/fifo.ts          # basic version
```

---

## 📦 Sprint 4 — Stock & Batch (Week 4)

**เป้าหมาย:** ระบบ batch management + expiry tracking ครบ

### User Stories
- US-4.1: เป็น user ฉันต้องการดู stock แยกเป็น batch
- US-4.2: เป็น user ฉันต้องการรับสต็อกใหม่ (RAW purchase)
- US-4.3: เป็น user ฉันต้องการเห็น batch ที่ใกล้หมดอายุ
- US-4.4: เป็น user ฉันต้องการปรับยอด stock (เช่น ทิ้งของเสีย)
- US-4.5: เป็น user ฉันต้องการดู stock movement history

### Tasks
- [ ] สร้างหน้า `/stock` (รายการ batches แยกตาม ingredient)
- [ ] Component `BatchList` พร้อม:
  - [ ] Sort FIFO
  - [ ] Color coding (green/yellow/red ตามวันหมด)
  - [ ] Filter status
- [ ] หน้า "Add Stock" (รับ stock RAW จาก variant)
  - [ ] เลือก variant → auto-fill packageSize/price
  - [ ] Calculate qty × packageSize
- [ ] หน้า "Adjust Stock" (เพิ่ม/ลด/ทิ้ง)
- [ ] **Auto-expire Cron Job**:
  - [ ] `app/api/cron/expire-batches/route.ts`
  - [ ] เพิ่ม `vercel.json` config
  - [ ] ป้องกันด้วย CRON_SECRET
- [ ] Movement History view
- [ ] Improved FIFO algorithm:
  ```typescript
  deductStockFIFO(ingredientId, quantity): { batchId, qty }[]
  ```
- [ ] Tests for FIFO + cross-batch deduction

### Definition of Done
- ✅ ดู batch แต่ละ ingredient ได้ พร้อมสีบอกสถานะ
- ✅ รับสต็อกใหม่ → สร้าง batch + StockMovement type=IN
- ✅ Cron job auto-mark expired ทำงาน
- ✅ FIFO หักข้าม batch ได้
- ✅ Movement history แสดงทุก type ครบ

### Files to Create
```
app/(dashboard)/stock/page.tsx
app/(dashboard)/stock/add/page.tsx
app/(dashboard)/stock/adjust/page.tsx
app/(dashboard)/stock/history/page.tsx
app/api/cron/expire-batches/route.ts
components/stock/BatchList.tsx
components/stock/BatchCard.tsx
components/stock/AddStockForm.tsx
components/stock/AdjustStockForm.tsx
components/stock/MovementHistory.tsx
lib/stock/fifo.ts          # improved version + tests
vercel.json
```

---

## ⚖️ Sprint 5 — Capacity + Sales (Week 5)

**เป้าหมาย:** Recursive capacity + บันทึกการขาย auto-deduct

### User Stories
- US-5.1: เป็น user ฉันต้องการรู้ว่า stock ที่มีทำสูตรไหนได้กี่หน่วย
- US-5.2: เป็น user ฉันต้องการเห็น bottleneck ingredient
- US-5.3: เป็น user ฉันต้องการบันทึกการขาย → ระบบ auto-deduct stock
- US-5.4: เป็น user ฉันต้องการดูรายงานยอดขายรายวัน

### Tasks
- [ ] **Recursive Capacity Logic** (`lib/stock/capacity.ts`):
  - [ ] สำหรับแต่ละ ingredient: ถ้า RAW → ใช้ stock; ถ้า PREP → stock + capacity ที่ทำเพิ่มได้
  - [ ] หา min = bottleneck
- [ ] สร้างหน้า `/capacity`
  - [ ] ตาราง overview ทุกสูตร
  - [ ] Drill-down ดูรายละเอียดต่อสูตร
  - [ ] แสดง bottleneck พร้อมเหตุผล
- [ ] **Sale Recording**:
  - [ ] หน้า `/sales/new` (multi-item form)
  - [ ] Pre-check stock ก่อน submit
  - [ ] หัก stock ทุก ingredient (FIFO ผ่าน PREP)
  - [ ] สร้าง Sale + SaleItem + StockMovement
- [ ] หน้า `/sales` (list + filter ตามวันที่)
- [ ] หน้า dashboard "Today's Production" chart
- [ ] Tests:
  - [ ] Recursive capacity 2 levels (sale → prep → raw)
  - [ ] Sale auto-deduct ถูกต้อง

### Definition of Done
- ✅ "ลาเต้เย็น" ทำได้ X แก้ว แสดง bottleneck ถูก
- ✅ บันทึกขายลาเต้ 10 แก้ว → stock ลด:
  - นมมิกซ์ปรืด 1200g (จาก batch FIFO)
  - หรือถ้าไม่พอ → ใช้ raw (นมสด + วิปครีม) ผ่าน auto-prep
  - Espresso 400g (หรือเตรียมจาก raw)
- ✅ Sales list แสดงรายการ + total

### Files to Create
```
app/(dashboard)/capacity/page.tsx
app/(dashboard)/sales/page.tsx
app/(dashboard)/sales/new/page.tsx
app/(dashboard)/sales/[id]/page.tsx
components/capacity/CapacityTable.tsx
components/capacity/CapacityDetail.tsx
components/sale/SaleForm.tsx
components/sale/SaleItemRow.tsx
lib/stock/capacity.ts
lib/stock/capacity.test.ts
lib/actions/sale.ts
```

---

## 🛒 Sprint 6 — Purchase Plan + PDF (Week 6)

**เป้าหมาย:** วางแผนสั่งซื้อ + PDF shopping list

### User Stories
- US-6.1: เป็น user ฉันต้องการสร้างแผนสั่งซื้อตามเป้าขาย
- US-6.2: เป็น user ฉันต้องการให้ระบบคำนวณ raw ที่ต้องซื้อ
- US-6.3: เป็น user ฉันต้องการ export shopping list เป็น PDF

### Tasks
- [ ] **Recursive Explode Logic** (`lib/stock/explode.ts`):
  - [ ] รับ {ingredientId, quantity}[]
  - [ ] ถ้า PREP → recurse ผ่าน prep recipe → ราคา raw
  - [ ] รวม raw ซ้ำ
  - [ ] หัก current stock
  - [ ] คืน {ingredientId, needed, toBuy, estimatedCost}[]
- [ ] หน้า `/purchase-plans` (list)
- [ ] หน้า `/purchase-plans/new` (สร้างแผน + target qty)
- [ ] หน้า `/purchase-plans/[id]` (ดูรายละเอียด + ผลคำนวณ)
- [ ] **PDF Generation** (`lib/pdf/shopping-list.tsx`):
  - [ ] ใช้ `@react-pdf/renderer`
  - [ ] Layout ตาม wireframe (checkbox + ราคา + รวม)
  - [ ] Endpoint `/api/pdf/shopping-list`
  - [ ] รองรับภาษาไทย (font: Sarabun หรือ Noto Sans Thai)
- [ ] Tests for explode logic

### Definition of Done
- ✅ เป้า ลาเต้ 50 + อเมริกาโน่ 30 → explode ถูก
- ✅ คำนวณราคารวมถูก (ใช้ default variant)
- ✅ PDF download ได้ + ภาษาไทยแสดงถูก
- ✅ Mark as purchased → status เปลี่ยนเป็น PURCHASED

### Files to Create
```
app/(dashboard)/purchase-plans/page.tsx
app/(dashboard)/purchase-plans/new/page.tsx
app/(dashboard)/purchase-plans/[id]/page.tsx
app/api/pdf/shopping-list/route.ts
components/plan/PurchasePlanForm.tsx
components/plan/PlanItemEditor.tsx
components/plan/CalculationResult.tsx
lib/stock/explode.ts
lib/stock/explode.test.ts
lib/pdf/shopping-list.tsx
lib/actions/purchase-plan.ts
```

---

## 📊 Sprint 7 — Excel + Images (Week 7)

**เป้าหมาย:** Import/Export Excel + Image upload

### User Stories
- US-7.1: เป็น user ฉันต้องการ export สูตรเป็น Excel
- US-7.2: เป็น user ฉันต้องการ import สูตรจาก Excel
- US-7.3: เป็น user ฉันต้องการ download template Excel
- US-7.4: เป็น user ฉันต้องการ upload รูปเมนู/วัตถุดิบ
- US-7.5: เป็น user ฉันต้องการให้ระบบ validate Excel ก่อน import

### Tasks

**Excel Export:**
- [ ] `lib/excel/recipe-export.ts` (2 sheets: Recipes + Sizes&Ingredients)
- [ ] `lib/excel/ingredient-export.ts` (2 sheets: Ingredients + Variants)
- [ ] API routes: `/api/export/recipes`, `/api/export/ingredients`
- [ ] ปุ่ม Export ในหน้า list + download trigger

**Excel Import (Wizard 3 steps):**
- [ ] Template files (`public/templates/recipe-template.xlsx`, ฯลฯ)
- [ ] `lib/excel/recipe-import.ts` (parser + validator)
- [ ] `lib/excel/ingredient-import.ts`
- [ ] หน้า `/recipes/import` พร้อม wizard 3 steps
- [ ] หน้า `/ingredients/import`
- [ ] Server Action: `confirmImport()` ใช้ `prisma.$transaction`
- [ ] Save `ImportLog` พร้อม error report

**Image Upload:**
- [ ] Setup Vercel Blob
- [ ] `lib/blob.ts` (upload, delete helpers)
- [ ] Component `ImageUploader` (drag-drop + preview)
- [ ] Client-side resize ด้วย `browser-image-compression`
- [ ] เพิ่ม image upload ใน RecipeForm + IngredientForm
- [ ] เพิ่ม imageUrl ใน RecipeCard + IngredientList

### Definition of Done
- ✅ Export ได้ไฟล์ Excel ที่ถูก format
- ✅ Import ทำงานครบ 3 step (preview → validate → confirm)
- ✅ Error rows แสดงครบ พร้อม row number
- ✅ Upload รูปเมนูได้ + แสดงใน list
- ✅ Auto resize ก่อน upload (ลด file size 70%+)

### Files to Create
```
app/(dashboard)/recipes/import/page.tsx
app/(dashboard)/ingredients/import/page.tsx
app/api/export/recipes/route.ts
app/api/export/ingredients/route.ts
app/api/upload/route.ts
components/excel/ImportWizard.tsx
components/excel/PreviewTable.tsx
components/excel/ValidationSummary.tsx
components/shared/ImageUploader.tsx
lib/excel/recipe-export.ts
lib/excel/recipe-import.ts
lib/excel/ingredient-export.ts
lib/excel/ingredient-import.ts
lib/blob.ts
public/templates/recipe-template.xlsx
public/templates/ingredient-template.xlsx
```

---

## 🌍 Sprint 8 — i18n + Polish + Deploy (Week 8)

**เป้าหมาย:** Multi-language + UX polish + production-ready

### Tasks

**i18n (Multi-language):**
- [ ] เติม translation keys ครบทุกหน้าใน `messages/th.json`, `messages/en.json`
- [ ] Locale switcher component (TH ⟷ EN)
- [ ] Middleware เรื่อง locale prefix ใน URL (`/th/recipes`, `/en/recipes`)
- [ ] Test ทุกหน้าใน 2 ภาษา
- [ ] Locale-aware date/number formatting

**UX Polish:**
- [ ] Loading skeletons ทุกหน้า list
- [ ] Empty states (no data illustrations)
- [ ] Error boundaries
- [ ] Toast notifications (success/error) ด้วย `sonner`
- [ ] Mobile responsive ครบทุกหน้า
- [ ] Dark mode (optional)
- [ ] Accessibility audit (keyboard nav, ARIA labels)

**Performance:**
- [ ] Image optimization (`next/image`)
- [ ] Lazy loading ใน list pages
- [ ] Database query optimization (รวม include, ลด N+1)
- [ ] Add proper indexes ใน Prisma schema (already done)

**Testing & QA:**
- [ ] Unit tests สำหรับ business logic (fifo, capacity, explode, conversion)
- [ ] E2E test critical flows (Playwright):
  - [ ] Create recipe → record sale → check stock
  - [ ] Create prep recipe → produce → check batch
  - [ ] Create purchase plan → export PDF
- [ ] Manual test checklist

**Deployment:**
- [ ] Setup production Neon DB (separate from dev)
- [ ] Migrate production DB
- [ ] Configure all env vars ใน Vercel
- [ ] Setup Vercel Cron production
- [ ] Add monitoring (Vercel Analytics + Sentry optional)
- [ ] Setup custom domain (optional)
- [ ] Write basic user manual / onboarding

### Definition of Done
- ✅ สลับภาษา TH/EN ใช้งานได้ทุกหน้า
- ✅ Mobile responsive ทุกหน้า
- ✅ Unit test coverage > 70%
- ✅ E2E test passes
- ✅ Production deployed + ใช้งานได้
- ✅ ไม่มี errors ใน Vercel logs

### Files to Create
```
messages/th.json   (เติมเต็ม)
messages/en.json   (เติมเต็ม)
components/shared/LocaleSwitcher.tsx
components/shared/LoadingSkeleton.tsx
components/shared/EmptyState.tsx
components/shared/ErrorBoundary.tsx
middleware.ts (i18n routing)
e2e/recipe-flow.spec.ts
e2e/sale-flow.spec.ts
e2e/purchase-plan.spec.ts
docs/USER_GUIDE.md
```

---

## 🎯 Acceptance Criteria for MVP (Phase 1)

หลังจบ 8 sprints ระบบต้องทำสิ่งเหล่านี้ได้ครบ:

### ✅ Functional
- [ ] Login/Register ทำงาน
- [ ] CRUD Sale Recipe + Sizes + Categories + Image
- [ ] CRUD Prep Recipe + Yield + Shelf life + Image
- [ ] CRUD Ingredient (RAW/PREP) + Variants + Image
- [ ] เปรียบเทียบราคา variants + เลือก default
- [ ] รับ stock + จัดการ batch + FIFO
- [ ] Prep Production + auto-deduct raw + create batch
- [ ] Auto-expire batch (cron)
- [ ] Production Capacity (recursive)
- [ ] Sale Recording + auto-deduct stock ผ่าน PREP
- [ ] Purchase Plan + recursive explode
- [ ] Export PDF Shopping List
- [ ] Import/Export Excel (Recipe + Ingredient)
- [ ] Unit Conversion (g↔kg↔oz, ml↔l, etc.)
- [ ] Multi-language (TH/EN)

### ✅ Non-functional
- [ ] Mobile responsive
- [ ] Page load < 2s
- [ ] Test coverage > 70% สำหรับ business logic
- [ ] Deployed on Vercel + Neon DB free tier

### ✅ Documentation
- [ ] CLAUDE.md updated
- [ ] README.md พร้อม setup instructions
- [ ] USER_GUIDE.md สำหรับผู้ใช้

---

## 📊 Effort Estimation

| Sprint | Estimated Hours | Difficulty |
|--------|-----------------|------------|
| Sprint 0 | 15-20 hrs | 🟢 Easy |
| Sprint 1 | 25-30 hrs | 🟡 Medium |
| Sprint 2 | 20-25 hrs | 🟡 Medium |
| Sprint 3 | 30-35 hrs | 🔴 Hard |
| Sprint 4 | 30-35 hrs | 🔴 Hard |
| Sprint 5 | 35-40 hrs | 🔴 Hard (recursive logic) |
| Sprint 6 | 25-30 hrs | 🟡 Medium |
| Sprint 7 | 30-35 hrs | 🟡 Medium |
| Sprint 8 | 25-30 hrs | 🟢 Easy-Medium |
| **Total** | **235-280 hrs** | |

> หากใช้ Claude Code ช่วย คาดว่าลดได้ ~30-40%
> เหลือประมาณ **160-200 hrs** = 8 weeks × 20-25 hrs/week

---

## 🚀 Post-MVP (Phase 2 & 3)

หลังจบ MVP สิ่งที่อยากเพิ่มต่อ:

### Phase 2 (Month 3-4)
- 📊 Stock movement history dashboard
- 📈 Price trend tracking (variant history)
- 🔔 Email/LINE expiry notifications
- 📅 Prep production scheduler (smart suggestion)
- 💰 Cost & profit analysis per recipe
- 📊 Sales reporting (daily/weekly/monthly)
- 🖼️ Multiple images per recipe

### Phase 3 (Month 5-6)
- 📱 PWA (offline mode for sale recording)
- 👥 Team collaboration (multi-user per shop)
- 🧾 POS integration (Loyverse, Storehub)
- 📊 Advanced analytics + forecasting
- 🌐 Multi-shop / multi-location support
- 🤖 AI suggestions (best variant to buy, recipe optimization)

---

## 📝 Sprint Ceremonies (Optional for solo dev)

ถ้า dev คนเดียวก็ไม่จำเป็น แต่แนะนำ:

- **Sprint Planning (Monday 1hr):** อ่าน sprint tasks, ปรับแก้, ตั้งเป้า
- **Daily Standup (5 min self-check):** today, blockers
- **Sprint Review (Friday 30min):** demo ตัวเอง, screenshot ของที่ทำได้
- **Sprint Retrospective (Friday 30min):** อะไรเรียนรู้, อะไรปรับ

---

## 🎓 Learning Resources

หากมีจุดที่ติดขัด แนะนำ:

| Topic | Resource |
|-------|----------|
| Next.js 14 App Router | nextjs.org/docs |
| Prisma | prisma.io/docs |
| Neon DB | neon.tech/docs |
| Tailwind + shadcn | ui.shadcn.com |
| NextAuth | next-auth.js.org |
| next-intl | next-intl-docs.vercel.app |
| Vercel Blob | vercel.com/docs/storage/vercel-blob |
| react-pdf | react-pdf.org |
| xlsx | docs.sheetjs.com |

---

## 🤝 Working with Claude Code

ตัวอย่าง prompt ที่ดีในแต่ละ sprint:

**Sprint 1:**
> "ช่วยสร้าง RecipeForm component ตาม wireframe section 2 ใน docs/wireframes.md
> ใช้ react-hook-form + zod ตาม schema ใน prisma/schema.prisma
> รองรับ multiple sizes และ multiple ingredients per size
> Style ตาม design system ใน CLAUDE.md"

**Sprint 4:**
> "ช่วยเขียน FIFO deduction function ใน lib/stock/fifo.ts
> รับ ingredientId + quantity ที่ต้องหัก
> หักจาก batch ที่ expiresAt เร็วที่สุดก่อน (ACTIVE only)
> ถ้า batch หมด set status=DEPLETED
> Return array ของ {batchId, qtyTaken}
> Throw error ถ้า stock ไม่พอ
> เขียน unit test ครอบคลุม edge cases (1 batch, multi-batch, exhaustion)"

**Sprint 6:**
> "ช่วยเขียน recursive explode function ใน lib/stock/explode.ts
> รับ list ของ {ingredientId, quantity}
> ถ้า ingredient.type === PREP → recurse ผ่าน prepRecipe
> รวม raw ingredient ที่ซ้ำ
> หัก current stock จาก ACTIVE batches
> Return {ingredientId, needed, available, toBuy, estimatedCost}
> Use Prisma + handle units conversion"

---

## ✅ Success Metrics

โปรเจกต์ถือว่าสำเร็จเมื่อ:

1. ✅ ใช้งานจริงได้กับร้านกาแฟตัวอย่าง (1 ร้าน)
2. ✅ บันทึกสูตรครบ 13+ เมนู
3. ✅ ใช้บันทึกขายได้ทุกวัน (5+ วัน)
4. ✅ Stock tracking แม่นยำ (variance < 5%)
5. ✅ ผู้ใช้กดได้ทุก feature โดยไม่ต้องสอน

🎉 Good luck! สู้ๆ!
