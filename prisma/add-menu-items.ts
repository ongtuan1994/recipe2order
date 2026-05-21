// prisma/add-menu-items.ts
// Idempotent script to add the Non Coffee / Signature / Frappe / Smoothies menus.
// Existing rows (by name + userId) are skipped, so this is safe to re-run.
// Usage: npx tsx prisma/add-menu-items.ts

import { PrismaClient, IngredientType, RecipeType } from "@prisma/client";

const prisma = new PrismaClient();
const USER_EMAIL = "admin@admin.com";

// ---------------- helpers ----------------

async function getUser() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`Seed user not found: ${USER_EMAIL}`);
  return user;
}

async function upsertCategory(
  userId: string,
  name: string,
  opts: { nameEn?: string; color?: string; icon?: string; order?: number } = {},
) {
  const existing = await prisma.category.findFirst({ where: { userId, name } });
  if (existing) return existing;
  return prisma.category.create({
    data: { userId, name, ...opts },
  });
}

async function upsertRaw(
  userId: string,
  name: string,
  opts: {
    nameEn?: string;
    baseUnit: string;
    shelfLifeDays?: number | null;
    minStockAlert?: number | null;
  },
) {
  const existing = await prisma.ingredient.findFirst({
    where: { userId, name, isDeleted: false },
  });
  if (existing) return existing;
  return prisma.ingredient.create({
    data: {
      userId,
      name,
      nameEn: opts.nameEn,
      type: IngredientType.RAW,
      baseUnit: opts.baseUnit,
      shelfLifeDays: opts.shelfLifeDays ?? null,
      minStockAlert: opts.minStockAlert ?? null,
    },
  });
}

interface PrepIngredientInput {
  ingredientId: string;
  quantity: number;
  unit: string;
  order?: number;
}

async function upsertPrep(
  userId: string,
  name: string,
  opts: {
    nameEn?: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    shelfLifeDays?: number;
    ingredients: PrepIngredientInput[];
    steps?: { title?: string; detail?: string }[];
  },
) {
  const existingIng = await prisma.ingredient.findFirst({
    where: { userId, name, isDeleted: false, type: IngredientType.PREP },
  });
  if (existingIng) return existingIng;

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      name,
      nameEn: opts.nameEn,
      recipeType: RecipeType.PREP,
      description: opts.description,
      yieldQuantity: opts.yieldQuantity,
      yieldUnit: opts.yieldUnit,
      prepIngredients: {
        create: opts.ingredients.map((i, idx) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          unit: i.unit,
          order: i.order ?? idx + 1,
        })),
      },
      prepSteps: opts.steps
        ? {
            create: opts.steps.map((s, idx) => ({
              stepNo: idx + 1,
              title: s.title,
              detail: s.detail,
            })),
          }
        : undefined,
    },
  });
  return prisma.ingredient.create({
    data: {
      userId,
      name,
      nameEn: opts.nameEn,
      type: IngredientType.PREP,
      baseUnit: opts.yieldUnit,
      shelfLifeDays: opts.shelfLifeDays ?? 1,
      prepRecipeId: recipe.id,
    },
  });
}

interface SaleSizeInput {
  sizeName: string;
  ingredients: { ingredientId: string; quantity: number; unit: string; note?: string }[];
  steps: { title?: string; detail?: string }[];
}

async function upsertSaleRecipe(
  userId: string,
  opts: {
    name: string;
    nameEn?: string;
    categoryId: string;
    sellPrice?: number;
    sizes: SaleSizeInput[];
  },
) {
  const existing = await prisma.recipe.findFirst({
    where: {
      userId,
      name: opts.name,
      recipeType: RecipeType.SALE,
      isDeleted: false,
    },
  });
  if (existing) return { recipe: existing, created: false };

  const recipe = await prisma.recipe.create({
    data: {
      userId,
      name: opts.name,
      nameEn: opts.nameEn,
      recipeType: RecipeType.SALE,
      categoryId: opts.categoryId,
      sellPrice: opts.sellPrice,
      sizes: {
        create: opts.sizes.map((s, sIdx) => ({
          sizeName: s.sizeName,
          order: sIdx,
          ingredients: {
            create: s.ingredients.map((i, iIdx) => ({
              ingredientId: i.ingredientId,
              quantity: i.quantity,
              unit: i.unit,
              note: i.note,
              order: iIdx,
            })),
          },
          steps: {
            create: s.steps.map((step, stepIdx) => ({
              stepNo: stepIdx + 1,
              title: step.title,
              detail: step.detail,
            })),
          },
        })),
      },
    },
  });
  return { recipe, created: true };
}

// ---------------- main ----------------

