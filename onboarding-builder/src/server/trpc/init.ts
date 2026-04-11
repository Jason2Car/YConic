import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import type { PrismaClient } from "@prisma/client";

export const createTRPCContext = async () => {
  const session = await auth();
  return { session, prisma: prisma as PrismaClient };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.prisma) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not configured" });
  }
  return next({ ctx: { ...ctx, userId: ctx.session.user.id } });
});
