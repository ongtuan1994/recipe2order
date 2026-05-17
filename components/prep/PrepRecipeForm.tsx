"use client";

import { useTransition } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  prepRecipeSchema,
  type PrepRecipeInput,
} from "@/lib/validations/prep-recipe";
import { createPrepRecipe, updatePrepRecipe } from "@/lib/actions/prep-recipe";

export interface IngredientOption {
  id: string;
  name: string;
  baseUnit: string;
}
export interface PrepIngredientOption {
  id: string;
  name: string;
  baseUnit: string;
}

interface Labels {
  name: string;
  nameEn: string;
  outputIngredient: string;
  noPrepIngredient: string;
  yield: string;
  yieldUnit: string;
  description: string;
  notes: string;
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
}

interface Props {
  mode: "create" | "edit";
  prepRecipeId?: string;
  defaultValues: PrepRecipeInput;
  ingredients: IngredientOption[];
  prepIngredientOptions: PrepIngredientOption[];
  labels: Labels;
  cancelHref: string;
}

export function PrepRecipeForm({
  mode,
  prepRecipeId,
  defaultValues,
  ingredients,
  prepIngredientOptions,
  labels,
  cancelHref,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PrepRecipeInput>({
    resolver: zodResolver(prepRecipeSchema) as unknown as Resolver<PrepRecipeInput>,
    defaultValues,
  });

  const ingredientsArray = useFieldArray({
    control: form.control,
    name: "ingredients",
  });
  const stepsArray = useFieldArray({ control: form.control, name: "steps" });
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  const onSubmit = (values: PrepRecipeInput) => {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createPrepRecipe(values)
          : await updatePrepRecipe(prepRecipeId!, values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.saved);
      router.push(`/prep-recipes/${res.id}`);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
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
            <FormField
              control={form.control}
              name="outputIngredientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.outputIngredient}</FormLabel>
                  {prepIngredientOptions.length === 0 ? (
                    <p className="text-sm text-destructive">{labels.noPrepIngredient}</p>
                  ) : (
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {prepIngredientOptions.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name} ({i.baseUnit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="yieldQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.yield}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yieldUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.yieldUnit}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{labels.ingredients}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() =>
                ingredientsArray.append({
                  ingredientId: "",
                  quantity: 0,
                  unit: "g",
                  note: "",
                  isOptional: false,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> {labels.addIngredient}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredientsArray.fields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_5rem_5rem_auto] gap-2 items-end"
              >
                <FormField
                  control={form.control}
                  name={`ingredients.${idx}.ingredientId`}
                  render={({ field: f }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>{labels.pickIngredient}</FormLabel>}
                      <FormControl>
                        <Select
                          value={f.value}
                          onValueChange={(val) => {
                            f.onChange(val);
                            const ing = ingredientById.get(val);
                            if (ing) {
                              form.setValue(`ingredients.${idx}.unit`, ing.baseUnit, {
                                shouldDirty: true,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={labels.pickIngredient} />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`ingredients.${idx}.quantity`}
                  render={({ field: f }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>{labels.quantity}</FormLabel>}
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...f}
                          value={f.value as number}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`ingredients.${idx}.unit`}
                  render={({ field: f }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>{labels.unit}</FormLabel>}
                      <FormControl>
                        <Input {...f} value={f.value ?? ""} />
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
                  onClick={() => ingredientsArray.remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{labels.steps}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => stepsArray.append({ title: "", detail: "" })}
            >
              <Plus className="h-3.5 w-3.5" /> {labels.addStep}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stepsArray.fields.map((field, idx) => (
              <div key={field.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={labels.moveUp}
                      disabled={idx === 0}
                      onClick={() => stepsArray.move(idx, idx - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={labels.moveDown}
                      disabled={idx === stepsArray.fields.length - 1}
                      onClick={() => stepsArray.move(idx, idx + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={labels.remove}
                      onClick={() => stepsArray.remove(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name={`steps.${idx}.title`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{labels.stepTitle}</FormLabel>
                      <FormControl>
                        <Input {...f} value={f.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`steps.${idx}.detail`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{labels.stepDetail}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...f} value={f.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
