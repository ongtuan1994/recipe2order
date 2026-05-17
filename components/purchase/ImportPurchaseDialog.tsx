"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importPurchasePlan } from "@/lib/actions/purchase-plan";

export interface ImportItem {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  suggestedQty: number;
  suggestedCost: number | null;
}

interface Props {
  planId: string;
  items: ImportItem[];
  labels: {
    trigger: string;
    title: string;
    ingredient: string;
    quantity: string;
    cost: string;
    total: string;
    cancel: string;
    confirm: string;
    imported: string;
    empty: string;
  };
}

interface Row {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  quantity: number;
  totalCost: number;
}

export function ImportPurchaseDialog({ planId, items, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Row[]>(() =>
    items.map((i) => ({
      ingredientId: i.ingredientId,
      ingredientName: i.ingredientName,
      baseUnit: i.baseUnit,
      quantity: Number(i.suggestedQty.toFixed(2)),
      totalCost: i.suggestedCost ?? 0,
    })),
  );

  const total = rows.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await importPurchasePlan(
        planId,
        rows.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity,
          totalCost: r.totalCost,
        })),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${labels.imported} (${res.batchesCreated})`);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Download className="h-4 w-4" /> {labels.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{labels.empty}</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.ingredient}</TableHead>
                  <TableHead className="w-32">{labels.quantity}</TableHead>
                  <TableHead className="w-32">{labels.cost}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={r.ingredientId}>
                    <TableCell className="text-sm">{r.ingredientName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.quantity}
                          onChange={(e) =>
                            updateRow(idx, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {r.baseUnit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground shrink-0">
                          ฿
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.totalCost}
                          onChange={(e) =>
                            updateRow(idx, {
                              totalCost: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 tabular-nums"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-right text-sm font-semibold">
              {labels.total}: ฿{total.toFixed(2)}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {labels.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || rows.length === 0}
          >
            {labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
