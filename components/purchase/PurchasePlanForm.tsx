"use client";

import { useTransition } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  purchasePlanSchema,
  type PurchasePlanInput,
} from "@/lib/validations/purchase-plan";
import { createPurchasePlan } from "@/lib/actions/purchase-plan";

export interface PlanSizeOption {
  id: string;
  label: string;
}

interface Labels {
  name: string;
  targetDate: string;
  items: string;
  addItem: string;
  pickSize: string;
  qty: string;
  save: string;
  cancel: string;
  saved: string;
  remove: string;
}

export function PurchasePlanForm({
  sizes,
  labels,
}: {
  sizes: PlanSizeOption[];
  labels: Labels;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PurchasePlanInput>({
    resolver: zodResolver(purchasePlanSchema) as unknown as Resolver<PurchasePlanInput>,
    defaultValues: {
      name: "",
      targetDate: "",
      items: [{ recipeSizeId: sizes[0]?.id ?? "", targetQty: 10 }],
    },
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = (values: PurchasePlanInput) => {
    startTransition(async () => {
      const res = await createPurchasePlan(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.saved);
      router.push(`/purchase-plans/${res.id}`);
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
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.targetDate}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{labels.items}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() =>
                items.append({ recipeSizeId: sizes[0]?.id ?? "", targetQty: 10 })
              }
            >
              <Plus className="h-3.5 w-3.5" /> {labels.addItem}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.fields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_6rem_auto] gap-2 items-end"
              >
                <FormField
                  control={form.control}
                  name={`items.${idx}.recipeSizeId`}
                  render={({ field: f }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>{labels.pickSize}</FormLabel>}
                      <FormControl>
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sizes.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.label}
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
                  name={`items.${idx}.targetQty`}
                  render={({ field: f }) => (
                    <FormItem>
                      {idx === 0 && <FormLabel>{labels.qty}</FormLabel>}
                      <FormControl>
                        <Input type="number" min="1" {...f} value={f.value as number} />
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
                  disabled={items.fields.length === 1}
                  onClick={() => items.remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/purchase-plans")}
          >
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
