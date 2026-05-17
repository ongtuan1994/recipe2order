"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { discardBatch } from "@/lib/actions/stock";

interface Labels {
  discard: string;
  discardConfirm: string;
  discardReason: string;
  cancel: string;
  confirm: string;
  discarded: string;
}

export function DiscardBatchButton({
  batchId,
  labels,
}: {
  batchId: string;
  labels: Labels;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      const res = await discardBatch(batchId, { reason: reason.trim() });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.discarded);
      setOpen(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.discard}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.discardConfirm}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="discard-reason">{labels.discardReason}</Label>
          <Input
            id="discard-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {labels.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={isPending || !reason.trim()}
          >
            {labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
