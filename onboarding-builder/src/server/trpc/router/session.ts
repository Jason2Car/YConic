import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";

export const sessionRouter = router({
  create: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({ where: { id: input.projectId, ownerId: ctx.userId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.session.create({
        data: { projectId: input.projectId, userId: ctx.userId },
      });
    }),

  applyChange: protectedProcedure
    .input(z.object({ sessionId: z.string(), change: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.session.findFirst({
        where: { id: input.sessionId, userId: ctx.userId },
        include: { project: { include: { modules: { orderBy: { position: "asc" } } } } },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      // Save snapshot to history before applying change
      const snapshot = {
        id: session.project.id,
        title: session.project.title,
        description: session.project.description,
        modules: session.project.modules.map((m) => ({
          id: m.id, type: m.type, title: m.title, position: m.position, content: m.content,
        })),
      };
      const history = (session.history as unknown[]) ?? [];
      history.push({
        timestamp: new Date().toISOString(),
        changeDescription: input.change.description ?? "Change applied",
        snapshotBefore: snapshot,
      });
      await ctx.prisma.session.update({ where: { id: input.sessionId }, data: { history: history as unknown as import("@prisma/client").Prisma.InputJsonValue } });

      // Apply the change based on type
      const change = input.change;
      if (change.type === "add_module") {
        const count = await ctx.prisma.module.count({ where: { projectId: session.projectId } });
        await ctx.prisma.module.create({
          data: {
            projectId: session.projectId,
            type: change.payload.type,
            title: change.payload.title,
            position: change.payload.position ?? count,
            content: change.payload.content ?? null,
          },
        });
      } else if (change.type === "update_module") {
        await ctx.prisma.module.update({
          where: { id: change.payload.moduleId },
          data: { title: change.payload.title, content: change.payload.content },
        });
      } else if (change.type === "delete_module") {
        await ctx.prisma.module.delete({ where: { id: change.payload.moduleId } });
      }

      return ctx.prisma.project.findUnique({
        where: { id: session.projectId },
        include: { modules: { orderBy: { position: "asc" } } },
      });
    }),

  undo: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.session.findFirst({
        where: { id: input.sessionId, userId: ctx.userId },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const history = (session.history as Array<{ snapshotBefore: { title: string; description: string; modules: Array<{ id: string; type: string; title: string; position: number; content: unknown }> } }>) ?? [];
      if (history.length === 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Nothing to undo" });

      const lastEntry = history.pop()!;
      const snapshot = lastEntry.snapshotBefore;

      // Delete all current modules and recreate from snapshot
      await ctx.prisma.module.deleteMany({ where: { projectId: session.projectId } });
      if (snapshot.modules.length > 0) {
        await ctx.prisma.module.createMany({
          data: snapshot.modules.map((m) => ({
            id: m.id, projectId: session.projectId, type: m.type as "RICH_TEXT" | "INTERACTIVE_VISUAL" | "CODE_EDITOR",
            title: m.title, position: m.position, content: m.content as object ?? undefined,
          })),
        });
      }
      await ctx.prisma.project.update({
        where: { id: session.projectId },
        data: { title: snapshot.title, description: snapshot.description },
      });
      await ctx.prisma.session.update({ where: { id: input.sessionId }, data: { history: history as unknown as import("@prisma/client").Prisma.InputJsonValue } });

      return ctx.prisma.project.findUnique({
        where: { id: session.projectId },
        include: { modules: { orderBy: { position: "asc" } } },
      });
    }),
});
