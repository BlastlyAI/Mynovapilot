import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Shared mock user ──────────────────────────────────────────────────────────
function makeCtx(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  const user: NonNullable<TrpcContext["user"]> = {
    id: 42,
    openId: "test-open-id",
    email: "founder@example.com",
    name: "Test Founder",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ── Mock DB helpers ───────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    listFleetProducts: vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 42,
        missionName: "TradeFlow Pro",
        domain: "tradeflowpro.com",
        description: "Invoice automation for tradies",
        missionBadge: "SaaS Tool",
        statusBoardScore: 78,
        plainStatus: "Systems nominal.",
        clearanceStatus: "all-good",
        launchStage: "market-research",
        monthlyRevenueCents: 50000,
        monthlyCostCents: 10000,
        isArchived: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    createFleetProduct: vi.fn().mockResolvedValue({ id: 99 }),
    getFleetProduct: vi.fn().mockResolvedValue({
      id: 1,
      userId: 42,
      missionName: "TradeFlow Pro",
      domain: "tradeflowpro.com",
      description: "Invoice automation for tradies",
      missionBadge: "SaaS Tool",
      statusBoardScore: 78,
      plainStatus: "Systems nominal.",
      clearanceStatus: "all-good",
      launchStage: "market-research",
      monthlyRevenueCents: 50000,
      monthlyCostCents: 10000,
      isArchived: false,
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    updateFleetProduct: vi.fn().mockResolvedValue(undefined),
    archiveFleetProduct: vi.fn().mockResolvedValue(undefined),
    logFlightEvent: vi.fn().mockResolvedValue(undefined),
    createSparkMission: vi.fn().mockResolvedValue({ id: 7 }),
    listSparkMissions: vi.fn().mockResolvedValue([]),
    listLaunchSequences: vi.fn().mockResolvedValue([]),
    upsertLaunchSequenceStage: vi.fn().mockResolvedValue(undefined),
    advanceLaunchStage: vi.fn().mockResolvedValue(undefined),
  };
});

// ── Mock LLM ──────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            sparkScore: 74,
            scoreLabel: "Promising",
            marketClarity: 70,
            problemFit: 72,
            audienceDefinition: 65,
            summary:
              "TradeFlow Pro targets a real pain point. The market is established but competitive.",
            strengths: ["Clear target audience", "Recurring revenue potential"],
            risks: ["High competition from Xero/MYOB", "Requires trust to handle payments"],
            nextStep: "Validate pricing with 5 real tradies before building.",
            missionBadge: "SaaS Tool",
            clearanceStatus: "needs-attention",
          }),
        },
      },
    ],
  }),
}));

// ── fleet.list ────────────────────────────────────────────────────────────────
describe("fleet.list", () => {
  it("returns the user's fleet products", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.fleet.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({ missionName: "TradeFlow Pro" });
  });
});

// ── fleet.create ──────────────────────────────────────────────────────────────
describe("fleet.create", () => {
  it("creates a new fleet product and returns its id", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.fleet.create({
      missionName: "NestNest",
      domain: "nestnest.io",
      description: "Property management for landlords",
    });

    expect(result).toMatchObject({ id: 99 });
  });

  it("rejects if missionName is empty", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.fleet.create({ missionName: "" })
    ).rejects.toThrow();
  });
});

// ── fleet.archive ─────────────────────────────────────────────────────────────
describe("fleet.archive", () => {
  it("archives a product owned by the user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.fleet.archive({ id: 1 });
    expect(result).toMatchObject({ success: true });
  });
});

// ── spark.analyze ─────────────────────────────────────────────────────────────
describe("spark.analyze", () => {
  it("returns a Nova Spark score from the LLM", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.spark.analyze({
      ideaName: "TradeFlow Pro",
      ideaDescription: "Invoice automation app for tradies who work on-site.",
      targetAudience: "Australian tradies",
      problemSolved: "Chasing unpaid invoices",
    });

    expect(result.sparkScore).toBe(74);
    expect(result.scoreLabel).toBe("Promising");
    expect(result.clearanceStatus).toBe("needs-attention");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(typeof result.nextStep).toBe("string");
  });

  it("rejects if ideaDescription is too short", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.spark.analyze({
        ideaName: "Test",
        ideaDescription: "short",
      })
    ).rejects.toThrow();
  });
});

// ── launchSequence.list ───────────────────────────────────────────────────────
describe("launchSequence.list", () => {
  it("returns all 9 stages with defaults for a product (Language v2)", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.launchSequence.list({ productId: 1 });

    expect(result).toHaveLength(9);
    expect(result[0].stage).toBe("product-brief");
    expect(result[8].stage).toBe("final-approval");
    // All default to pending when no DB records exist
    expect(result.every((s) => s.status === "pending")).toBe(true);
  });
});