async function main() {
  const user = await getUser();
  const userId = user.id;
  console.log(`📋 Adding menu items for ${user.email}`);

  // ---- Categories ----
  const catCoffee = await upsertCategory(userId, "กาแฟ", {
    nameEn: "Coffee",
    color: "#8B4513",
    icon: "☕",
    order: 1,
  });
  const catTea = await upsertCategory(userId, "ชา", {
    nameEn: "Tea",
    color: "#228B22",
    icon: "🍵",
    order: 2,
  });
  const catNonCoffee = await upsertCategory(userId, "Non Coffee", {
    nameEn: "Non Coffee",
    color: "#D97706",
    icon: "🍫",
    order: 3,
  });
  const catSignature = await upsertCategory(userId, "Signature", {
    nameEn: "Signature",
    color: "#A855F7",
    icon: "✨",
    order: 4,
  });
  const catFrappe = await upsertCategory(userId, "Frappe", {
    nameEn: "Frappe",
    color: "#3B82F6",
    icon: "🧊",
    order: 5,
  });
  const catSmoothies = await upsertCategory(userId, "Smoothies", {
    nameEn: "Smoothies",
    color: "#EC4899",
    icon: "🥤",
    order: 6,
  });
  console.log("✅ Categories");

  // ---- RAW ingredients (existing + new). Lookup is idempotent. ----
  const raw = {
    milk: await upsertRaw(userId, "นมสด", { nameEn: "Fresh Milk", baseUnit: "g", shelfLifeDays: 7 }),
    whippingCream: await upsertRaw(userId, "วิปครีม", { nameEn: "Whipping Cream", baseUnit: "g", shelfLifeDays: 14 }),
    coffeeBean: await upsertRaw(userId, "เมล็ดกาแฟ", { nameEn: "Coffee Beans", baseUnit: "g", shelfLifeDays: 30 }),
    water: await upsertRaw(userId, "น้ำเปล่า", { nameEn: "Water", baseUnit: "ml" }),
    ice: await upsertRaw(userId, "น้ำแข็ง", { nameEn: "Ice", baseUnit: "g" }),
    cocoaPowder: await upsertRaw(userId, "ผงโกโก้", { nameEn: "Cocoa Powder", baseUnit: "g", shelfLifeDays: 180 }),
    matchaPowder: await upsertRaw(userId, "ผงมัทฉะ", { nameEn: "Matcha Powder", baseUnit: "g", shelfLifeDays: 180 }),
    sugar: await upsertRaw(userId, "น้ำตาล", { nameEn: "Sugar", baseUnit: "g", shelfLifeDays: 365 }),
    chocSauce: await upsertRaw(userId, "ช็อคโกแลตซอส", { nameEn: "Chocolate Sauce", baseUnit: "g", shelfLifeDays: 60 }),
    caramelSauce: await upsertRaw(userId, "คาราเมลซอส", { nameEn: "Caramel Sauce", baseUnit: "g", shelfLifeDays: 60 }),
    orangeJuice: await upsertRaw(userId, "น้ำส้ม", { nameEn: "Orange Juice", baseUnit: "ml", shelfLifeDays: 5 }),
    simpleSyrup: await upsertRaw(userId, "น้ำเชื่อม", { nameEn: "Simple Syrup", baseUnit: "ml", shelfLifeDays: 30 }),
    soda: await upsertRaw(userId, "โซดา", { nameEn: "Soda Water", baseUnit: "ml", shelfLifeDays: 60 }),
    rosemary: await upsertRaw(userId, "โรสแมรี่", { nameEn: "Rosemary", baseUnit: "piece", shelfLifeDays: 7 }),

    // ----- new -----
    condensedMilk: await upsertRaw(userId, "นมข้นหวาน", { nameEn: "Sweetened Condensed Milk", baseUnit: "g", shelfLifeDays: 90 }),
    chocSauceUnsweet: await upsertRaw(userId, "ช็อกโกแลตซอสไม่หวาน", { nameEn: "Unsweetened Chocolate Sauce", baseUnit: "g", shelfLifeDays: 60 }),
    mintSyrup: await upsertRaw(userId, "น้ำเชื่อมมิ้นต์", { nameEn: "Mint Syrup", baseUnit: "ml", shelfLifeDays: 60 }),
    peachSyrup: await upsertRaw(userId, "น้ำเชื่อมพีช", { nameEn: "Peach Syrup", baseUnit: "ml", shelfLifeDays: 60 }),
    roseSyrup: await upsertRaw(userId, "น้ำเชื่อมกุหลาบ", { nameEn: "Rose Syrup", baseUnit: "ml", shelfLifeDays: 60 }),
    coconutSyrup: await upsertRaw(userId, "น้ำเชื่อมมะพร้าว", { nameEn: "Coconut Syrup", baseUnit: "ml", shelfLifeDays: 60 }),
    vanillaSyrup: await upsertRaw(userId, "วานิลาไซรัป", { nameEn: "Vanilla Syrup", baseUnit: "ml", shelfLifeDays: 90 }),
    redSyrup: await upsertRaw(userId, "น้ำแดง", { nameEn: "Pink Sala Syrup", baseUnit: "ml", shelfLifeDays: 60 }),
    tripleSec: await upsertRaw(userId, "Triple Sec Syrup", { baseUnit: "ml", shelfLifeDays: 180 }),
    tonic: await upsertRaw(userId, "โทนิค", { nameEn: "Tonic Water", baseUnit: "ml", shelfLifeDays: 60 }),
    frappePowder: await upsertRaw(userId, "Frappe Powder", { baseUnit: "g", shelfLifeDays: 180 }),
    fructose: await upsertRaw(userId, "ฟรุกโตส", { nameEn: "Fructose", baseUnit: "g", shelfLifeDays: 365 }),
    salt: await upsertRaw(userId, "เกลือ", { nameEn: "Salt", baseUnit: "g", shelfLifeDays: 365 }),
    whippedCream: await upsertRaw(userId, "วิปครีมพร้อมใช้", { nameEn: "Whipped Cream", baseUnit: "g", shelfLifeDays: 14 }),

    earlGreyLeaves: await upsertRaw(userId, "ใบชาเอิร์ลเกรย์", { nameEn: "Earl Grey Tea Leaves", baseUnit: "g", shelfLifeDays: 365 }),
    greenTeaLeaves: await upsertRaw(userId, "ใบชาเขียว", { nameEn: "Green Tea Leaves", baseUnit: "g", shelfLifeDays: 365 }),
    thaiTeaLeaves: await upsertRaw(userId, "ใบชาไทย", { nameEn: "Thai Tea Leaves", baseUnit: "g", shelfLifeDays: 365 }),

    limeJuice: await upsertRaw(userId, "น้ำมะนาว", { nameEn: "Lime Juice", baseUnit: "ml", shelfLifeDays: 3 }),
    lemonJuice: await upsertRaw(userId, "น้ำมะนาวเหลือง", { nameEn: "Lemon Juice", baseUnit: "ml", shelfLifeDays: 3 }),
    yuzu: await upsertRaw(userId, "ส้มยูสุ", { nameEn: "Yuzu", baseUnit: "g", shelfLifeDays: 7 }),
    coconutWater: await upsertRaw(userId, "น้ำมะพร้าว", { nameEn: "Coconut Water", baseUnit: "ml", shelfLifeDays: 3 }),
    blueberry: await upsertRaw(userId, "บลูเบอร์รี่", { nameEn: "Blueberry", baseUnit: "piece", shelfLifeDays: 7 }),
    strawberryFresh: await upsertRaw(userId, "สตรอเบอร์รี่สด", { nameEn: "Fresh Strawberry", baseUnit: "piece", shelfLifeDays: 7 }),
    lemonSlice: await upsertRaw(userId, "เลมอน", { nameEn: "Lemon", baseUnit: "piece", shelfLifeDays: 14 }),
    orangeSlice: await upsertRaw(userId, "ส้ม", { nameEn: "Orange", baseUnit: "piece", shelfLifeDays: 14 }),
    roseDried: await upsertRaw(userId, "ดอกกุหลาบแห้ง", { nameEn: "Dried Rose", baseUnit: "g", shelfLifeDays: 365 }),

    strawberryPuree: await upsertRaw(userId, "สตรอเบอร์รี่เพียวเร่", { nameEn: "Strawberry Puree", baseUnit: "g", shelfLifeDays: 14 }),
    lycheePuree: await upsertRaw(userId, "ลิ้นจี่เพียวเร่", { nameEn: "Lychee Puree", baseUnit: "g", shelfLifeDays: 14 }),
    lycheeConcentrate: await upsertRaw(userId, "น้ำลิ้นจี่เข้มข้น", { nameEn: "Lychee Concentrate", baseUnit: "ml", shelfLifeDays: 30 }),
    mixedBerryFrozen: await upsertRaw(userId, "Mixed Berry แช่แข็ง", { nameEn: "Frozen Mixed Berry", baseUnit: "g", shelfLifeDays: 90 }),
    passionFruitPuree: await upsertRaw(userId, "เสาวรสเพียวเร่", { nameEn: "Passion Fruit Puree", baseUnit: "g", shelfLifeDays: 14 }),
  };
  console.log("✅ Raw ingredients");

  // ---- PREP recipes (existing + new) ----
  // Existing
  const prepMilkMix = await upsertPrep(userId, "นมมิกซ์จืด", {
    nameEn: "Plain Milk Mix",
    description: "นมผสมวิปครีม สำหรับใช้ในเมนูเครื่องดื่ม",
    yieldQuantity: 1200,
    yieldUnit: "g",
    shelfLifeDays: 2,
    ingredients: [
      { ingredientId: raw.milk.id, quantity: 1000, unit: "g" },
      { ingredientId: raw.whippingCream.id, quantity: 200, unit: "g" },
    ],
  });
  const prepMilkMixCold = await upsertPrep(userId, "นมมิกซ์ปรืด", {
    nameEn: "Cold Milk Mix",
    yieldQuantity: 1200,
    yieldUnit: "g",
    shelfLifeDays: 2,
    ingredients: [
      { ingredientId: raw.milk.id, quantity: 1000, unit: "g" },
      { ingredientId: raw.whippingCream.id, quantity: 200, unit: "g" },
    ],
  });
  const prepEspresso = await upsertPrep(userId, "Espresso (M)", {
    nameEn: "Espresso Shot",
    yieldQuantity: 40,
    yieldUnit: "g",
    shelfLifeDays: 1,
    ingredients: [
      { ingredientId: raw.coffeeBean.id, quantity: 18, unit: "g" },
      { ingredientId: raw.water.id, quantity: 30, unit: "ml" },
    ],
  });
  const prepRistretto = await upsertPrep(userId, "Ristretto (M)", {
    nameEn: "Ristretto Shot",
    yieldQuantity: 20,
    yieldUnit: "g",
    shelfLifeDays: 1,
    ingredients: [
      { ingredientId: raw.coffeeBean.id, quantity: 18, unit: "g" },
      { ingredientId: raw.water.id, quantity: 15, unit: "ml" },
    ],
  });

  // New PREPs
  const prepMilkMixSweet = await upsertPrep(userId, "นมมิกซ์หวาน", {
    nameEn: "Sweet Milk Mix",
    description: "นมสด + นมข้นหวาน ใช้ในเมนูช็อก/ชาเย็น",
    yieldQuantity: 1200,
    yieldUnit: "g",
    shelfLifeDays: 2,
    ingredients: [
      { ingredientId: raw.milk.id, quantity: 1000, unit: "g" },
      { ingredientId: raw.condensedMilk.id, quantity: 200, unit: "g" },
    ],
  });
  const prepEarlGrey = await upsertPrep(userId, "ชาเอิร์ลเกรย์สกัด", {
    nameEn: "Earl Grey Tea Brew",
    description: "ชาเอิร์ลเกรย์สกัดเข้มข้น สำหรับชาเย็น/ชาผลไม้",
    yieldQuantity: 150,
    yieldUnit: "g",
    shelfLifeDays: 2,
    ingredients: [
      { ingredientId: raw.earlGreyLeaves.id, quantity: 5, unit: "g" },
      { ingredientId: raw.water.id, quantity: 150, unit: "ml" },
    ],
  });
  const prepGreenTeaBrew = await upsertPrep(userId, "ชาเขียวสกัด", {
    nameEn: "Green Tea Brew",
    description: "ชาเขียวสกัดสำหรับชาเขียวนม",
    yieldQuantity: 60,
    yieldUnit: "g",
    shelfLifeDays: 2,
    ingredients: [
      { ingredientId: raw.greenTeaLeaves.id, quantity: 18, unit: "g" },
      { ingredientId: raw.water.id, quantity: 60, unit: "ml" },
    ],
  });
  const prepThaiTeaBrew = await upsertPrep(userId, "ชาไทยสกัด", {
    nameEn: "Thai Tea Brew",
    description: "ชาไทยสกัดเข้มข้น",
    yieldQuantity: 60,
    yieldUnit: "g",
    shelfLifeDays: 2,
    ingredients: [
      { ingredientId: raw.thaiTeaLeaves.id, quantity: 15, unit: "g" },
      { ingredientId: raw.water.id, quantity: 60, unit: "ml" },
    ],
  });
  const prepFrappeMix = await upsertPrep(userId, "Mixed หวาน (Frappe base)", {
    nameEn: "Frappe Sweet Mix",
    description: "ส่วนผสมหวานสำหรับ Frappe ทุกเมนู",
    yieldQuantity: 500,
    yieldUnit: "g",
    shelfLifeDays: 3,
    ingredients: [
      { ingredientId: raw.water.id, quantity: 300, unit: "ml" },
      { ingredientId: raw.simpleSyrup.id, quantity: 150, unit: "ml" },
      { ingredientId: raw.condensedMilk.id, quantity: 50, unit: "g" },
    ],
  });
  console.log("✅ PREP recipes");

  // Track references inline for legibility
  void prepMilkMix;
  void prepMilkMixCold;
  void prepRistretto;

  // ---------------- SALE recipes ----------------

  let created = 0;
  let skipped = 0;
  async function add(opts: Parameters<typeof upsertSaleRecipe>[1]) {
    const r = await upsertSaleRecipe(userId, opts);
    if (r.created) created++;
    else skipped++;
  }

  // ===== Non Coffee — Hot =====
  await add({
    name: "ช็อกโกแลต (ร้อน)",
    nameEn: "Hot Chocolate",
    categoryId: catNonCoffee.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: "แก้วกระดาษ 8oz",
        ingredients: [
          { ingredientId: raw.chocSauce.id, quantity: 40, unit: "g" },
          { ingredientId: prepMilkMixSweet.id, quantity: 40, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 10, unit: "ml" },
          { ingredientId: raw.milk.id, quantity: 150, unit: "g" },
        ],
        steps: [
          { title: "Choc Sauce 40 กรัม" },
          { title: "นมมิกซ์หวาน 40 กรัม" },
          { title: "น้ำเชื่อม 10 กรัม" },
          { title: "นมสดเย็น 150 กรัม เทลง Pitcher" },
          { title: "สตีมจนได้ 60°C" },
          { title: "คนให้เข้ากัน เทลงแก้วเสิร์ฟไม่ต้องการโฟมนม" },
        ],
      },
    ],
  });

  await add({
    name: "มัทฉะ (ร้อน)",
    nameEn: "Hot Matcha Latte",
    categoryId: catNonCoffee.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: "แก้วกระดาษ 8oz",
        ingredients: [
          { ingredientId: raw.water.id, quantity: 20, unit: "ml", note: "น้ำร้อน 60°C" },
          { ingredientId: raw.matchaPowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 20, unit: "ml" },
          { ingredientId: raw.milk.id, quantity: 180, unit: "g" },
        ],
        steps: [
          { title: "น้ำร้อน 20 กรัม 60°C" },
          { title: "ผงชาเขียว 5 กรัม คนให้เข้ากัน" },
          { title: "น้ำเชื่อม 20 กรัม" },
          { title: "สตีมนมร้อน 180 กรัม" },
          { title: "รินด้วย Free Pour โฟมหนา 0.5 cm" },
        ],
      },
    ],
  });

  // ===== Non Coffee — Iced =====
  await add({
    name: "ช็อกโกแลต (เย็น)",
    nameEn: "Iced Chocolate",
    categoryId: catNonCoffee.id,
    sellPrice: 70,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: raw.chocSauce.id, quantity: 50, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 70, unit: "g" },
          { ingredientId: prepMilkMixSweet.id, quantity: 70, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 20, unit: "ml" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: raw.cocoaPowder.id, quantity: 3, unit: "g", note: "โรยด้านบน" },
        ],
        steps: [
          { title: "Choc Sauce 50 กรัม" },
          { title: "นมสด 70 กรัม" },
          { title: "นมมิกซ์หวาน 70 กรัม" },
          { title: "น้ำเชื่อม 20 กรัม คนให้เข้ากัน" },
          { title: "ใส่น้ำแข็งจนถึงในแก้ว 16oz" },
          { title: "ตักโฟมนม ราด 2 ซม. จากปากแก้ว" },
          { title: "โรยผงช็อกจนเต็มแก้ว ปิดฝาซิปเล็กน้อย" },
        ],
      },
    ],
  });

  await add({
    name: "มัทฉะ (เย็น)",
    nameEn: "Iced Matcha Latte",
    categoryId: catNonCoffee.id,
    sellPrice: 70,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: raw.milk.id, quantity: 165, unit: "g", note: "30g ชง + 135g เติม" },
          { ingredientId: raw.matchaPowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 20, unit: "ml" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
        ],
        steps: [
          { title: "นมสด 30 กรัม" },
          { title: "ชาเขียว 5 กรัม คนให้เข้ากันในถ้วยชงชา" },
          { title: "เติมนมสด 135 กรัม" },
          { title: "น้ำเชื่อม 20 กรัม ผสมให้เข้ากันเทลงแก้วเสิร์ฟ" },
          { title: "ใส่น้ำแข็งพอดีแก้ว ปิดฝาซิป" },
        ],
      },
    ],
  });

  await add({
    name: "มิ้นช็อก (เย็น)",
    nameEn: "Iced Mint Chocolate",
    categoryId: catNonCoffee.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: raw.mintSyrup.id, quantity: 30, unit: "ml" },
          { ingredientId: raw.milk.id, quantity: 160, unit: "g", note: "120g + 40g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 15, unit: "ml" },
          { ingredientId: raw.chocSauce.id, quantity: 26, unit: "g", note: "6g รอบแก้ว + 20g ผสม" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: raw.cocoaPowder.id, quantity: 6, unit: "g", note: "โรยด้านบน" },
        ],
        steps: [
          { title: "น้ำเชื่อม Mint 30 กรัม" },
          { title: "นมสด 120 กรัม" },
          { title: "น้ำเชื่อม 15 กรัม ผสมในแก้ว 16oz" },
          { title: "ใส่น้ำแข็งพอดีแก้ว" },
          { title: "ราด Choc Sauce รอบแก้ว 6 กรัม" },
          { title: "Choc Sauce 20 กรัม" },
          { title: "นมสด 40 กรัม ผสมให้เข้ากัน ราดด้านบน" },
          { title: "โรยผงโกโก้ 6 กรัม ปิดฝาซิป" },
        ],
      },
    ],
  });

  await add({
    name: "ชามะนาว",
    nameEn: "Iced Lemon Tea",
    categoryId: catTea.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: prepEarlGrey.id, quantity: 150, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 50, unit: "ml" },
          { ingredientId: raw.limeJuice.id, quantity: 15, unit: "ml" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: raw.lemonSlice.id, quantity: 1, unit: "piece" },
        ],
        steps: [
          { title: "ชาเอิร์ลเกรย์ 150 กรัม" },
          { title: "น้ำเชื่อม 50 กรัม" },
          { title: "น้ำมะนาวสด 15 กรัม ผสมในแก้ว 16oz" },
          { title: "ใส่น้ำแข็งพอดีแก้ว" },
          { title: "มะนาวสไลด์ 1 แผ่น ปิดฝาซิป" },
        ],
      },
    ],
  });

  await add({
    name: "ชาพีช",
    nameEn: "Iced Peach Tea",
    categoryId: catTea.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: prepEarlGrey.id, quantity: 150, unit: "g" },
          { ingredientId: raw.peachSyrup.id, quantity: 30, unit: "ml" },
          { ingredientId: raw.limeJuice.id, quantity: 2, unit: "ml", note: "ปลายช้อน" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: raw.lemonSlice.id, quantity: 1, unit: "piece" },
        ],
        steps: [
          { title: "ชาเอิร์ลเกรย์ 150 กรัม" },
          { title: "น้ำเชื่อม Peach 30 กรัม" },
          { title: "น้ำมะนาวสดปลายช้อน ผสมในแก้ว 16oz" },
          { title: "ใส่น้ำแข็งพอดีแก้ว มะนาวสไลด์ 1 แผ่น" },
          { title: "ปิดฝาซิป" },
        ],
      },
    ],
  });

  await add({
    name: "นมชมพู",
    nameEn: "Pink Milk",
    categoryId: catNonCoffee.id,
    sellPrice: 55,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: raw.redSyrup.id, quantity: 40, unit: "ml" },
          { ingredientId: raw.milk.id, quantity: 120, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
        ],
        steps: [
          { title: "น้ำแดง 40 กรัม" },
          { title: "นมสด 120 กรัม ผสมในแก้ว 16oz" },
          { title: "ใส่น้ำแข็งพอดีแก้ว" },
          { title: "โฟมนมเต็มแก้ว ปิดฝาซิปเสิร์ฟ" },
        ],
      },
    ],
  });

  await add({
    name: "ชาเขียวนม",
    nameEn: "Iced Green Milk Tea",
    categoryId: catTea.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: "แก้ว 16oz",
        ingredients: [
          { ingredientId: prepMilkMixSweet.id, quantity: 70, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 45, unit: "g" },
          { ingredientId: prepGreenTeaBrew.id, quantity: 60, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 10, unit: "ml" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
        ],
        steps: [
          { title: "นมมิกซ์หวาน 70 กรัม" },
          { title: "นมสด 45 กรัม" },
          { title: "น้ำชาเขียว 60 ml (จากใบชา 18 กรัม)" },
          { title: "น้ำเชื่อม 10 กรัม ผสมให้เข้ากัน Cool Down" },
          { title: "เทใส่แก้ว โฟมนมเต็มแก้ว ปิดฝาซิปเสิร์ฟ" },
        ],
      },
    ],
  });

  // ===== Signature =====
  const coconutMousseBase = (extra: { ingredientId: string; quantity: number; unit: string; note?: string }[]) => [
    { ingredientId: raw.coconutWater.id, quantity: 100, unit: "ml" },
    { ingredientId: raw.simpleSyrup.id, quantity: 10, unit: "ml" },
    { ingredientId: raw.coconutSyrup.id, quantity: 5, unit: "ml" },
    { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
    { ingredientId: raw.milk.id, quantity: 75, unit: "g" },
    ...extra,
  ];

  await add({
    name: "มะพร้าวมูส ลาเต้",
    nameEn: "Coconut Mousse Latte",
    categoryId: catSignature.id,
    sellPrice: 100,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: coconutMousseBase([
          { ingredientId: prepEspresso.id, quantity: 80, unit: "g", note: "กาแฟ 2 shot" },
          { ingredientId: raw.cocoaPowder.id, quantity: 2, unit: "g", note: "โรยผงโกโก้" },
        ]),
        steps: [
          { title: "น้ำมะพร้าว 100 g." },
          { title: "น้ำเชื่อม 10 g." },
          { title: "น้ำเชื่อมมะพร้าว 5 g." },
          { title: "น้ำแข็ง" },
          { title: "นมสด 75 g." },
          { title: "กาแฟ 2 shot" },
          { title: "ผงโกโก้" },
        ],
      },
    ],
  });

  await add({
    name: "มะพร้าวมูส มัทฉะ",
    nameEn: "Coconut Mousse Matcha",
    categoryId: catSignature.id,
    sellPrice: 100,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: coconutMousseBase([
          { ingredientId: raw.matchaPowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 35, unit: "g", note: "ละลายมัทฉะ" },
          { ingredientId: raw.matchaPowder.id, quantity: 1, unit: "g", note: "โรยผงมัทฉะ" },
        ]),
        steps: [
          { title: "น้ำมะพร้าว 100 g." },
          { title: "น้ำเชื่อม 10 g." },
          { title: "น้ำเชื่อมมะพร้าว 5 g." },
          { title: "น้ำแข็ง" },
          { title: "นมสด 75 g." },
          { title: "matcha 5 g. / นม 35 g." },
          { title: "ผงมัทฉะ" },
        ],
      },
    ],
  });

  await add({
    name: "มะพร้าวมูส ชาไทย",
    nameEn: "Coconut Mousse Thai Tea",
    categoryId: catSignature.id,
    sellPrice: 100,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: coconutMousseBase([
          { ingredientId: prepThaiTeaBrew.id, quantity: 60, unit: "g", note: "ใบชาไทย 15 g. / สกัด 60 g." },
        ]),
        steps: [
          { title: "น้ำมะพร้าว 100 g." },
          { title: "น้ำเชื่อม 10 g." },
          { title: "น้ำเชื่อมมะพร้าว 5 g." },
          { title: "น้ำแข็ง" },
          { title: "นมสด 75 g." },
          { title: "ใบชาไทย 15 g. / สกัด 60 g." },
        ],
      },
    ],
  });

  await add({
    name: "ยูสุโซดา",
    nameEn: "Yuzu Soda",
    categoryId: catSignature.id,
    sellPrice: 85,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.yuzu.id, quantity: 15, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 30, unit: "ml" },
          { ingredientId: raw.soda.id, quantity: 105, unit: "ml", note: "30g ผสม + 75g เติม" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: raw.blueberry.id, quantity: 6, unit: "piece", note: "แช่แข็ง 5 + สด 1" },
          { ingredientId: raw.lemonSlice.id, quantity: 1, unit: "piece", note: "1/2 สไลด์" },
          { ingredientId: raw.strawberryFresh.id, quantity: 1, unit: "piece", note: "1/2 ลูก" },
          { ingredientId: raw.rosemary.id, quantity: 1, unit: "piece" },
        ],
        steps: [
          { title: "ส้มยูสุ 15 กรัม + น้ำเชื่อม 30 กรัม" },
          { title: "โซดา 30 g. ผสมให้เข้ากัน" },
          { title: "น้ำแข็ง + บลูเบอร์รี่แช่แข็ง" },
          { title: "Soda 75 g." },
          { title: "บลูเบอร์รี่สด 1 ลูก / เลมอน 1/2 สไลด์" },
          { title: "สตรอเบอร์รี่สด 1/2 ลูก / โรสแมรี่" },
        ],
      },
    ],
  });

  await add({
    name: "ยูสุกาแฟ (กลาง-เข้ม)",
    nameEn: "Yuzu Coffee",
    categoryId: catSignature.id,
    sellPrice: 95,
    sizes: [
      {
        sizeName: "14 oz",
        ingredients: [
          { ingredientId: raw.yuzu.id, quantity: 15, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 30, unit: "ml" },
          { ingredientId: raw.soda.id, quantity: 30, unit: "ml" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: prepEspresso.id, quantity: 40, unit: "g", note: "อเมริกาโน่ Shaker" },
          { ingredientId: raw.blueberry.id, quantity: 1, unit: "piece" },
          { ingredientId: raw.lemonSlice.id, quantity: 1, unit: "piece", note: "1/2 สไลด์" },
          { ingredientId: raw.rosemary.id, quantity: 1, unit: "piece" },
        ],
        steps: [
          { title: "ส้มยูสุ 15 กรัม + น้ำเชื่อม 30 กรัม" },
          { title: "โซดา 30 g. ผสมให้เข้ากัน" },
          { title: "น้ำแข็ง" },
          { title: "กาแฟ 1 ช็อต อเมริกาโน่ Shaker" },
          { title: "ท็อปด้วยบลูเบอร์รี่สด 1 ลูก / เลมอน 1/2 สไลด์ / Rosemary 1 pcs" },
        ],
      },
    ],
  });

  await add({
    name: "กุหลาบมะนาวกาแฟ",
    nameEn: "Rose Lemon Coffee",
    categoryId: catSignature.id,
    sellPrice: 100,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.roseSyrup.id, quantity: 40, unit: "ml" },
          { ingredientId: raw.simpleSyrup.id, quantity: 5, unit: "ml" },
          { ingredientId: raw.lemonJuice.id, quantity: 10, unit: "ml" },
          { ingredientId: raw.soda.id, quantity: 80, unit: "ml" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: prepEspresso.id, quantity: 80, unit: "g", note: "Shaker" },
          { ingredientId: raw.roseDried.id, quantity: 1, unit: "g", note: "โรย" },
        ],
        steps: [
          { title: "น้ำเชื่อมกุหลาบ 40 g." },
          { title: "น้ำเชื่อม 5 กรัม" },
          { title: "น้ำมะนาวเหลือง 10 g. Lemon" },
          { title: "โซดา 80 g." },
          { title: "น้ำแข็ง" },
          { title: "Espresso กาแฟ 2 ช็อต / เอามา Shaker" },
          { title: "โรยดอกกุหลาบแห้ง" },
        ],
      },
    ],
  });

  await add({
    name: "เอสเปรสโซ่ โทนิค",
    nameEn: "Espresso Tonic",
    categoryId: catSignature.id,
    sellPrice: 100,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.tripleSec.id, quantity: 30, unit: "ml" },
          { ingredientId: raw.tonic.id, quantity: 150, unit: "ml" },
          { ingredientId: raw.orangeSlice.id, quantity: 1, unit: "piece", note: "1/2 slide" },
          { ingredientId: raw.rosemary.id, quantity: 1, unit: "piece", note: "โรสในใบเล็ก" },
          { ingredientId: raw.ice.id, quantity: 200, unit: "g" },
          { ingredientId: prepEspresso.id, quantity: 80, unit: "g" },
          { ingredientId: raw.orangeJuice.id, quantity: 10, unit: "ml", note: "Toping Orange" },
        ],
        steps: [
          { title: "Triple Sec Syrup 30 g." },
          { title: "Tonic 150 g." },
          { title: "orange 1/2 slide ใส่ขอบ ฝั่งข้างใต้ใบ โรสในใบเล็ก" },
          { title: "น้ำแข็ง" },
          { title: "กาแฟ 2 ช็อต" },
          { title: "Toping Orange" },
        ],
      },
    ],
  });

  await add({
    name: "เดอร์ตี้ ลาเต้",
    nameEn: "Dirty Latte",
    categoryId: catSignature.id,
    sellPrice: 90,
    sizes: [
      {
        sizeName: "8 oz",
        ingredients: [
          { ingredientId: raw.whippingCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 50, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 5, unit: "ml" },
          { ingredientId: prepRistretto.id, quantity: 20, unit: "g", note: "Ristretto 23 g. กดน้ำ 10-15 g." },
        ],
        steps: [
          { title: "วิปปิ้งครีม 30 g." },
          { title: "นมสด 50 g." },
          { title: "น้ำเชื่อม 5 กรัม" },
          { title: "กาแฟ Ristretto 23 g. กดน้ำ 10-15 g." },
        ],
      },
    ],
  });

  await add({
    name: "ดับเบิ้ล เดอร์ตี้",
    nameEn: "Double Dirty",
    categoryId: catSignature.id,
    sellPrice: 110,
    sizes: [
      {
        sizeName: "8 oz",
        ingredients: [
          { ingredientId: raw.chocSauceUnsweet.id, quantity: 10, unit: "g" },
          { ingredientId: raw.whippingCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 50, unit: "g" },
          { ingredientId: raw.simpleSyrup.id, quantity: 5, unit: "ml" },
          { ingredientId: prepRistretto.id, quantity: 20, unit: "g", note: "Ristretto 23 g. กดน้ำ 10-15 g." },
        ],
        steps: [
          { title: "ช็อกโกแลตซอส (ไม่หวาน) 10 g." },
          { title: "วิปปิ้งครีม 30 g." },
          { title: "นมสด 50 g." },
          { title: "น้ำเชื่อม 5 กรัม" },
          { title: "กาแฟ Ristretto 23 g. กดน้ำ 10-15 g." },
        ],
      },
    ],
  });

  // ===== Frappe =====
  await add({
    name: "Espresso Frappe",
    nameEn: "Espresso Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.condensedMilk.id, quantity: 15, unit: "g" },
          { ingredientId: prepEspresso.id, quantity: 60, unit: "g", note: "Lungo shot 1:3" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.caramelSauce.id, quantity: 5, unit: "g", note: "Caramel Syrup" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมข้นหวาน 0.5 oz (15 g.)" },
          { title: "Lungo shot 1:3 — 20 g. (น้ำกาแฟ 60 กรัม)" },
          { title: "Frappe Powder 0.5 Spoon (5 g.)" },
          { title: "Caramel Syrup" },
        ],
      },
    ],
  });

  await add({
    name: "Caramel Coffee Frappe",
    nameEn: "Caramel Coffee Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 15, unit: "g" },
          { ingredientId: prepEspresso.id, quantity: 40, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.caramelSauce.id, quantity: 15, unit: "g", note: "2 pumps" },
          { ingredientId: raw.whippedCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมสด 0.5 oz (15 g.)" },
          { title: "Espresso (D) 20 g. (น้ำกาแฟ 40 กรัม)" },
          { title: "Frappe Powder 0.5 Spoon" },
          { title: "2 pumps (15 g.)" },
          { title: "Whipped Cream 1 pcs + caramel sauce" },
        ],
      },
    ],
  });

  await add({
    name: "Vanilla Cream Frappe",
    nameEn: "Vanilla Cream Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 80, unit: "g" },
          { ingredientId: raw.vanillaSyrup.id, quantity: 15, unit: "ml", note: "Vanilla / Caramel 2 pumps" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.whippedCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมสด 2.5 oz (80 g.)" },
          { title: "Vanilla syrup / Caramel 2 pumps (15 g.)" },
          { title: "Frappe Powder 0.5 Spoon" },
          { title: "Whipped Cream 1 pcs (30 g.)" },
        ],
      },
    ],
  });

  await add({
    name: "Matcha Green Tea Cream Frappe",
    nameEn: "Matcha Green Tea Cream Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 80, unit: "g" },
          { ingredientId: raw.matchaPowder.id, quantity: 10, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.whippedCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมสด 2.5 oz (80 g.)" },
          { title: "Matcha powder 10 g." },
          { title: "Frappe Powder 0.5 Spoon" },
          { title: "Whipped Cream 1 pcs (30 g.)" },
        ],
      },
    ],
  });

  await add({
    name: "Cha-Yen Frappe",
    nameEn: "Thai Tea Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.condensedMilk.id, quantity: 20, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 40, unit: "g" },
          { ingredientId: prepThaiTeaBrew.id, quantity: 20, unit: "g", note: "cha shot — น้ำชา 90 ml" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.whippedCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมข้นหวาน 0.5 oz (20 g.)" },
          { title: "นมสด 1.5 oz (40 g.)" },
          { title: "cha shot 20 g. (น้ำชา 90 ml.)" },
          { title: "Frappe Powder 0.5 Spoon" },
          { title: "Whipped Cream 1 pcs (30 g.)" },
        ],
      },
    ],
  });

  await add({
    name: "Mocha Frappe",
    nameEn: "Mocha Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.condensedMilk.id, quantity: 15, unit: "g" },
          { ingredientId: raw.chocSauce.id, quantity: 70, unit: "g" },
          { ingredientId: prepEspresso.id, quantity: 40, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.whippedCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมข้นหวาน 0.5 oz (15 g.)" },
          { title: "chocolate sauce 2 oz (70 g.)" },
          { title: "Espresso (D) 20 g. (น้ำกาแฟ 40 กรัม)" },
          { title: "Frappe Powder 0.5 Spoon" },
          { title: "Whipped Cream 1 pcs + Chocolate Sauce" },
        ],
      },
    ],
  });

  await add({
    name: "Chocolate Frappe",
    nameEn: "Chocolate Frappe",
    categoryId: catFrappe.id,
    sellPrice: 80,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: prepFrappeMix.id, quantity: 85, unit: "g" },
          { ingredientId: raw.condensedMilk.id, quantity: 15, unit: "g" },
          { ingredientId: raw.milk.id, quantity: 60, unit: "g" },
          { ingredientId: raw.chocSauce.id, quantity: 70, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.whippedCream.id, quantity: 30, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed หวาน 3 oz / 85 g." },
          { title: "นมข้นหวาน 0.5 oz (15 g.)" },
          { title: "นมสด 2 oz (60 g.)" },
          { title: "chocolate sauce 2 oz (70 g.)" },
          { title: "Frappe Powder 0.5 Spoon" },
          { title: "Whipped Cream 1 pcs + Chocolate Sauce" },
        ],
      },
    ],
  });

  // ===== Smoothies =====
  await add({
    name: "Strawberry Smoothies",
    nameEn: "Strawberry Smoothies",
    categoryId: catSmoothies.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.strawberryPuree.id, quantity: 130, unit: "g" },
          { ingredientId: raw.water.id, quantity: 60, unit: "ml" },
          { ingredientId: raw.limeJuice.id, quantity: 8, unit: "ml" },
          { ingredientId: raw.fructose.id, quantity: 10, unit: "g" },
          { ingredientId: raw.salt.id, quantity: 1, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Strawberry Puree 130 g." },
          { title: "น้ำกรอง 2 oz (60 g.)" },
          { title: "น้ำมะนาว 0.25 oz (8 g.)" },
          { title: "Fructose 0.5 oz (10 g.)" },
          { title: "เกลือ 1 ช้อนชา" },
          { title: "Frappe Powder 0.5 Spoon" },
        ],
      },
    ],
  });

  await add({
    name: "Lychee Smoothie",
    nameEn: "Lychee Smoothie",
    categoryId: catSmoothies.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.lycheePuree.id, quantity: 60, unit: "g" },
          { ingredientId: raw.lycheeConcentrate.id, quantity: 40, unit: "ml" },
          { ingredientId: raw.water.id, quantity: 60, unit: "ml" },
          { ingredientId: raw.limeJuice.id, quantity: 6, unit: "ml" },
          { ingredientId: raw.fructose.id, quantity: 5, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Lychee Puree 60 g." },
          { title: "Lychee concentrate 1.5 oz (40 g.)" },
          { title: "น้ำกรอง 2 oz (60 g.)" },
          { title: "น้ำมะนาว 6 กรัม" },
          { title: "Fructose (5 g)" },
          { title: "Frappe Powder 0.5 Spoon" },
        ],
      },
    ],
  });

  await add({
    name: "Mixed Berry Smoothies",
    nameEn: "Mixed Berry Smoothies",
    categoryId: catSmoothies.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.mixedBerryFrozen.id, quantity: 50, unit: "g" },
          { ingredientId: raw.strawberryPuree.id, quantity: 110, unit: "g" },
          { ingredientId: raw.fructose.id, quantity: 20, unit: "g" },
          { ingredientId: raw.water.id, quantity: 60, unit: "ml" },
          { ingredientId: raw.limeJuice.id, quantity: 5, unit: "ml" },
          { ingredientId: raw.salt.id, quantity: 1, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Mixed Berry frozen 50 g." },
          { title: "Strawberry Puree 110 g." },
          { title: "Fructose 0.5 oz (20 g.)" },
          { title: "น้ำกรอง 2 oz (60 g.)" },
          { title: "น้ำมะนาว 5 กรัม + เกลือช้อนชา" },
          { title: "Frappe Powder 0.5 Spoon" },
        ],
      },
    ],
  });

  await add({
    name: "Passion Fruit Smoothies",
    nameEn: "Passion Fruit Smoothies",
    categoryId: catSmoothies.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: "16 oz",
        ingredients: [
          { ingredientId: raw.passionFruitPuree.id, quantity: 120, unit: "g" },
          { ingredientId: raw.water.id, quantity: 60, unit: "ml" },
          { ingredientId: raw.limeJuice.id, quantity: 3, unit: "ml" },
          { ingredientId: raw.fructose.id, quantity: 10, unit: "g" },
          { ingredientId: raw.salt.id, quantity: 1, unit: "g" },
          { ingredientId: raw.frappePowder.id, quantity: 5, unit: "g" },
          { ingredientId: raw.ice.id, quantity: 250, unit: "g" },
        ],
        steps: [
          { title: "Passion Fruit Puree 120 g." },
          { title: "น้ำกรอง 2 oz (60 g.)" },
          { title: "น้ำมะนาว (3 g.)" },
          { title: "Fructose 0.5 oz (10 g.)" },
          { title: "เกลือ 1 ช้อนชา" },
          { title: "Frappe Powder 0.5 Spoon" },
        ],
      },
    ],
  });

  console.log(`\n🎉 Done: ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error("❌ add-menu-items failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
