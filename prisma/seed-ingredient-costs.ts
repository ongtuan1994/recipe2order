// prisma/seed-ingredient-costs.ts
// Idempotent: only creates a default variant for ingredients that don't have
// one yet. Existing variants are left alone so manual edits aren't clobbered.
// Usage: npx tsx prisma/seed-ingredient-costs.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const USER_EMAIL = "admin@admin.com";

// Rough Thai-market estimates, per base unit (g / ml / piece) in THB.
// Edit these once real supplier prices are known.
const COSTS: Record<string, number> = {
  // ----- existing seed ingredients -----
  "นมสด": 0.06,
  "วิปครีม": 0.15,
  "เมล็ดกาแฟ": 1.4,
  "น้ำเปล่า": 0.002,
  "น้ำแข็ง": 0.002,
  "ผงโกโก้": 0.5,
  "ผงมัทฉะ": 5,
  "น้ำตาล": 0.025,
  "ช็อคโกแลตซอส": 0.2,
  "คาราเมลซอส": 0.2,
  "น้ำส้ม": 0.05,
  "น้ำเชื่อม": 0.05,
  "โซดา": 0.03,
  "โรสแมรี่": 5,

  // ----- new (Non Coffee / Signature / Frappe / Smoothies) -----
  "นมข้นหวาน": 0.13,
  "นมข้นจืด": 0.1,
  "ช็อกโกแลตซอสไม่หวาน": 0.25,
  "น้ำเชื่อมมิ้นต์": 0.25,
  "น้ำเชื่อมพีช": 0.25,
  "น้ำเชื่อมกุหลาบ": 0.25,
  "น้ำเชื่อมมะพร้าว": 0.25,
  "วานิลาไซรัป": 0.25,
  "น้ำแดง": 0.06,
  "Triple Sec Syrup": 0.3,
  "โทนิค": 0.05,
  "Frappe Powder": 1.5,
  "ฟรุกโตส": 0.05,
  "เกลือ": 0.01,
  "วิปครีมพร้อมใช้": 0.5,
  "ใบชาเอิร์ลเกรย์": 2,
  "ใบชาเขียว": 3,
  "ใบชาไทย": 1,
  "น้ำมะนาว": 0.2,
  "น้ำมะนาวเหลือง": 0.3,
  "ส้มยูสุ": 5,
  "น้ำมะพร้าว": 0.04,
  "บลูเบอร์รี่": 3,
  "สตรอเบอร์รี่สด": 8,
  "เลมอน": 15,
  "ส้ม": 12,
  "ดอกกุหลาบแห้ง": 8,
  "สตรอเบอร์รี่เพียวเร่": 0.6,
  "ลิ้นจี่เพียวเร่": 0.5,
  "น้ำลิ้นจี่เข้มข้น": 0.4,
  "Mixed Berry แช่แข็ง": 0.4,
  "เสาวรสเพียวเร่": 0.6,
};

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`Seed user not found: ${USER_EMAIL}`);
  console.log(`💰 Seeding ingredient costs for ${user.email}`);

  let added = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const [name, perUnit] of Object.entries(COSTS)) {
    const ing = await prisma.ingredient.findFirst({
      where: { userId: user.id, name, isDeleted: false, type: "RAW" },
      select: { id: true, baseUnit: true, defaultVariantId: true },
    });
    if (!ing) {
      missing.push(name);
      continue;
    }
    if (ing.defaultVariantId) {
      skipped++;
      continue;
    }

    // Express as a 1kg / 1L / 1piece pack so the price reads naturally in the UI.
    const isPiece = ing.baseUnit === "piece";
    const packageSize = isPiece ? 1 : 1000;
    const price = perUnit * packageSize;

    const variant = await prisma.ingredientVariant.create({
      data: {
        ingredientId: ing.id,
        brand: "ราคาประมาณ",
        packageSize,
        packageUnit: ing.baseUnit,
        price,
        pricePerBaseUnit: perUnit,
      },
    });
    await prisma.ingredient.update({
      where: { id: ing.id },
      data: { defaultVariantId: variant.id },
    });
    added++;
  }

  console.log(`\n✅ ${added} variants added, ${skipped} already had a default`);
  if (missing.length) {
    console.log(`⚠️  ${missing.length} ingredients not found:`);
    missing.forEach((n) => console.log(`   - ${n}`));
  }
}

main()
  .catch((e) => {
    console.error("❌ seed-ingredient-costs failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
