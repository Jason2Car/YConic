import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/server/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  secret: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email || !prisma) return true;
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: profile?.name, image: user.image },
        create: {
          email: user.email,
          name: profile?.name ?? user.name,
          image: user.image,
        },
      });
      return true;
    },
    async jwt({ token }) {
      if (token.email && prisma) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });
        if (dbUser) token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
