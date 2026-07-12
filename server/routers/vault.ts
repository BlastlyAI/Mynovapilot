import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { missionVault, vaultPins } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// ── Encryption helpers (AES-256-GCM) ─────────────────────────────────────────
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits

function deriveKey(secret: string): Buffer {
  // Derive a 256-bit key from the JWT secret using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

function getEncryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return deriveKey(secret);
}

export function encryptContent(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Store: authTag (16 bytes) + ciphertext, all base64
  const combined = Buffer.concat([authTag, encrypted]);
  return {
    encrypted: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptContent(encryptedContent: string, ivBase64: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const combined = Buffer.from(encryptedContent, "base64");
  const authTag = combined.subarray(0, 16);
  const ciphertext = combined.subarray(16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function hashPin(pin: string): string {
  // Simple SHA-256 hash of the PIN (good enough for a 4-6 digit PIN with salt)
  const salt = process.env.JWT_SECRET ?? "nova-vault-salt";
  return crypto.createHash("sha256").update(pin + salt).digest("hex");
}

// ── Entry type enum ───────────────────────────────────────────────────────────
const ENTRY_TYPES = ["idea", "password", "api-key", "document", "note", "contract"] as const;

// ── Vault router ──────────────────────────────────────────────────────────────
export const vaultRouter = router({
  /**
   * List all vault entries for the current user (metadata only, no content).
   */
  list: protectedProcedure
    .input(
      z.object({
        productId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(missionVault.userId, ctx.user.id)];
      if (input?.productId) {
        conditions.push(eq(missionVault.productId, input.productId));
      }

      const entries = await db
        .select({
          id: missionVault.id,
          title: missionVault.title,
          entryType: missionVault.entryType,
          tags: missionVault.tags,
          productId: missionVault.productId,
          isLocked: missionVault.isLocked,
          createdAt: missionVault.createdAt,
          updatedAt: missionVault.updatedAt,
        })
        .from(missionVault)
        .where(and(...conditions))
        .orderBy(missionVault.updatedAt);

      return entries;
    }),

  /**
   * Get a single vault entry with decrypted content.
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(missionVault)
        .where(and(eq(missionVault.id, input.id), eq(missionVault.userId, ctx.user.id)))
        .limit(1);

      const entry = rows[0];
      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Vault entry not found" });

      // Locked entries do not expose content — PIN unlock is required via verifyPin first
      let content: string | null = null;
      if (!entry.isLocked) {
        try {
          content = decryptContent(entry.encryptedContent, entry.iv);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to decrypt vault entry" });
        }
      }

      return {
        id: entry.id,
        title: entry.title,
        entryType: entry.entryType,
        tags: entry.tags,
        productId: entry.productId,
        isLocked: entry.isLocked,
        content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    }),

  /**
   * Create a new vault entry (content is encrypted before storage).
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        entryType: z.enum(ENTRY_TYPES),
        content: z.string(),
        tags: z.string().optional(),
        productId: z.number().optional(),
        isLocked: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { encrypted, iv } = encryptContent(input.content);

      const [insertResult] = await db.insert(missionVault).values({
        userId: ctx.user.id,
        productId: input.productId ?? null,
        title: input.title,
        entryType: input.entryType,
        tags: input.tags ?? null,
        encryptedContent: encrypted,
        iv,
        isLocked: input.isLocked ?? false,
        vaultLocked: false,
      });

      return { success: true, id: insertResult.insertId };
    }),

  /**
   * Update an existing vault entry.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        entryType: z.enum(ENTRY_TYPES).optional(),
        content: z.string().optional(),
        tags: z.string().optional(),
        productId: z.number().nullable().optional(),
        isLocked: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const rows = await db
        .select({ id: missionVault.id })
        .from(missionVault)
        .where(and(eq(missionVault.id, input.id), eq(missionVault.userId, ctx.user.id)))
        .limit(1);

      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Vault entry not found" });

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.entryType !== undefined) updateData.entryType = input.entryType;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.productId !== undefined) updateData.productId = input.productId;
      if (input.isLocked !== undefined) updateData.isLocked = input.isLocked;

      if (input.content !== undefined) {
        const { encrypted, iv } = encryptContent(input.content);
        updateData.encryptedContent = encrypted;
        updateData.iv = iv;
      }

      await db
        .update(missionVault)
        .set(updateData)
        .where(and(eq(missionVault.id, input.id), eq(missionVault.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Delete a vault entry.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(missionVault)
        .where(and(eq(missionVault.id, input.id), eq(missionVault.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Set or verify the vault PIN.
   */
  setPin: protectedProcedure
    .input(z.object({ pin: z.string().min(4).max(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const hashedPin = hashPin(input.pin);

      await db
        .insert(vaultPins)
        .values({ userId: ctx.user.id, hashedPin })
        .onDuplicateKeyUpdate({ set: { hashedPin } });

      return { success: true };
    }),

  verifyPin: protectedProcedure
    .input(z.object({ pin: z.string().min(4).max(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(vaultPins)
        .where(eq(vaultPins.userId, ctx.user.id))
        .limit(1);

      const pinRow = rows[0];
      if (!pinRow) {
        // No PIN set yet — first time setup
        return { valid: true, noPinSet: true };
      }

      const hashedInput = hashPin(input.pin);
      return { valid: hashedInput === pinRow.hashedPin, noPinSet: false };
    }),

  hasPin: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasPin: false };

    const rows = await db
      .select({ id: vaultPins.id })
      .from(vaultPins)
      .where(eq(vaultPins.userId, ctx.user.id))
      .limit(1);

    return { hasPin: !!rows[0] };
  }),
});
