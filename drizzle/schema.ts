import {
  bigint,
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ── Core user table ──────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: mysqlEnum("plan", ["free", "pro", "enterprise"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Fleet Products ───────────────────────────────────────────────────────────
// Each row represents one product/startup in the user's fleet.
export const fleetProducts = mysqlTable("fleet_products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  missionName: varchar("missionName", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  description: text("description"),
  // Mission badge label shown on the product card
  missionBadge: varchar("missionBadge", { length: 64 }).default("Nova Spark").notNull(),
  // Overall health score 0–100
  statusBoardScore: int("statusBoardScore").default(0).notNull(),
  // Plain-English status for the card
  plainStatus: varchar("plainStatus", { length: 255 }).default("Preparing for launch").notNull(),
  // Weather / clearance status
  clearanceStatus: mysqlEnum("clearanceStatus", ["all-good", "needs-attention", "action-required", "approved", "locked", "high-risk"])
    .default("needs-attention")
    .notNull(),
  // Current stage in the launch sequence
  launchStage: mysqlEnum("launchStage", [
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
    .default("product-brief")
    .notNull(),
  // Revenue tracking (cents to avoid float issues)
  monthlyRevenueCents: bigint("monthlyRevenueCents", { mode: "number" }).default(0).notNull(),
  monthlyCostCents: bigint("monthlyCostCents", { mode: "number" }).default(0).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FleetProduct = typeof fleetProducts.$inferSelect;
export type InsertFleetProduct = typeof fleetProducts.$inferInsert;

// ── Mission Vault ────────────────────────────────────────────────────────────
// Encrypted secure document storage for founders.
export const missionVault = mysqlTable("mission_vault", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Optional product association
  productId: int("productId"),
  // Entry title (stored in plaintext for listing)
  title: varchar("title", { length: 255 }).notNull(),
  // Entry type
  entryType: mysqlEnum("entryType", [
    "idea",
    "password",
    "api-key",
    "document",
    "note",
    "contract",
  ])
    .default("note")
    .notNull(),
  // Tags for filtering (comma-separated, stored plaintext)
  tags: varchar("tags", { length: 512 }),
  // AES-256-GCM encrypted content (base64 encoded)
  encryptedContent: text("encryptedContent").notNull(),
  // IV for AES-GCM (base64, stored alongside ciphertext)
  iv: varchar("iv", { length: 64 }).notNull(),
  // Whether this entry is currently locked (requires PIN to view)
  isLocked: boolean("isLocked").default(false).notNull(),
  // Whether the entire vault is locked by the user
  vaultLocked: boolean("vaultLocked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MissionVaultEntry = typeof missionVault.$inferSelect;
export type InsertMissionVaultEntry = typeof missionVault.$inferInsert;

// ── Vault PIN ────────────────────────────────────────────────────────────────
// Stores a hashed PIN for vault lock/unlock.
export const vaultPins = mysqlTable("vault_pins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // bcrypt-hashed PIN
  hashedPin: varchar("hashedPin", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VaultPin = typeof vaultPins.$inferSelect;
export type InsertVaultPin = typeof vaultPins.$inferInsert;

// ── Mission Leases ───────────────────────────────────────────────────────────
// Domain registrations, subscriptions, and recurring costs.
export const missionLeases = mysqlTable("mission_leases", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  leaseName: varchar("leaseName", { length: 255 }).notNull(),
  leaseType: mysqlEnum("leaseType", ["domain", "subscription", "license", "hosting", "other"])
    .default("subscription")
    .notNull(),
  provider: varchar("provider", { length: 128 }),
  monthlyCostCents: bigint("monthlyCostCents", { mode: "number" }).default(0).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "annual", "one-off"]).default("monthly").notNull(),
  renewsAt: timestamp("renewsAt"),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  status: mysqlEnum("status", ["active", "expiring-soon", "expired", "cancelled"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MissionLease = typeof missionLeases.$inferSelect;
export type InsertMissionLease = typeof missionLeases.$inferInsert;

// ── Flight Recorder ──────────────────────────────────────────────────────────
// Immutable audit log of every action taken on a product.
export const flightRecorder = mysqlTable("flight_recorder", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  // Short machine-readable event type
  eventType: varchar("eventType", { length: 64 }).notNull(),
  // Human-readable log entry
  logEntry: text("logEntry").notNull(),
  // Optional structured payload (JSON)
  payload: json("payload"),
  // Who or what triggered the event
  triggeredBy: mysqlEnum("triggeredBy", ["user", "aria", "system", "webhook"])
    .default("user")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FlightRecorderEntry = typeof flightRecorder.$inferSelect;
export type InsertFlightRecorderEntry = typeof flightRecorder.$inferInsert;

// ── Launch Sequences ─────────────────────────────────────────────────────────
// Tracks the state of each stage in a product's launch sequence.
export const launchSequences = mysqlTable("launch_sequences", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  stage: mysqlEnum("stage", [
    "product-brief",
    "market-research",
    "your-plan",
    "building",
    "review-changes",
    "test-environment",
    "automated-testing",
    "your-preview",
    "final-approval",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "in-progress", "complete", "blocked"])
    .default("pending")
    .notNull(),
  // Aria-generated notes for this stage
  ariaGuidance: text("ariaGuidance"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LaunchSequence = typeof launchSequences.$inferSelect;
export type InsertLaunchSequence = typeof launchSequences.$inferInsert;

// ── Spark Missions ───────────────────────────────────────────────────────────
// Results from Nova Spark idea analysis runs.
export const sparkMissions = mysqlTable("spark_missions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId"),
  userId: int("userId").notNull(),
  // Raw idea input
  ideaName: varchar("ideaName", { length: 255 }).notNull(),
  ideaDescription: text("ideaDescription"),
  targetAudience: text("targetAudience"),
  problemSolved: text("problemSolved"),
  // Nova Spark output
  sparkScore: int("sparkScore").default(0).notNull(),
  scoreLabel: varchar("scoreLabel", { length: 64 }).default("Pending").notNull(),
  marketClarity: int("marketClarity").default(0).notNull(),
  problemFit: int("problemFit").default(0).notNull(),
  audienceDefinition: int("audienceDefinition").default(0).notNull(),
  // Full AI analysis JSON
  analysisPayload: json("analysisPayload"),
  tier: mysqlEnum("tier", ["free", "pro"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SparkMission = typeof sparkMissions.$inferSelect;
export type InsertSparkMission = typeof sparkMissions.$inferInsert;
