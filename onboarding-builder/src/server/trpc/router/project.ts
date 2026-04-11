import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const projectRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(200), description: z.string().max(2000).default("") }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.create({
        data: { title: input.title, description: input.description, ownerId: ctx.userId, stage: "INTRO" },
      });
      return project;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.project.findMany({
      where: { ownerId: ctx.userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, description: true, stage: true, published: true, slug: true, updatedAt: true, createdAt: true },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.id, ownerId: ctx.userId },
        include: { modules: { orderBy: { position: "asc" } } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string().min(1).max(200).optional(), description: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const project = await ctx.prisma.project.updateMany({ where: { id, ownerId: ctx.userId }, data });
      if (project.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.project.findUnique({ where: { id } });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.project.deleteMany({ where: { id: input.id, ownerId: ctx.userId } });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({ where: { id: input.id, ownerId: ctx.userId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (project.stage !== "EDIT") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Project must be in EDIT stage to publish" });
      const slug = project.slug ?? nanoid(10);
      await ctx.prisma.project.update({ where: { id: input.id }, data: { published: true, slug } });
      return { slug, url: `/p/${slug}` };
    }),

  getPublished: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { slug: input.slug, published: true },
        include: { modules: { orderBy: { position: "asc" } } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),
});
