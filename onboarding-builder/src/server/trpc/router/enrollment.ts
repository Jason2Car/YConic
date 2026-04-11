import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

const JoineeProfileSchema = z.object({
  identity: z.object({ name: z.string(), email: z.string().email(), jobTitle: z.string() }),
  roleContext: z.object({ team: z.string(), responsibilities: z.string() }),
  priorExperience: z.object({ yearsRelevant: z.number(), previousRoles: z.array(z.string()), domains: z.array(z.string()) }),
  skillAssessment: z.array(z.object({ sourceModuleId: z.string(), moduleTitle: z.string(), knowledgeLevel: z.enum(["none", "partial", "proficient"]) })),
  learningPreferences: z.object({
    preferredLanguage: z.enum(["python", "javascript", "typescript"]).nullable(),
    explanationStyle: z.enum(["conceptual_first", "example_first"]),
    accessibilityNeeds: z.string().default(""),
  }),
});

const ModuleSpecPatchSchema = z.object({
  adaptationType: z.enum(["STANDARD", "FAST_TRACK", "SUPPLEMENTAL", "ADVANCED"]).optional(),
  contentDepth: z.enum(["FOUNDATIONAL", "STANDARD", "ADVANCED"]).optional(),
});

export const enrollmentRouter = router({
  create: protectedProcedure
    .input(z.object({ projectId: z.string(), joineeName: z.string(), joineeEmail: z.string().email(), joineeJobTitle: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({ where: { id: input.projectId, published: true } });
      if (!project) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Project must be published before enrolling employees." });

      const joinee = await ctx.prisma.joinee.upsert({
        where: { email: input.joineeEmail },
        update: { name: input.joineeName, jobTitle: input.joineeJobTitle },
        create: { email: input.joineeEmail, name: input.joineeName, jobTitle: input.joineeJobTitle },
      });

      return ctx.prisma.joineeEnrollment.create({
        data: { joineeId: joinee.id, sourceProjectId: input.projectId, recruiterId: ctx.userId, stage: "ENROLL" },
      });
    }),

  list: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.joineeEnrollment.findMany({
        where: { recruiterId: ctx.userId, ...(input.projectId ? { sourceProjectId: input.projectId } : {}) },
        include: { joinee: true, sourceProject: { select: { id: true, title: true } }, personalizedProject: { select: { id: true } } },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.joineeEnrollment.findFirst({
        where: { id: input.id, recruiterId: ctx.userId },
        include: {
          joinee: true,
          sourceProject: { include: { modules: { orderBy: { position: "asc" } } } },
          personalizedProject: { include: { modules: { orderBy: { position: "asc" } } } },
        },
      });
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      return enrollment;
    }),

  submitProfile: protectedProcedure
    .input(z.object({ id: z.string(), profile: JoineeProfileSchema }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.joineeEnrollment.findFirst({ where: { id: input.id, recruiterId: ctx.userId } });
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.joineeEnrollment.update({
        where: { id: input.id },
        data: { profile: input.profile as unknown as import("@prisma/client").Prisma.InputJsonValue, stage: "PERSONALIZE" },
      });
    }),

  updateSpec: protectedProcedure
    .input(z.object({ enrollmentId: z.string(), specIndex: z.number(), patch: ModuleSpecPatchSchema }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.joineeEnrollment.findFirst({ where: { id: input.enrollmentId, recruiterId: ctx.userId } });
      if (!enrollment || !enrollment.personalizationPlan) throw new TRPCError({ code: "NOT_FOUND" });
      const plan = enrollment.personalizationPlan as { summary: string; specs: Array<Record<string, unknown>> };
      if (input.specIndex < 0 || input.specIndex >= plan.specs.length) throw new TRPCError({ code: "BAD_REQUEST" });
      Object.assign(plan.specs[input.specIndex], input.patch);
      return ctx.prisma.joineeEnrollment.update({
        where: { id: input.enrollmentId },
        data: { personalizationPlan: plan as unknown as import("@prisma/client").Prisma.InputJsonValue },
      });
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.joineeEnrollment.findFirst({
        where: { id: input.id, recruiterId: ctx.userId },
        include: { sourceProject: { include: { modules: true } }, joinee: true },
      });
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      if (!enrollment.personalizationPlan) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No personalization plan to approve" });

      const plan = enrollment.personalizationPlan as { specs: Array<{ sourceModuleId: string | null; title: string; position: number; adaptationType: string; contentDepth: string; content: unknown; rationale: string; type?: string }> };

      // Validate coverage: every source module must appear
      const sourceIds = new Set(enrollment.sourceProject.modules.map((m) => m.id));
      const coveredIds = new Set(plan.specs.filter((s) => s.sourceModuleId).map((s) => s.sourceModuleId!));
      const missing = [...sourceIds].filter((id) => !coveredIds.has(id));
      if (missing.length > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Plan missing coverage for modules: ${missing.join(", ")}` });

      const joineeSlug = nanoid(12);
      const personalizedProject = await ctx.prisma.personalizedProject.create({
        data: {
          enrollmentId: enrollment.id,
          title: `${enrollment.sourceProject.title} — ${enrollment.joinee.name}`,
          modules: {
            create: plan.specs.map((spec, i) => {
              const sourceModule = spec.sourceModuleId ? enrollment.sourceProject.modules.find((m) => m.id === spec.sourceModuleId) : null;
              return {
                sourceModuleId: spec.sourceModuleId,
                type: spec.type as "RICH_TEXT" | "INTERACTIVE_VISUAL" | "CODE_EDITOR" ?? sourceModule?.type ?? "RICH_TEXT",
                title: spec.title,
                position: i,
                adaptationType: spec.adaptationType as "STANDARD" | "FAST_TRACK" | "SUPPLEMENTAL" | "ADVANCED",
                contentDepth: spec.contentDepth as "FOUNDATIONAL" | "STANDARD" | "ADVANCED",
                content: spec.content as object ?? {},
                rationale: spec.rationale ?? "",
              };
            }),
          },
        },
      });

      await ctx.prisma.joineeEnrollment.update({
        where: { id: enrollment.id },
        data: { joineeSlug, stage: "DELIVERED" },
      });

      return { joineeSlug, learnUrl: `/learn/${joineeSlug}`, personalizedProjectId: personalizedProject.id };
    }),

  regenerate: protectedProcedure
    .input(z.object({ id: z.string(), note: z.string().default("") }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.joineeEnrollment.findFirst({ where: { id: input.id, recruiterId: ctx.userId } });
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      // Clear existing plan so the UI triggers a new AI call
      return ctx.prisma.joineeEnrollment.update({
        where: { id: input.id },
        data: { personalizationPlan: null as unknown as import("@prisma/client").Prisma.InputJsonValue, stage: "PERSONALIZE" },
      });
    }),

  // Public: joinee view (no auth required)
  getBySlug: publicProcedure
    .input(z.object({ joineeSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.prisma) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not configured" });
      const enrollment = await ctx.prisma.joineeEnrollment.findUnique({
        where: { joineeSlug: input.joineeSlug },
        include: {
          personalizedProject: { include: { modules: { orderBy: { position: "asc" } } } },
          sourceProject: { select: { title: true } },
          joinee: { select: { name: true } },
        },
      });
      if (!enrollment?.personalizedProject) throw new TRPCError({ code: "NOT_FOUND" });
      return enrollment;
    }),
});
