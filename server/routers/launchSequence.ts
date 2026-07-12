import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  advanceLaunchStage,
  getFleetProduct,
  listLaunchSequences,
  logFlightEvent,
  upsertLaunchSequenceStage,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const STAGE_SCHEMA = z.enum([
  "product-brief",
  "market-research",
  "your-plan",
  "building",
  "review-changes",
  "test-environment",
  "automated-testing",
  "your-preview",
  "final-approval",
]);

export const launchSequenceRouter = router({
  // List all stages for a product
  list: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ownership check
      const product = await getFleetProduct(input.productId, ctx.user.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });

      const stages = await listLaunchSequences(input.productId, ctx.user.id);

      // Return stages merged with defaults so the UI always has all 9 stages
      const STAGE_ORDER = [
        "product-brief",
        "market-research",
        "your-plan",
        "building",
        "review-changes",
        "test-environment",
        "automated-testing",
        "your-preview",
        "final-approval",
      ] as const;

      return STAGE_ORDER.map((stage) => {
        const existing = stages.find((s) => s.stage === stage);
        return (
          existing ?? {
            id: null,
            productId: input.productId,
            userId: ctx.user.id,
            stage,
            status: "pending" as const,
            ariaGuidance: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        );
      });
    }),

  // Initialise a stage (set to in-progress)
  startStage: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        stage: STAGE_SCHEMA,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await getFleetProduct(input.productId, ctx.user.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });

      await upsertLaunchSequenceStage({
        productId: input.productId,
        userId: ctx.user.id,
        stage: input.stage,
        status: "in-progress",
      });

      return { success: true };
    }),

  // Mark a stage complete and advance the product's launch stage
  advanceStage: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        stage: STAGE_SCHEMA,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await getFleetProduct(input.productId, ctx.user.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });

      await advanceLaunchStage(input.productId, ctx.user.id, input.stage);

      await logFlightEvent(
        input.productId,
        ctx.user.id,
        "stage_completed",
        `Stage "${input.stage}" marked complete. Moving to next stage.`,
        "user"
      );

      return { success: true };
    }),
});
