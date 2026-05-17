"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";

export async function listCategories() {
  const userId = await getCurrentUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export type CreateCategoryResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

export async function createCategory(input: CategoryInput): Promise<CreateCategoryResult> {
  const userId = await getCurrentUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { name, nameEn, color, icon } = parsed.data;

  const category = await prisma.category.create({
    data: {
      name,
      nameEn: nameEn || null,
      color: color || null,
      icon: icon || null,
      userId,
    },
    select: { id: true, name: true },
  });

  revalidatePath("/recipes");
  return { ok: true, id: category.id, name: category.name };
}

export async function deleteCategory(id: string) {
  const userId = await getCurrentUserId();
  await prisma.category.delete({ where: { id, userId } });
  revalidatePath("/recipes");
}
