"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { variantSchema, type VariantInput } from "@/lib/validations/ingredient";
import {
  addVariant,
  deleteVariant,
  setDefaultVariant,
} from "@/lib/actions/ingredient";

interface Variant {
  id: string;
  brand: string;
  packageSize: number;
  packageUnit: string;
  price: number;
  pricePerBaseUnit: number;
  supplier: string | null;
}

interface Labels {
  variants: string;
  addVariant: string;
  brand: string;
  packageSize: string;
  packageUnit: string;
  price: string;
  pricePerBase: string;
  supplier: string;
  default: string;
  setDefault: string;
  cheapest: string;
  emptyVariants: string;
  remove: string;
  save: string;
  variantAdded: string;
}

interface Props {
  ingredientId: string;
  variants: Variant[];
  defaultVariantId: string | null;
  baseUnit: string;
  labels: Labels;
}

export function VariantsPanel({
  ingredientId,
  variants,
  defaultVariantId,
  baseUnit,
  labels,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<VariantInput>({
    resolver: zodResolver(variantSchema) as unknown as Resolver<VariantInput>,
    defaultValues: {
      brand: "",
      packageSize: 0,
      packageUnit: baseUnit,
      price: 0,
      supplier: "",
      note: "",
    },
  });

  const cheapest =
    variants.length > 0
      ? variants.reduce((min, v) => (v.pricePerBaseUnit < min.pricePerBaseUnit ? v : min))
      : null;

  const onSubmit = (values: VariantInput) => {
    startTransition(async () => {
      const res = await addVariant(ingredientId, values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.variantAdded);
      form.reset({
        brand: "",
        packageSize: 0,
        packageUnit: baseUnit,
        price: 0,
        supplier: "",
        note: "",
      });
      setShowForm(false);
      router.refresh();
    });
  };

  const handleSetDefault = (variantId: string) => {
    startTransition(async () => {
      await setDefaultVariant(ingredientId, variantId);
      router.refresh();
    });
  };

  const handleDelete = (variantId: string) => {
    startTransition(async () => {
      await deleteVariant(variantId, ingredientId);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{labels.variants}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm((s) => !s)}
        >
          {labels.addVariant}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.emptyVariants}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.brand}</TableHead>
                <TableHead>{labels.packageSize}</TableHead>
                <TableHead>{labels.price}</TableHead>
                <TableHead>{labels.pricePerBase}</TableHead>
                <TableHead>{labels.supplier}</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => {
                const isDefault = v.id === defaultVariantId;
                const isCheapest = cheapest?.id === v.id;
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {v.brand}
                        {isDefault && <Badge variant="secondary">{labels.default}</Badge>}
                        {isCheapest && (
                          <Badge variant="outline" className="border-green-600 text-green-700">
                            {labels.cheapest}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.packageSize} {v.packageUnit}
                    </TableCell>
                    <TableCell>฿{v.price.toFixed(2)}</TableCell>
                    <TableCell>
                      ฿{v.pricePerBaseUnit.toFixed(3)} / {baseUnit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.supplier ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {!isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={labels.setDefault}
                          onClick={() => handleSetDefault(v.id)}
                          disabled={isPending}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={labels.remove}
                        onClick={() => handleDelete(v.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {showForm && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-3 md:grid-cols-3 border-t pt-4"
            >
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.brand}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.packageSize}</FormLabel>
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
                name="packageUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.packageUnit}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labels.price}</FormLabel>
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
                name="supplier"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{labels.supplier}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isPending}
                className="md:col-span-3 justify-self-end"
              >
                {labels.save}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
