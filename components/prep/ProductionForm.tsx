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
  productionSchema,
  type ProductionInput,
} from "@/lib/validations/prep-recipe";
import { recordProduction } from "@/lib/actions/prep-recipe";

interface Labels {
  producedQty: string;
  note: string;
  produce: string;
  produced: string;
  unit: string;
}

interface Props {
  prepRecipeId: string;
  defaultQty: number;
  outputUnit: string;
  labels: Labels;
}

export function ProductionForm({
  prepRecipeId,
  defaultQty,
  outputUnit,
  labels,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProductionInput>({
    resolver: zodResolver(productionSchema) as unknown as Resolver<ProductionInput>,
    defaultValues: { producedQty: defaultQty, note: "" },
  });

  const onSubmit = (values: ProductionInput) => {
    startTransition(async () => {
      const res = await recordProduction(prepRecipeId, values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.produced);
      router.push(`/stock`);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex gap-2 items-end">
          <FormField
            control={form.control}
            name="producedQty"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>
                  {labels.producedQty} ({outputUnit})
                </FormLabel>
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
          <Button type="submit" disabled={isPending}>
            {labels.produce}
          </Button>
        </div>
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.note}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
