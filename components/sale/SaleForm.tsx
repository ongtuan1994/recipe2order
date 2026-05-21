"use client";

import { useTransition } from "react";
import { useForm, useFieldArray, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
import { saleSchema, type SaleInput } from "@/lib/validations/sale";
import { recordSale } from "@/lib/actions/sale";

export interface RecipeSizeOption {
  id: string;
  label: string;
  unitPrice: number;
}

interface Labels {
  items: string;
  addItem: string;
  pickSize: string;
  qty: string;
  totalAmount: string;
  note: string;
  save: string;
  cancel: string;
  recorded: string;
  remove: string;
}

interface Props {
  sizes: RecipeSizeOption[];
  labels: Labels;
}

export function SaleForm({ sizes, labels }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SaleInput>({
    resolver: zodResolver(saleSchema) as unknown as Resolver<SaleInput>,
    defaultValues: {
      items: [{ recipeSizeId: sizes[0]?.id ?? "", quantity: 1 }],
      notes: "",
    },
  });

  const items = useFieldArray({ control: form.control, name: "items" });
  const watched = useWatch({ control: form.control, name: "items" });

  const total = watched.reduce((sum, it) => {
    const size = sizes.find((s) => s.id === it.recipeSizeId);
    return sum + (size?.unitPrice ?? 0) * (Number(it.quantity) || 0);
  }, 0);

  const onSubmit = (values: SaleInput) => {
    startTransition(async () => {
      const res = await recordSale(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${labels.recorded} ${res.saleNo}`);
      router.push("/sales");
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{labels.items}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() =>
                items.append({ recipeSizeId: sizes[0]?.id ?? "", quantity: 1 })
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
                                {s.label} (฿{s.unitPrice.toFixed(0)})
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
                  name={`items.${idx}.quantity`}
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
            <div className="flex justify-end pt-2 text-sm font-semibold">
              {labels.totalAmount}: ฿{total.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.note}</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/sales")}>
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
