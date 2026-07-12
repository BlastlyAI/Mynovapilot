import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  archiveFleetProduct,
  createFleetProduct,
  getFleetProduct,
  listFleetProducts,
  logFlightEvent,
  updateFleetProduct,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const fleetRouter = router({
  // List all active fleet products for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return listFleetProducts(ctx.user.id);
  }),

  // Get a single fleet product (ownership-checked)
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const product = await getFleetProduct(input.id, ctx.user.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });
      return product;
    }),

  // Create a new fleet product (Brief New Mission)
  create: protectedProcedure
    .input(
      z.object({
        missionName: z.string().min(1).max(255),
        domain: z.string().max(255).optional(),
        description: z.string().optional(),
        missionBadge: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = await createFleetProduct({
        userId: ctx.user.id,
        missionName: input.missionName,
        domain: input.domain ?? null,
        description: input.description ?? null,
        missionBadge: input.missionBadge ?? "Nova Spark",
        statusBoardScore: 0,
        plainStatus: "Mission briefed. Ready for Nova Spark analysis.",
        clearanceStatus: "needs-attention",
        launchStage: "product-brief",
        monthlyRevenueCents: 0,
        monthlyCostCents: 0,
        isArchived: false,
        lastActivityAt: new Date(),
      });

      await logFlightEvent(
        id,
        ctx.user.id,
        "mission_created",
        `Mission "${input.missionName}" briefed and added to fleet.`,
        "user"
      );

      return { id };
    }),

  // Update mission fields (status, score, plain status, clearance, stage)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        missionName: z.string().min(1).max(255).optional(),
        domain: z.string().max(255).optional(),
        description: z.string().optional(),
        missionBadge: z.string().max(64).optional(),
        statusBoardScore: z.number().min(0).max(100).optional(),
        plainStatus: z.string().max(255).optional(),
        clearanceStatus: z.enum(["all-good", "needs-attention", "action-required", "approved", "locked", "high-risk"]).optional(),
        launchStage: z
          .enum([
            "product-brief",
            "market-research",
            "your-plan",
            "building",
            "review-changes",
            "test-environment",
            "automated-testing",
            "your-preview",
            "final-approval",
            "live",
          ])
          .optional(),
        monthlyRevenueCents: z.number().min(0).optional(),
        monthlyCostCents: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const product = await getFleetProduct(id, ctx.user.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });

      await updateFleetProduct(id, ctx.user.id, data);
      await logFlightEvent(id, ctx.user.id, "mission_updated", "Mission details updated.", "user");

      return { success: true };
    }),

  // Archive (soft-delete) a mission
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const product = await getFleetProduct(input.id, ctx.user.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });

      await archiveFleetProduct(input.id, ctx.user.id);
      await logFlightEvent(
        input.id,
        ctx.user.id,
        "mission_archived",
        `Mission "${product.missionName}" archived.`,
        "user"
      );

      return { success: true };
    }),
});
