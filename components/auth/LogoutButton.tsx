"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="justify-start gap-2 px-3"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </Button>
  );
}
