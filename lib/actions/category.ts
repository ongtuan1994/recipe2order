"use server";

import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";

function categoriesTag(userId: string) {
  return `categories:${userId}`;
}

export async function listCategories() {
  const userId = await getCurrentUserId();
  const tag = categoriesTag(userId);
  return unstable_cache(
    () =>
      prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, color: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
    [tag],
    { tags: [tag], revalidate: 300 },
  )();
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

  updateTag(categoriesTag(userId));
  revalidatePath("/recipes");
  return { ok: true, id: category.id, name: category.name };
}

export async function deleteCategory(id: string) {
  const userId = await getCurrentUserId();
  await prisma.category.delete({ where: { id, userId } });
  updateTag(categoriesTag(userId));
  revalidatePath("/recipes");
}
