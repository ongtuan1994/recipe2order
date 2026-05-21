import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export interface DetailPagerProps {
  prevHref: string | null;
  nextHref: string | null;
  position: number;
  total: number;
  labels: { previous: string; next: string };
}

export function DetailPager({
  prevHref,
  nextHref,
  position,
  total,
  labels,
}: DetailPagerProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      {prevHref ? (
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={prevHref}>
            <ChevronLeft className="h-4 w-4" />
            {labels.previous}
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1" disabled>
          <ChevronLeft className="h-4 w-4" />
          {labels.previous}
        </Button>
      )}

      <span className="text-xs text-muted-foreground tabular-nums">
        {position} / {total}
      </span>

      {nextHref ? (
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={nextHref}>
            {labels.next}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1" disabled>
          {labels.next}
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
