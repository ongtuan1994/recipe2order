"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter as useIntlRouter } from "@/i18n/navigation";
import { deleteRecipe, duplicateRecipeAction } from "@/lib/actions/recipe";

interface Props {
  recipeId: string;
  locale: string;
  labels: {
    edit: string;
    duplicate: string;
    delete: string;
    deleteConfirm: string;
    cancel: string;
    confirm: string;
    deleted: string;
    duplicated: string;
  };
}

export function RecipeActions({ recipeId, locale, labels }: Props) {
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteRecipe(recipeId);
      toast.success(labels.deleted);
      setOpen(false);
      intlRouter.push("/recipes");
      router.refresh();
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        await duplicateRecipeAction(recipeId, locale);
        toast.success(labels.duplicated);
      } catch (e) {
        if ((e as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => intlRouter.push(`/recipes/${recipeId}/edit`)}
      >
        <Pencil className="h-4 w-4" /> {labels.edit}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleDuplicate}
        disabled={isPending}
      >
        <Copy className="h-4 w-4" /> {labels.duplicate}
      </Button>
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
