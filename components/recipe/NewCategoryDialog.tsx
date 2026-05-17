"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createCategory } from "@/lib/actions/category";

interface Props {
  triggerLabel: string;
  dialogTitle: string;
  nameLabel: string;
  saveLabel: string;
  cancelLabel: string;
  successLabel: string;
  onCreated: (category: { id: string; name: string }) => void;
}

export function NewCategoryDialog({
  triggerLabel,
  dialogTitle,
  nameLabel,
  saveLabel,
  cancelLabel,
  successLabel,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const res = await createCategory({ name: name.trim() });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(successLabel);
      onCreated({ id: res.id, name: res.name });
      setName("");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="new-category-name">{nameLabel}</Label>
          <Input
            id="new-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || !name.trim()}>
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
