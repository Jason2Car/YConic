import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";

const ModuleTypeEnum = z.enum(["RICH_TEXT", "INTERACTIVE_VISUAL", "CODE_EDITOR"]);

export const moduleRouter = router({
  add: protectedProcedure
    .input(z.object({ projectId: z.string(), type: ModuleTypeEnum, title: z.string().default("Untitled Module"), position: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({ where: { id: input.projectId, ownerId: ctx.userId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      // Shift existing modules at or after this position
      await ctx.prisma.module.updateMany({
        where: { projectId: input.projectId, position: { gte: input.position } },
        data: { position: { increment: 1 } },
      });
      return ctx.prisma.module.create({
        data: { projectId: input.projectId, type: input.type, title: input.title, position: input.position },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string().optional(), content: z.any().optional() }))
    .mutation(async ({ ctx, input }) => {
      const mod = await ctx.prisma.module.findUnique({ where: { id: input.id }, include: { project: { select: { ownerId: true } } } });
      if (!mod || mod.project.ownerId !== ctx.userId) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      return ctx.prisma.module.update({ where: { id }, data });
    }),

  reorder: protectedProcedure
    .input(z.object({ projectId: z.string(), orderedIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({ where: { id: input.projectId, ownerId: ctx.userId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.$transaction(
        input.orderedIds.map((id, i) => ctx.prisma.module.update({ where: { id }, data: { position: i } }))
      );
      return ctx.prisma.module.findMany({ where: { projectId: input.projectId }, orderBy: { position: "asc" } });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const mod = await ctx.prisma.module.findUnique({ where: { id: input.id }, include: { project: { select: { ownerId: true } } } });
      if (!mod || mod.project.ownerId !== ctx.userId) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.module.delete({ where: { id: input.id } });
      // Re-index positions
      const remaining = await ctx.prisma.module.findMany({ where: { projectId: mod.projectId }, orderBy: { position: "asc" } });
      await ctx.prisma.$transaction(
        remaining.map((m, i) => ctx.prisma.module.update({ where: { id: m.id }, data: { position: i } }))
      );
      return { success: true };
    }),
});
