import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Dedupe `auth()` per request — multiple callers in layout + page + actions
// would otherwise re-decode the JWT and re-hit the DB on every navigation.
const getSession = cache(async () => auth());

export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    // Server actions / pages called without a session: bounce to login.
    // (`redirect` throws internally so this returns `never`.)
    redirect("/login");
  }
  return userId;
}

export async function getOptionalUser() {
  const session = await getSession();
  return session?.user ?? null;
}
