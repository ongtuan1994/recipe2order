"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  purchaseBatchSchema,
  type PurchaseBatchInput,
} from "@/lib/validations/stock";
import { addPurchaseBatch } from "@/lib/actions/stock";

interface Ingredient {
  id: string;
  name: string;
  baseUnit: string;
  type: string;
}

interface Labels {
  trigger: string;
  title: string;
  ingredient: string;
  quantity: string;
  preparedAt: string;
  totalCost: string;
  notes: string;
  save: string;
  cancel: string;
  saved: string;
}

interface Props {
  ingredients: Ingredient[];
  labels: Labels;
}

export function AddBatchDialog({ ingredients, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PurchaseBatchInput>({
    resolver: zodResolver(purchaseBatchSchema) as unknown as Resolver<PurchaseBatchInput>,
    defaultValues: {
      ingredientId: ingredients[0]?.id ?? "",
      quantity: 0,
      preparedAt: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const onSubmit = (values: PurchaseBatchInput) => {
    startTransition(async () => {
      const res = await addPurchaseBatch(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.saved);
      form.reset();
      setOpen(false);
      router.refresh();
    });
  };

  const rawIngredients = ingredients.filter((i) => i.type === "RAW");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> {labels.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ingredientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.ingredient}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rawIngredients.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.baseUnit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.quantity}</FormLabel>
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
                name="preparedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.preparedAt}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.totalCost}</FormLabel>
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labels.notes}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {labels.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {labels.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
