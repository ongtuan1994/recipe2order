"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ingredientSchema,
  type IngredientInput,
} from "@/lib/validations/ingredient";
import { createIngredient, updateIngredient } from "@/lib/actions/ingredient";

interface Labels {
  name: string;
  nameEn: string;
  type: string;
  raw: string;
  prep: string;
  baseUnit: string;
  shelfLifeDays: string;
  minStockAlert: string;
  save: string;
  cancel: string;
  saved: string;
}

interface Props {
  mode: "create" | "edit";
  ingredientId?: string;
  defaultValues: IngredientInput;
  labels: Labels;
  cancelHref: string;
}

const UNIT_OPTIONS = ["g", "kg", "ml", "l", "oz", "lb", "fl_oz", "tsp", "tbsp", "cup", "piece"];

export function IngredientForm({
  mode,
  ingredientId,
  defaultValues,
  labels,
  cancelHref,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<IngredientInput>({
    resolver: zodResolver(ingredientSchema) as unknown as Resolver<IngredientInput>,
    defaultValues,
  });

  const onSubmit = (values: IngredientInput) => {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createIngredient(values)
          : await updateIngredient(ingredientId!, values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.saved);
      router.push(`/ingredients/${res.id}`);
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
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.type}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RAW">{labels.raw}</SelectItem>
                          <SelectItem value="PREP">{labels.prep}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.baseUnit}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
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
                name="shelfLifeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.shelfLifeDays}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={
                          field.value === undefined ||
                          field.value === null ||
                          Number.isNaN(field.value as number)
                            ? ""
                            : (field.value as number)
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="minStockAlert"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.minStockAlert}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={
                        field.value === undefined ||
                        field.value === null ||
                        Number.isNaN(field.value as number)
                          ? ""
                          : (field.value as number)
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
