"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter as useIntlRouter } from "@/i18n/navigation";
import { deletePurchasePlan } from "@/lib/actions/purchase-plan";

interface Props {
  planId: string;
  canEdit: boolean;
  labels: {
    edit: string;
    delete: string;
    deleteConfirm: string;
    cancel: string;
    confirm: string;
    deleted: string;
  };
}

export function PurchasePlanActions({ planId, canEdit, labels }: Props) {
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deletePurchasePlan(planId);
      toast.success(labels.deleted);
      setOpen(false);
      intlRouter.push("/purchase-plans");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => intlRouter.push(`/purchase-plans/${planId}/edit`)}
        >
          <Pencil className="h-4 w-4" /> {labels.edit}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" /> {labels.delete}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.deleteConfirm}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {labels.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
