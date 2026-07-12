import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Shared auth context ───────────────────────────────────────────────────────
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-user-p3",
      email: "founder@example.com",
      name: "Test Founder",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Aria router tests ─────────────────────────────────────────────────────────
describe("aria.chat", () => {
  it("returns a non-empty content string for a simple question", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aria.chat({
      messages: [{ role: "user", content: "What is MyNovaPilot?" }],
      screenContext: "Dashboard",
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("accepts multi-turn conversation history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aria.chat({
      messages: [
        { role: "user", content: "What is Nova Spark?" },
        { role: "assistant", content: "Nova Spark is the free idea validation engine." },
        { role: "user", content: "How is the score calculated?" },
      ],
      screenContext: "New Product",
    });

    expect(result.content.length).toBeGreaterThan(0);
  });
});

describe("aria.explain", () => {
  it("returns an explanation for a given screen", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aria.explain({
      screenName: "Dashboard",
      screenDescription: "Shows all your products at a glance",
    });

    expect(result).toHaveProperty("content");
    expect(result.content.length).toBeGreaterThan(0);
  });
});

describe("aria.options", () => {
  it("returns available options for a given screen", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aria.options({ screenName: "Build" });

    expect(result).toHaveProperty("content");
    expect(result.content.length).toBeGreaterThan(0);
  });
});

// ── Vault encryption unit tests ───────────────────────────────────────────────
describe("vault encryption helpers", () => {
  it("encrypts and decrypts content correctly", async () => {
    // Import the encryption helpers directly
    const { encryptContent, decryptContent } = await import("./routers/vault");

    const original = "sk_live_super_secret_api_key_12345";
    const { encrypted, iv } = encryptContent(original);

    expect(encrypted).not.toBe(original);
    expect(iv).toBeTruthy();
    expect(iv.length).toBeGreaterThan(0);

    const decrypted = decryptContent(encrypted, iv);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same plaintext (unique IV)", async () => {
    const { encryptContent } = await import("./routers/vault");

    const text = "same content";
    const result1 = encryptContent(text);
    const result2 = encryptContent(text);

    // IVs should be different (random per encryption)
    expect(result1.iv).not.toBe(result2.iv);
    // Ciphertexts should differ because of different IVs
    expect(result1.encrypted).not.toBe(result2.encrypted);
  });
});

// ── Vault PIN tests ───────────────────────────────────────────────────────────
describe("vault.hasPin", () => {
  it("returns hasPin boolean for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vault.hasPin();
    expect(result).toHaveProperty("hasPin");
    expect(typeof result.hasPin).toBe("boolean");
  });
});

describe("vault.list", () => {
  it("returns an array of vault entries for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vault.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Vault create + get round-trip tests ──────────────────────────────────────
describe("vault.create and vault.get (encryption round-trip)", () => {
  it("creates a vault entry and retrieves decrypted content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const secretContent = "my-super-secret-api-key-xyz-12345";

    // Create the entry
    const createResult = await caller.vault.create({
      title: "Test API Key",
      entryType: "api-key",
      content: secretContent,
      tags: "test,phase3",
    });

    expect(createResult).toHaveProperty("success", true);
    expect(createResult).toHaveProperty("id");
    const entryId = createResult.id as number;
    expect(typeof entryId).toBe("number");

    // Retrieve and decrypt the entry
    const getResult = await caller.vault.get({ id: entryId });

    expect(getResult).toHaveProperty("id", entryId);
    expect(getResult).toHaveProperty("title", "Test API Key");
    expect(getResult).toHaveProperty("entryType", "api-key");
    // Content should be decrypted back to the original plaintext
    expect(getResult).toHaveProperty("content", secretContent);
    // Encrypted fields should NOT be exposed in the response
    expect(getResult).not.toHaveProperty("encryptedContent");
    expect(getResult).not.toHaveProperty("iv");
  });

  it("returns null content for a locked entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const createResult = await caller.vault.create({
      title: "Locked Note",
      entryType: "note",
      content: "private note content",
      isLocked: true,
    });

    expect(createResult.success).toBe(true);
    const entryId = createResult.id as number;

    const getResult = await caller.vault.get({ id: entryId });
    // Locked entries should not expose content
    expect(getResult.isLocked).toBe(true);
    expect(getResult.content).toBeNull();
  });
});
