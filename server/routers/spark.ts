import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { createSparkMission, listSparkMissions, logFlightEvent } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ── Nova Spark AI Scoring Schema ─────────────────────────────────────────────
// The LLM must return this exact JSON shape.
const SPARK_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    sparkScore: {
      type: "integer",
      description: "Overall Nova Spark score from 0 to 100. Higher means stronger mission viability.",
    },
    scoreLabel: {
      type: "string",
      description:
        "One of: 'Ready for Launch', 'Strong Signal', 'Promising', 'Needs Work', 'Back to the Drawing Board'",
    },
    marketClarity: {
      type: "integer",
      description: "Score 0–100 for how clearly the market is defined.",
    },
    problemFit: {
      type: "integer",
      description: "Score 0–100 for how well the product solves the stated problem.",
    },
    audienceDefinition: {
      type: "integer",
      description: "Score 0–100 for how specifically the target audience is defined.",
    },
    summary: {
      type: "string",
      description:
        "2–3 sentence plain-English summary of the idea's strengths and biggest risk. Written as Aria speaking directly to the founder.",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "2–3 key strengths of this idea (short bullet phrases).",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "2–3 key risks or gaps (short bullet phrases).",
    },
    nextStep: {
      type: "string",
      description:
        "The single most important next action the founder should take. One sentence, action-oriented.",
    },
    missionBadge: {
      type: "string",
      description:
        "A short mission badge label (2–4 words) that captures the essence of this product idea. E.g. 'SaaS Tool', 'Marketplace', 'Mobile App', 'AI Platform', 'E-commerce'.",
    },
    clearanceStatus: {
      type: "string",
      description:
        "One of: 'all-good' (score >= 70), 'needs-attention' (score 40–69), 'action-required' (score < 40)",
    },
  },
  required: [
    "sparkScore",
    "scoreLabel",
    "marketClarity",
    "problemFit",
    "audienceDefinition",
    "summary",
    "strengths",
    "risks",
    "nextStep",
    "missionBadge",
    "clearanceStatus",
  ],
  additionalProperties: false,
};

export const sparkRouter = router({
  // Run Nova Spark AI analysis on an idea
  analyze: protectedProcedure
    .input(
      z.object({
        ideaName: z.string().min(1).max(255),
        ideaDescription: z.string().min(10).max(2000),
        targetAudience: z.string().max(500).optional(),
        problemSolved: z.string().max(500).optional(),
        productId: z.number().optional(), // link to existing fleet product if provided
      })
    )
    .mutation(async ({ ctx, input }) => {
      const systemPrompt = `You are Aria, the AI co-pilot inside MyNovaPilot — a mission-control platform for founders.
Your role is to analyse startup and product ideas and return a structured Nova Spark score.
Be honest, direct, and constructive. Speak to the founder as a trusted advisor.
You must return ONLY valid JSON matching the provided schema — no markdown, no explanation outside the JSON.`;

      const userPrompt = `Analyse this startup idea and return a Nova Spark score:

MISSION NAME: ${input.ideaName}
IDEA: ${input.ideaDescription}
${input.targetAudience ? `TARGET AUDIENCE: ${input.targetAudience}` : ""}
${input.problemSolved ? `PROBLEM SOLVED: ${input.problemSolved}` : ""}

Return the Nova Spark analysis JSON.`;

      let analysisResult: Record<string, unknown>;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "nova_spark_analysis",
              strict: true,
              schema: SPARK_RESPONSE_SCHEMA,
            },
          },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty LLM response");

        analysisResult = typeof content === "string" ? JSON.parse(content) : content;
      } catch (err) {
        console.error("[Nova Spark] LLM error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nova Spark analysis failed. Please try again.",
        });
      }

      // Persist the spark mission
      const { id } = await createSparkMission({
        productId: input.productId ?? null,
        userId: ctx.user.id,
        ideaName: input.ideaName,
        ideaDescription: input.ideaDescription,
        targetAudience: input.targetAudience ?? null,
        problemSolved: input.problemSolved ?? null,
        sparkScore: Number(analysisResult.sparkScore) || 0,
        scoreLabel: String(analysisResult.scoreLabel || "Pending"),
        marketClarity: Number(analysisResult.marketClarity) || 0,
        problemFit: Number(analysisResult.problemFit) || 0,
        audienceDefinition: Number(analysisResult.audienceDefinition) || 0,
        analysisPayload: analysisResult,
        tier: "free",
      });

      // If linked to a product, update its score and badge
      if (input.productId) {
        const { updateFleetProduct } = await import("../db");
        await updateFleetProduct(input.productId, ctx.user.id, {
          statusBoardScore: Number(analysisResult.sparkScore) || 0,
          missionBadge: String(analysisResult.missionBadge || "Nova Spark"),
          clearanceStatus: (analysisResult.clearanceStatus as any) || "needs-attention",
          plainStatus: String(analysisResult.summary || "").slice(0, 255),
          launchStage: "market-research",
        });

        await logFlightEvent(
          input.productId,
          ctx.user.id,
          "nova_spark_complete",
          `Nova Spark analysis complete. Score: ${analysisResult.sparkScore}/100 — ${analysisResult.scoreLabel}`,
          "aria",
          { sparkMissionId: id }
        );
      }

      return {
        sparkMissionId: id,
        sparkScore: Number(analysisResult.sparkScore),
        scoreLabel: String(analysisResult.scoreLabel),
        marketClarity: Number(analysisResult.marketClarity),
        problemFit: Number(analysisResult.problemFit),
        audienceDefinition: Number(analysisResult.audienceDefinition),
        summary: String(analysisResult.summary),
        strengths: analysisResult.strengths as string[],
        risks: analysisResult.risks as string[],
        nextStep: String(analysisResult.nextStep),
        missionBadge: String(analysisResult.missionBadge),
        clearanceStatus: String(analysisResult.clearanceStatus) as
          | "all-good"
          | "needs-attention"
          | "action-required",
      };
    }),

  // List past spark missions for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return listSparkMissions(ctx.user.id);
  }),
});
