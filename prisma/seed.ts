// prisma/seed.ts
// Seed data จากตาราง Coffee Menu จริง
// รัน: npm run seed (หรือ npx tsx prisma/seed.ts)

import { PrismaClient, IngredientType, RecipeType, BatchSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===== 1. Create admin user =====
  const passwordHash = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@admin.com',
      name: 'Admin',
      password: passwordHash,
      locale: 'th',
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // ===== 2. Categories =====
  const coffeeCategory = await prisma.category.create({
    data: {
      name: 'กาแฟ',
      nameEn: 'Coffee',
      color: '#8B4513',
      icon: '☕',
      order: 1,
      userId: user.id,
    },
  });

  const teaCategory = await prisma.category.create({
    data: {
      name: 'ชา',
      nameEn: 'Tea',
      color: '#228B22',
      icon: '🍵',
      order: 2,
      userId: user.id,
    },
  });

  console.log('✅ Categories created');

  // ===== 3. RAW Ingredients =====
  const rawIngredientsData = [
    { name: 'นมสด', nameEn: 'Fresh Milk', baseUnit: 'g', shelfLifeDays: 7 },
    { name: 'วิปครีม', nameEn: 'Whipping Cream', baseUnit: 'g', shelfLifeDays: 14 },
    { name: 'เมล็ดกาแฟ', nameEn: 'Coffee Beans', baseUnit: 'g', shelfLifeDays: 30 },
    { name: 'น้ำเปล่า', nameEn: 'Water', baseUnit: 'ml', shelfLifeDays: null },
    { name: 'น้ำแข็ง', nameEn: 'Ice', baseUnit: 'g', shelfLifeDays: null },
    { name: 'ผงโกโก้', nameEn: 'Cocoa Powder', baseUnit: 'g', shelfLifeDays: 180 },
    { name: 'ผงมัทฉะ', nameEn: 'Matcha Powder', baseUnit: 'g', shelfLifeDays: 180 },
    { name: 'น้ำตาล', nameEn: 'Sugar', baseUnit: 'g', shelfLifeDays: 365 },
    { name: 'ช็อคโกแลตซอส', nameEn: 'Chocolate Sauce', baseUnit: 'g', shelfLifeDays: 60 },
    { name: 'คาราเมลซอส', nameEn: 'Caramel Sauce', baseUnit: 'g', shelfLifeDays: 60 },
    { name: 'น้ำส้ม', nameEn: 'Orange Juice', baseUnit: 'ml', shelfLifeDays: 5 },
    { name: 'น้ำเชื่อม', nameEn: 'Simple Syrup', baseUnit: 'ml', shelfLifeDays: 30 },
    { name: 'โซดา', nameEn: 'Soda Water', baseUnit: 'ml', shelfLifeDays: 60 },
    { name: 'โรสแมรี่', nameEn: 'Rosemary', baseUnit: 'piece', shelfLifeDays: 7 },
  ];

  const rawIngredients: Record<string, string> = {};

  for (const data of rawIngredientsData) {
    const ing = await prisma.ingredient.create({
      data: {
        ...data,
        type: IngredientType.RAW,
        userId: user.id,
        minStockAlert: 100,
      },
    });
    rawIngredients[data.name] = ing.id;
  }

  console.log(`✅ ${rawIngredientsData.length} RAW ingredients created`);

  // ===== 4. Ingredient Variants (for price comparison) =====
  // ตัวอย่าง: นมสด 2 ยี่ห้อ
  const milkVariant1 = await prisma.ingredientVariant.create({
    data: {
      ingredientId: rawIngredients['นมสด'],
      brand: 'Mali',
      packageSize: 1000,
      packageUnit: 'ml',
      price: 65,
      pricePerBaseUnit: 0.065,
      supplier: 'Makro',
    },
  });

  const milkVariant2 = await prisma.ingredientVariant.create({
    data: {
      ingredientId: rawIngredients['นมสด'],
      brand: 'ออคิด',
      packageSize: 946,
      packageUnit: 'ml',
      price: 58,
      pricePerBaseUnit: 0.0613,
      supplier: 'Lotus',
    },
  });

  // ตั้ง default variant เป็นตัวที่ราคาดีกว่า
  await prisma.ingredient.update({
    where: { id: rawIngredients['นมสด'] },
    data: { defaultVariantId: milkVariant2.id },
  });

  // เมล็ดกาแฟ variant
  await prisma.ingredientVariant.create({
    data: {
      ingredientId: rawIngredients['เมล็ดกาแฟ'],
      brand: 'Doi Chaang Premium',
      packageSize: 250,
      packageUnit: 'g',
      price: 350,
      pricePerBaseUnit: 1.4,
      supplier: 'Doi Chaang Shop',
    },
  });

  console.log('✅ Ingredient variants created');

  // ===== 5. PREP Recipe: นมมิกซ์จืด =====
  // สร้าง prep recipe ก่อน
  const milkMixRecipe = await prisma.recipe.create({
    data: {
      name: 'นมมิกซ์จืด',
      nameEn: 'Plain Milk Mix',
      recipeType: RecipeType.PREP,
      description: 'นมผสมวิปครีม สำหรับใช้ในเมนูเครื่องดื่ม',
      yieldQuantity: 1200,
      yieldUnit: 'g',
      userId: user.id,
      prepIngredients: {
        create: [
          {
            ingredientId: rawIngredients['นมสด'],
            quantity: 1000,
            unit: 'g',
            order: 1,
          },
          {
            ingredientId: rawIngredients['วิปครีม'],
            quantity: 200,
            unit: 'g',
            order: 2,
          },
        ],
      },
      prepSteps: {
        create: [
          {
            stepNo: 1,
            title: 'เทนมสด',
            detail: 'เทนมสด 1000g ลงในภาชนะผสม',
          },
          {
            stepNo: 2,
            title: 'เติมวิปครีม',
            detail: 'เติมวิปครีม 200g คนให้เข้ากัน',
          },
          {
            stepNo: 3,
            title: 'แช่เย็น',
            detail: 'แช่เย็นทันที ใช้งานได้ภายใน 2 วัน',
          },
        ],
      },
    },
  });

  // สร้าง Ingredient PREP type ที่ link กับ prep recipe นี้
  const milkMixIngredient = await prisma.ingredient.create({
    data: {
      name: 'นมมิกซ์จืด',
      nameEn: 'Plain Milk Mix',
      type: IngredientType.PREP,
      baseUnit: 'g',
      shelfLifeDays: 2,
      minStockAlert: 500,
      userId: user.id,
      prepRecipeId: milkMixRecipe.id,
    },
  });

  // PREP recipe ที่ 2: เทนมมิกซ์ปรืด (มีในเมนูเย็น)
  const milkMixColdRecipe = await prisma.recipe.create({
    data: {
      name: 'นมมิกซ์ปรืด',
      nameEn: 'Cold Milk Mix',
      recipeType: RecipeType.PREP,
      yieldQuantity: 1200,
      yieldUnit: 'g',
      userId: user.id,
      prepIngredients: {
        create: [
          {
            ingredientId: rawIngredients['นมสด'],
            quantity: 1000,
            unit: 'g',
            order: 1,
          },
          {
            ingredientId: rawIngredients['วิปครีม'],
            quantity: 200,
            unit: 'g',
            order: 2,
          },
        ],
      },
    },
  });

  const milkMixColdIngredient = await prisma.ingredient.create({
    data: {
      name: 'นมมิกซ์ปรืด',
      nameEn: 'Cold Milk Mix',
      type: IngredientType.PREP,
      baseUnit: 'g',
      shelfLifeDays: 2,
      userId: user.id,
      prepRecipeId: milkMixColdRecipe.id,
    },
  });

  // PREP: Espresso (M)
  const espressoRecipe = await prisma.recipe.create({
    data: {
      name: 'Espresso (M)',
      nameEn: 'Espresso Shot',
      recipeType: RecipeType.PREP,
      yieldQuantity: 40,
      yieldUnit: 'g',
      userId: user.id,
      prepIngredients: {
        create: [
          {
            ingredientId: rawIngredients['เมล็ดกาแฟ'],
            quantity: 18,
            unit: 'g',
          },
          {
            ingredientId: rawIngredients['น้ำเปล่า'],
            quantity: 30,
            unit: 'ml',
          },
        ],
      },
    },
  });

  const espressoIngredient = await prisma.ingredient.create({
    data: {
      name: 'Espresso (M)',
      nameEn: 'Espresso Shot',
      type: IngredientType.PREP,
      baseUnit: 'g',
      shelfLifeDays: 1,
      userId: user.id,
      prepRecipeId: espressoRecipe.id,
    },
  });

  // PREP: Ristretto (M)
  const ristrettoRecipe = await prisma.recipe.create({
    data: {
      name: 'Ristretto (M)',
      nameEn: 'Ristretto Shot',
      recipeType: RecipeType.PREP,
      yieldQuantity: 20,
      yieldUnit: 'g',
      userId: user.id,
      prepIngredients: {
        create: [
          {
            ingredientId: rawIngredients['เมล็ดกาแฟ'],
            quantity: 18,
            unit: 'g',
          },
          {
            ingredientId: rawIngredients['น้ำเปล่า'],
            quantity: 15,
            unit: 'ml',
          },
        ],
      },
    },
  });

  const ristrettoIngredient = await prisma.ingredient.create({
    data: {
      name: 'Ristretto (M)',
      nameEn: 'Ristretto Shot',
      type: IngredientType.PREP,
      baseUnit: 'g',
      shelfLifeDays: 1,
      userId: user.id,
      prepRecipeId: ristrettoRecipe.id,
    },
  });

  console.log('✅ PREP recipes & ingredients created (4 items)');

  // ===== 6. SALE Recipes (from Coffee Menu) =====

  // Helper: สร้าง sale recipe + size + ingredients + steps
  async function createSaleRecipe(opts: {
    name: string;
    nameEn?: string;
    categoryId: string;
    sellPrice?: number;
    sizes: Array<{
      sizeName: string;
      ingredients: Array<{
        ingredientId: string;
        quantity: number;
        unit: string;
        note?: string;
      }>;
      steps: Array<{ stepNo: number; title?: string; detail?: string }>;
    }>;
  }) {
    return prisma.recipe.create({
      data: {
        name: opts.name,
        nameEn: opts.nameEn,
        recipeType: RecipeType.SALE,
        categoryId: opts.categoryId,
        sellPrice: opts.sellPrice,
        userId: user.id,
        sizes: {
          create: opts.sizes.map((s, idx) => ({
            sizeName: s.sizeName,
            order: idx,
            ingredients: { create: s.ingredients },
            steps: { create: s.steps },
          })),
        },
      },
    });
  }

  // --- Espresso (เสิร์ฟตรง) ---
  await createSaleRecipe({
    name: 'Espresso',
    nameEn: 'Espresso',
    categoryId: coffeeCategory.id,
    sellPrice: 50,
    sizes: [
      {
        sizeName: 'แก้วกระดาษ 8oz',
        ingredients: [
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'Espresso (M) 40 กรัม' },
        ],
      },
    ],
  });

  // --- อเมริกาโน่ (ร้อน) ---
  await createSaleRecipe({
    name: 'อเมริกาโน่',
    nameEn: 'Americano',
    categoryId: coffeeCategory.id,
    sellPrice: 55,
    sizes: [
      {
        sizeName: 'แก้วกระดาษ 8oz',
        ingredients: [
          { ingredientId: rawIngredients['น้ำเปล่า'], quantity: 40, unit: 'ml', note: 'น้ำอุณหภูมิห้อง' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g', note: 'Espresso (D)' },
        ],
        steps: [
          { stepNo: 1, title: 'น้ำอุณหภูมิห้อง 40 กรัม' },
          { stepNo: 2, title: 'น้ำร้อน 140 กรัม' },
          { stepNo: 3, title: 'Espresso (M) (D) 40 กรัม' },
        ],
      },
    ],
  });

  // --- ลาเต้ (ร้อน) ---
  await createSaleRecipe({
    name: 'ลาเต้ (ร้อน)',
    nameEn: 'Latte (Hot)',
    categoryId: coffeeCategory.id,
    sellPrice: 60,
    sizes: [
      {
        sizeName: 'แก้วกระดาษ 8oz',
        ingredients: [
          { ingredientId: ristrettoIngredient.id, quantity: 20, unit: 'g' },
          { ingredientId: milkMixIngredient.id, quantity: 180, unit: 'g', note: 'สตีมนมร้อน' },
        ],
        steps: [
          { stepNo: 1, title: 'Ristretto (M) 20 กรัม' },
          { stepNo: 2, title: 'สตีมนมร้อน 180 กรัม' },
          { stepNo: 3, title: 'รินด้วย Free Pour โฟมหนา 0.5 cm' },
        ],
      },
      {
        sizeName: 'แก้ว 4oz',
        ingredients: [
          { ingredientId: ristrettoIngredient.id, quantity: 20, unit: 'g' },
          { ingredientId: milkMixIngredient.id, quantity: 120, unit: 'g', note: 'สตีมนมร้อน' },
        ],
        steps: [
          { stepNo: 1, title: 'Ristretto (M) 20 กรัม' },
          { stepNo: 2, title: 'สตีมนมร้อน 120 กรัม' },
          { stepNo: 3, title: 'รินด้วย Free Pour โฟมหนา 0.5 cm' },
        ],
      },
    ],
  });

  // --- คาปูชิโน่ (ร้อน) ---
  await createSaleRecipe({
    name: 'คาปูชิโน่ (ร้อน)',
    nameEn: 'Cappuccino (Hot)',
    categoryId: coffeeCategory.id,
    sellPrice: 60,
    sizes: [
      {
        sizeName: 'แก้วกระดาษ 8oz',
        ingredients: [
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
          { ingredientId: milkMixIngredient.id, quantity: 120, unit: 'g', note: 'สตีมนมร้อน 1/2 cup' },
        ],
        steps: [
          { stepNo: 1, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 2, title: 'สตีมนมร้อน 1/2 cup' },
          { stepNo: 3, title: 'Foam 1/2 cup 150ml' },
        ],
      },
    ],
  });

  // --- มอคค่า (ร้อน) ---
  await createSaleRecipe({
    name: 'มอคค่า (ร้อน)',
    nameEn: 'Mocha (Hot)',
    categoryId: coffeeCategory.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: 'แก้วกระดาษ 8oz',
        ingredients: [
          { ingredientId: rawIngredients['ช็อคโกแลตซอส'], quantity: 30, unit: 'g', note: 'ใส่ Choc Sauce' },
          { ingredientId: milkMixIngredient.id, quantity: 30, unit: 'g', note: 'นมข้นหวาน' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'ใส่ Choc Sauce 30 กรัม' },
          { stepNo: 2, title: 'นมข้นหวาน 30 กรัม' },
          { stepNo: 3, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 4, title: 'นม' },
          { stepNo: 5, title: 'สตีมนมร้อน 150 ml ต่ำจากปาดแก้ว 1 cm' },
          { stepNo: 6, title: 'รินด้วย Free Pour โฟมหนา 1 cm' },
          { stepNo: 7, title: 'โรย Chocolate Sauce' },
        ],
      },
    ],
  });

  // --- คาราเมลแมคเคียโต้ (ร้อน) ---
  await createSaleRecipe({
    name: 'คาราเมลแมคเคียโต้ (ร้อน)',
    nameEn: 'Caramel Macchiato (Hot)',
    categoryId: coffeeCategory.id,
    sellPrice: 70,
    sizes: [
      {
        sizeName: 'แก้วกระดาษ 8oz',
        ingredients: [
          { ingredientId: rawIngredients['น้ำเชื่อม'], quantity: 10, unit: 'ml', note: 'วนิลาไซรัป 1 ปั๊ม' },
          { ingredientId: milkMixIngredient.id, quantity: 180, unit: 'g', note: 'สตีมนมร้อน' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
          { ingredientId: rawIngredients['คาราเมลซอส'], quantity: 5, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'วนิลาไซรัป 1 ปั๊ม 10 กรัม' },
          { stepNo: 2, title: 'สตีมนมร้อน 180 กรัม' },
          { stepNo: 3, title: 'รินน้ำร้อน ต่ำจากปากแก้ว 1 นิ้ว' },
          { stepNo: 4, title: 'หักโฟมหนา 1 ซม.' },
          { stepNo: 5, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 6, title: 'Top Caramel 5 กรัม' },
        ],
      },
    ],
  });

  // --- อเมริกาโน่ (เย็น) ---
  await createSaleRecipe({
    name: 'อเมริกาโน่ (เย็น)',
    nameEn: 'Iced Americano',
    categoryId: coffeeCategory.id,
    sellPrice: 55,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: rawIngredients['น้ำเปล่า'], quantity: 120, unit: 'ml', note: 'เทน้ำเย็น' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g', note: 'ใส่น้ำแข็ง 1 ช้อนจากปาดแก้ว' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'เทน้ำเย็น 120 กรัม' },
          { stepNo: 2, title: 'ใส่น้ำแข็ง 1 ช้อนจากปาดแก้ว' },
          { stepNo: 3, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 4, title: 'ราดด้านบน' },
          { stepNo: 5, title: 'ปิดฝาซิป เสิร์ฟ' },
        ],
      },
    ],
  });

  // --- ลาเต้ (เย็น) ⭐ ตัวอย่างหลัก ---
  await createSaleRecipe({
    name: 'ลาเต้ (เย็น)',
    nameEn: 'Iced Latte',
    categoryId: coffeeCategory.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: milkMixColdIngredient.id, quantity: 120, unit: 'g', note: 'เทนมมิกซ์ปรืด' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g', note: 'ใส่น้ำแข็ง 1 ช้อนจากปาดแก้ว' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'เทนมมิกซ์ปรืด 120 กรัม' },
          { stepNo: 2, title: 'ใส่น้ำแข็ง 1 ช้อนจากปาดแก้ว' },
          { stepNo: 3, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 4, title: 'ราดด้านบน' },
          { stepNo: 5, title: 'ปิดฝาซิป เสิร์ฟ' },
        ],
      },
    ],
  });

  // --- คาปูชิโน่ (เย็น) ---
  await createSaleRecipe({
    name: 'คาปูชิโน่ (เย็น)',
    nameEn: 'Iced Cappuccino',
    categoryId: coffeeCategory.id,
    sellPrice: 65,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: milkMixColdIngredient.id, quantity: 100, unit: 'g' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'เทนมมิกซ์ปรืด 100 กรัม' },
          { stepNo: 2, title: 'ใส่น้ำแข็ง 1 ช้อนจากปาดแก้ว' },
          { stepNo: 3, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 4, title: 'ใส่โฟมจนเต็มแก้ว' },
          { stepNo: 5, title: 'ปิดฝาซิป เสิร์ฟ' },
          { stepNo: 6, title: 'โรย ผงจิกโก้ ผงจิกโก้' },
        ],
      },
    ],
  });

  // --- มอคค่า (เย็น) ---
  await createSaleRecipe({
    name: 'มอคค่า (เย็น)',
    nameEn: 'Iced Mocha',
    categoryId: coffeeCategory.id,
    sellPrice: 70,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: milkMixColdIngredient.id, quantity: 100, unit: 'g' },
          { ingredientId: rawIngredients['ช็อคโกแลตซอส'], quantity: 20, unit: 'g' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'เทนมมิกซ์ปรืด 100 กรัม' },
          { stepNo: 2, title: 'เทนมข้นหวาน 20 กรัม' },
          { stepNo: 3, title: 'ใส่ Choc Sauce 20 กรัม' },
          { stepNo: 4, title: 'ใส่น้ำเชื่อม 15 กรัม' },
          { stepNo: 5, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 6, title: 'ผสมให้เข้ากันในแก้วเสิร์ฟ 15 กรัม' },
          { stepNo: 7, title: 'เติมน้ำแข็งจนเต็มเสิร์ฟ' },
          { stepNo: 8, title: 'ราด Choc Sauce 5 กรัม รอบแก้ว' },
          { stepNo: 9, title: 'โรยช็อคโกแลตชาร์จ ชุด 6 กรัม' },
        ],
      },
    ],
  });

  // --- คาราเมลแมคเคียโต้ (เย็น) ---
  await createSaleRecipe({
    name: 'คาราเมลแมคเคียโต้ (เย็น)',
    nameEn: 'Iced Caramel Macchiato',
    categoryId: coffeeCategory.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: rawIngredients['น้ำเชื่อม'], quantity: 15, unit: 'ml', note: 'ใส่วานิลาไซรัป' },
          { ingredientId: milkMixColdIngredient.id, quantity: 120, unit: 'g', note: 'เติมนมสดเย็น' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
          { ingredientId: rawIngredients['คาราเมลซอส'], quantity: 5, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'ใส่วานิลาไซรัป 15 กรัม' },
          { stepNo: 2, title: 'เติมนมสดเย็น 120 กรัม' },
          { stepNo: 3, title: 'ใส่น้ำแข็ง 1 ช้อนจากปาดแก้ว' },
          { stepNo: 4, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 5, title: 'ราดด้านบน' },
          { stepNo: 6, title: 'ใส่โฟมจนเต็มแก้ว' },
          { stepNo: 7, title: 'Top Caramel 5 กรัม' },
          { stepNo: 8, title: 'ปิดฝาซิป เสิร์ฟ' },
        ],
      },
    ],
  });

  // --- อเมริกาโน่ส้ม (เย็น) ---
  await createSaleRecipe({
    name: 'อเมริกาโน่ส้ม',
    nameEn: 'Orange Americano',
    categoryId: coffeeCategory.id,
    sellPrice: 75,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: rawIngredients['น้ำส้ม'], quantity: 40, unit: 'ml', note: 'ใส่น้ำคร่อง' },
          { ingredientId: rawIngredients['น้ำเชื่อม'], quantity: 60, unit: 'ml' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g' },
          { ingredientId: rawIngredients['โรสแมรี่'], quantity: 1, unit: 'piece', note: 'ตกแต่งด้วย Rosemary 1 ก้าน' },
        ],
        steps: [
          { stepNo: 1, title: 'ใส่น้ำคร่อง 40 กรัม' },
          { stepNo: 2, title: 'น้ำส้ม 30 กรัม' },
          { stepNo: 3, title: 'น้ำเชื่อม 15 กรัม' },
          { stepNo: 4, title: 'ผสมให้เข้ากัน Prep รอไว้' },
          { stepNo: 5, title: 'ใส่โซดา 60 กรัม' },
          { stepNo: 6, title: 'ใส่น้ำแข็งพอแก้ว' },
          { stepNo: 7, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 8, title: 'ราดด้านบน' },
          { stepNo: 9, title: 'ตกแต่งด้วย Rosemary 1 ก้าน' },
        ],
      },
    ],
  });

  // --- เอสเย็น (เย็น) ---
  await createSaleRecipe({
    name: 'เอสเย็น',
    nameEn: 'Iced Espresso',
    categoryId: coffeeCategory.id,
    sellPrice: 55,
    sizes: [
      {
        sizeName: 'แก้ว 16oz',
        ingredients: [
          { ingredientId: milkMixColdIngredient.id, quantity: 70, unit: 'g', note: 'นมข้นหวาน' },
          { ingredientId: rawIngredients['น้ำเปล่า'], quantity: 45, unit: 'ml', note: 'นมสด' },
          { ingredientId: espressoIngredient.id, quantity: 40, unit: 'g', note: 'Espresso Long Shot' },
          { ingredientId: rawIngredients['น้ำแข็ง'], quantity: 200, unit: 'g' },
        ],
        steps: [
          { stepNo: 1, title: 'นมข้นหวาน 70 กรัม' },
          { stepNo: 2, title: 'นมสด 45 กรัม' },
          { stepNo: 3, title: 'Espresso (M) 40 กรัม' },
          { stepNo: 4, title: 'Long Shot 30 กรัม' },
          { stepNo: 5, title: 'ผสมให้เข้ากัน Cool Down' },
          { stepNo: 6, title: 'เทใส่แก้ว' },
          { stepNo: 7, title: 'ปิดฝาซิป เสิร์ฟ' },
        ],
      },
    ],
  });

  console.log('✅ 13 SALE recipes created');

  // ===== 7. Initial Stock (batches) =====
  console.log('🏭 Creating initial stock batches...');

  const stockData = [
    { name: 'นมสด', qty: 5000, source: BatchSource.PURCHASED },
    { name: 'วิปครีม', qty: 1000, source: BatchSource.PURCHASED },
    { name: 'เมล็ดกาแฟ', qty: 2000, source: BatchSource.PURCHASED },
    { name: 'น้ำเปล่า', qty: 50000, source: BatchSource.PURCHASED },
    { name: 'น้ำแข็ง', qty: 20000, source: BatchSource.PURCHASED },
    { name: 'ช็อคโกแลตซอส', qty: 1000, source: BatchSource.PURCHASED },
    { name: 'คาราเมลซอส', qty: 1000, source: BatchSource.PURCHASED },
    { name: 'น้ำตาล', qty: 5000, source: BatchSource.PURCHASED },
    { name: 'น้ำส้ม', qty: 2000, source: BatchSource.PURCHASED },
    { name: 'น้ำเชื่อม', qty: 1500, source: BatchSource.PURCHASED },
    { name: 'โซดา', qty: 3000, source: BatchSource.PURCHASED },
  ];

  for (const item of stockData) {
    const ingId = rawIngredients[item.name];
    if (!ingId) continue;

    const ing = await prisma.ingredient.findUnique({ where: { id: ingId } });
    if (!ing) continue;

    const expiresAt = ing.shelfLifeDays
      ? new Date(Date.now() + ing.shelfLifeDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.stockBatch.create({
      data: {
        ingredientId: ingId,
        quantity: item.qty,
        initialQuantity: item.qty,
        source: item.source,
        preparedAt: new Date(),
        expiresAt,
      },
    });
  }

  // เตรียม PREP batches ตัวอย่าง
  await prisma.stockBatch.create({
    data: {
      ingredientId: milkMixColdIngredient.id,
      quantity: 1200,
      initialQuantity: 1200,
      source: BatchSource.PREPARED,
      preparedAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.stockBatch.create({
    data: {
      ingredientId: espressoIngredient.id,
      quantity: 400,
      initialQuantity: 400,
      source: BatchSource.PREPARED,
      preparedAt: new Date(),
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Initial stock batches created');

  console.log('\n🎉 Seeding completed!');
  console.log(`\n👤 Login credentials:`);
  console.log(`   Email:    admin@admin.com`);
  console.log(`   Password: admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
