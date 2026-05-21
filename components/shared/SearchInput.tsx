"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

interface Props {
  placeholder: string;
  /** URL search param to sync with. Defaults to "q". */
  paramName?: string;
}

/**
 * Pass `key={currentUrlValue}` from the parent so the component remounts and
 * re-initialises if the URL param changes externally (back/forward, deep link).
 */
export function SearchInput({ placeholder, paramName = "q" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get(paramName) ?? "");

  // Debounce local typing -> URL.
  useEffect(() => {
    const currentInUrl = searchParams.get(paramName) ?? "";
    if (value === currentInUrl) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set(paramName, trimmed);
      else params.delete(paramName);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [value, paramName, pathname, router, searchParams]);

  return (
    <div className="relative w-full sm:w-[260px]">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-8 pr-8"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="clear"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
