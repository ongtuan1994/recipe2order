"use client";

import { useEffect } from "react";

export function AutoPrint() {
  useEffect(() => {
    document.title = "Print Shopping List";
    // Wait one paint frame so fonts/layout settle before the dialog opens
    const id = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}
