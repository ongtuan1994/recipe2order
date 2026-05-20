"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  saleRecipeSchema,
  type SaleRecipeInput,
} from "@/lib/validations/recipe";
import { createRecipe, updateRecipe } from "@/lib/actions/recipe";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { RecipeSizeFields } from "./RecipeSizeFields";
import { NewCategoryDialog } from "./NewCategoryDialog";

export interface CategoryOption {
  id: string;
  name: string;
}
export interface IngredientOption {
  id: string;
  name: string;
  baseUnit: string;
}

export interface RecipeFormLabels {
  name: string;
  nameEn: string;
  category: string;
  uncategorized: string;
  newCategory: string;
  sellPrice: string;
  description: string;
  notes: string;
  image: string;
  uploadImage: string;
  removeImage: string;
  uploadFailed: string;
  sizes: string;
  addSize: string;
  sizeName: string;
  ingredients: string;
  addIngredient: string;
  pickIngredient: string;
  quantity: string;
  unit: string;
  steps: string;
  addStep: string;
  stepTitle: string;
  stepDetail: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  save: string;
  cancel: string;
  saved: string;
  // Dialog
  newCategoryDialogTitle: string;
  categoryNameLabel: string;
  categoryCreated: string;
}

interface Props {
  mode: "create" | "edit";
  recipeId?: string;
  defaultValues: SaleRecipeInput;
  categories: CategoryOption[];
  ingredients: IngredientOption[];
  labels: RecipeFormLabels;
  cancelHref: string;
}

export function RecipeForm({
  mode,
  recipeId,
  defaultValues,
  categories: initialCategories,
  ingredients,
  labels,
  cancelHref,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);

  const form = useForm<SaleRecipeInput>({
    resolver: zodResolver(saleRecipeSchema) as unknown as Resolver<SaleRecipeInput>,
    defaultValues,
  });

  const sizesArray = useFieldArray({ control: form.control, name: "sizes" });

  const onSubmit = (values: SaleRecipeInput) => {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createRecipe(values)
          : await updateRecipe(recipeId!, values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.saved);
      router.push(`/recipes/${res.id}`);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basics */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.image}</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ?? null}
                        onChange={(url) => field.onChange(url ?? "")}
                        folder="recipes"
                        labels={{
                          upload: labels.uploadImage,
                          remove: labels.removeImage,
                          uploadFailed: labels.uploadFailed,
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.name}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.nameEn}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.category}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Select
                            value={field.value || "__none__"}
                            onValueChange={(val) =>
                              field.onChange(val === "__none__" ? "" : val)
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={labels.uncategorized} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">
                                {labels.uncategorized}
                              </SelectItem>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <NewCategoryDialog
                          triggerLabel={labels.newCategory}
                          dialogTitle={labels.newCategoryDialogTitle}
                          nameLabel={labels.categoryNameLabel}
                          saveLabel={labels.save}
                          cancelLabel={labels.cancel}
                          successLabel={labels.categoryCreated}
                          onCreated={(c) => {
                            setCategories((prev) => [...prev, c]);
                            form.setValue("categoryId", c.id, { shouldDirty: true });
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels.sellPrice}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          value={
                            field.value === undefined ||
                            field.value === null ||
                            Number.isNaN(field.value as number)
                              ? ""
                              : (field.value as number)
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? undefined : Number(v));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.description}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.notes}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sizes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{labels.sizes}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  sizesArray.append({
                    sizeName: "",
                    ingredients: [
                      { ingredientId: "", quantity: 0, unit: "g", note: "", isOptional: false },
                    ],
                    steps: [],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                {labels.addSize}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {form.formState.errors.sizes?.root?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.sizes.root.message}
                </p>
              )}
              {sizesArray.fields.map((sizeField, sIdx) => (
                <div key={sizeField.id} className="space-y-4">
                  {sIdx > 0 && <Separator />}
                  <div className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`sizes.${sIdx}.sizeName`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{labels.sizeName}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={labels.remove}
                      disabled={sizesArray.fields.length === 1}
                      onClick={() => sizesArray.remove(sIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <RecipeSizeFields
                    sizeIndex={sIdx}
                    ingredients={ingredients}
                    labels={{
                      ingredients: labels.ingredients,
                      addIngredient: labels.addIngredient,
                      pickIngredient: labels.pickIngredient,
                      quantity: labels.quantity,
                      unit: labels.unit,
                      steps: labels.steps,
                      addStep: labels.addStep,
                      stepTitle: labels.stepTitle,
                      stepDetail: labels.stepDetail,
                      moveUp: labels.moveUp,
                      moveDown: labels.moveDown,
                      remove: labels.remove,
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {labels.save}
            </Button>
          </div>
        </form>
    </Form>
  );
}
