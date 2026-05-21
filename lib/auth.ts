import { timingSafeEqual } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  password: z.string().min(1),
});

// Single-tenant shared password gate. Set LOGIN_PASSWORD in env to override.
const SHARED_PASSWORD = process.env.LOGIN_PASSWORD ?? "crocohill";
const LOGIN_USER_EMAIL = process.env.LOGIN_EMAIL ?? "admin@admin.com";

function passwordMatches(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(SHARED_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        if (!passwordMatches(parsed.data.password)) return null;

        const user = await prisma.user.findUnique({
          where: { email: LOGIN_USER_EMAIL },
        });
        if (!user) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.uid = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
});
