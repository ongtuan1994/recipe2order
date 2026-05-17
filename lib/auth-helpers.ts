import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    // Server actions / pages called without a session: bounce to login.
    // (`redirect` throws internally so this returns `never`.)
    redirect("/login");
  }
  return userId;
}

export async function getOptionalUser() {
  const session = await auth();
  return session?.user ?? null;
}
