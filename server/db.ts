import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  fleetProducts,
  flightRecorder,
  InsertFleetProduct,
  InsertLaunchSequence,
  InsertSparkMission,
  InsertUser,
  launchSequences,
  sparkMissions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ── Fleet Products ────────────────────────────────────────────────────────────

export async function listFleetProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(fleetProducts)
    .where(and(eq(fleetProducts.userId, userId), eq(fleetProducts.isArchived, false)))
    .orderBy(desc(fleetProducts.lastActivityAt));
}

export async function getFleetProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(fleetProducts)
    .where(and(eq(fleetProducts.id, id), eq(fleetProducts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createFleetProduct(data: InsertFleetProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(fleetProducts).values(data);
  return { id: (result as any).insertId as number };
}

export async function updateFleetProduct(
  id: number,
  userId: number,
  data: Partial<InsertFleetProduct>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(fleetProducts)
    .set({ ...data, updatedAt: new Date(), lastActivityAt: new Date() })
    .where(and(eq(fleetProducts.id, id), eq(fleetProducts.userId, userId)));
}

export async function archiveFleetProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(fleetProducts)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(fleetProducts.id, id), eq(fleetProducts.userId, userId)));
}

// ── Launch Sequences ──────────────────────────────────────────────────────────

export async function listLaunchSequences(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(launchSequences)
    .where(and(eq(launchSequences.productId, productId), eq(launchSequences.userId, userId)));
}

export async function upsertLaunchSequenceStage(data: InsertLaunchSequence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(launchSequences).values(data).onDuplicateKeyUpdate({
    set: {
      status: data.status,
      ariaGuidance: data.ariaGuidance ?? null,
      completedAt: data.completedAt ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function advanceLaunchStage(productId: number, userId: number, stage: InsertLaunchSequence["stage"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Upsert the stage row as complete (creates it if it doesn't exist yet)
  await db
    .insert(launchSequences)
    .values({
      productId,
      userId,
      stage,
      status: "complete",
      completedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        status: "complete",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  // Stage order for advancing the product's launchStage field (Language v2 — 9 stages)
  const stageOrder = [
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
  ] as const;

  const currentIdx = stageOrder.indexOf(stage as (typeof stageOrder)[number]);
  const nextStage = stageOrder[currentIdx + 1];

  if (nextStage) {
    await db
      .update(fleetProducts)
      .set({
        launchStage: nextStage as any,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(fleetProducts.id, productId), eq(fleetProducts.userId, userId)));
  }
}

// ── Spark Missions ────────────────────────────────────────────────────────────

export async function createSparkMission(data: InsertSparkMission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(sparkMissions).values(data);
  return { id: (result as any).insertId as number };
}

export async function listSparkMissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(sparkMissions)
    .where(eq(sparkMissions.userId, userId))
    .orderBy(desc(sparkMissions.createdAt))
    .limit(20);
}

// ── Flight Recorder ───────────────────────────────────────────────────────────

export async function logFlightEvent(
  productId: number,
  userId: number,
  eventType: string,
  logEntry: string,
  triggeredBy: "user" | "aria" | "system" | "webhook" = "user",
  payload?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(flightRecorder).values({
    productId,
    userId,
    eventType,
    logEntry,
    triggeredBy,
    payload: payload ?? null,
  });
}
