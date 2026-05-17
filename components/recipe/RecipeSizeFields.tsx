"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SaleRecipeInput } from "@/lib/validations/recipe";

interface Ingredient {
  id: string;
  name: string;
  baseUnit: string;
}

interface Labels {
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
}

interface Props {
  sizeIndex: number;
  ingredients: Ingredient[];
  labels: Labels;
}

export function RecipeSizeFields({ sizeIndex, ingredients, labels }: Props) {
  const { control, setValue } = useFormContext<SaleRecipeInput>();

  const ingredientsArray = useFieldArray({
    control,
    name: `sizes.${sizeIndex}.ingredients`,
  });

  const stepsArray = useFieldArray({
    control,
    name: `sizes.${sizeIndex}.steps`,
  });

  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  return (
    <div className="space-y-6">
      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">{labels.ingredients}</h4>
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
            <Plus className="h-3.5 w-3.5" />
            {labels.addIngredient}
          </Button>
        </div>
        <div className="space-y-3">
          {ingredientsArray.fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_5rem_5rem_auto] gap-2 items-end"
            >
              <FormField
                control={control}
                name={`sizes.${sizeIndex}.ingredients.${idx}.ingredientId`}
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
                            setValue(
                              `sizes.${sizeIndex}.ingredients.${idx}.unit`,
                              ing.baseUnit,
                              { shouldDirty: true },
                            );
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
                control={control}
                name={`sizes.${sizeIndex}.ingredients.${idx}.quantity`}
                render={({ field: f }) => (
                  <FormItem>
                    {idx === 0 && <FormLabel>{labels.quantity}</FormLabel>}
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        {...f}
                        value={f.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`sizes.${sizeIndex}.ingredients.${idx}.unit`}
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
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">{labels.steps}</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => stepsArray.append({ title: "", detail: "" })}
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.addStep}
          </Button>
        </div>
        <div className="space-y-3">
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
                control={control}
                name={`sizes.${sizeIndex}.steps.${idx}.title`}
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
                control={control}
                name={`sizes.${sizeIndex}.steps.${idx}.detail`}
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
        </div>
      </div>
    </div>
  );
}
