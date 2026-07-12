import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";

// ── Aria personality system prompt ───────────────────────────────────────────
const ARIA_SYSTEM_PROMPT = `You are Aria, the AI co-pilot inside MyNovaPilot — a product-fleet management platform for founders and entrepreneurs.

Your personality:
- Warm, direct, and encouraging — like a brilliant co-founder who has seen everything
- You speak in plain English, never jargon or buzzwords
- You are honest: if an idea has risks, you name them clearly but constructively
- You are concise: prefer short paragraphs over long walls of text
- You use light formatting (bold for key terms, bullet points for lists) but never overdo it
- You never say "Great question!" or filler phrases

Your role:
- Help founders validate ideas, track progress, and make smart decisions
- Explain what each screen does and what actions the founder should take next
- Surface risks, opportunities, and next steps based on context
- When asked about a specific product, give concrete, actionable advice

Platform context:
- Dashboard: shows the founder's product fleet — all their products at a glance
- New Product: Nova Spark idea validation — AI scores ideas on market clarity, problem fit, and audience definition
- Build: 9-stage launch checklist from Product Brief through Final Approval
- Connections: infrastructure setup — domains, payments, email, hosting, analytics, auth
- Health: product health monitoring — status scores, alerts, and emergency controls
- Settings: account preferences and billing

Always be helpful, honest, and action-oriented. When you don't know something specific about the founder's products, ask a clarifying question rather than guessing.`;

// ── Message schema ────────────────────────────────────────────────────────────
const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// ── Non-streaming chat (for tRPC, returns full response) ─────────────────────
export const ariaRouter = router({
  /**
   * Full chat completion — returns the complete response.
   * Used for "Ask Aria anything" with conversation history.
   */
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(MessageSchema).min(1).max(50),
        screenContext: z.string().optional(),
        productContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { messages, screenContext, productContext } = input;

      // Build system prompt with optional context
      let systemContent = ARIA_SYSTEM_PROMPT;
      if (screenContext) {
        systemContent += `\n\nCurrent screen context: ${screenContext}`;
      }
      if (productContext) {
        systemContent += `\n\nProduct context: ${productContext}`;
      }

      const llmMessages = [
        { role: "system" as const, content: systemContent },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const apiUrl =
        ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
          ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
          : "https://forge.manus.im/v1/chat/completions";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          messages: llmMessages,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Aria chat failed: ${response.status} – ${errorText}`,
        });
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices[0]?.message?.content ?? "";
      return { content };
    }),

  /**
   * Explain current screen — one-shot explanation of what the screen does
   * and what the founder should do next.
   */
  explain: protectedProcedure
    .input(
      z.object({
        screenName: z.string(),
        screenDescription: z.string().optional(),
        productContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { screenName, screenDescription, productContext } = input;

      const userMessage = [
        `I'm on the "${screenName}" screen.`,
        screenDescription ? `Here's what I see: ${screenDescription}` : "",
        productContext ? `My product context: ${productContext}` : "",
        "Please explain what this screen is for and what I should do next.",
      ]
        .filter(Boolean)
        .join(" ");

      const apiUrl =
        ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
          ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
          : "https://forge.manus.im/v1/chat/completions";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: ARIA_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Aria explain failed: ${response.status} – ${errorText}`,
        });
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      return { content: data.choices[0]?.message?.content ?? "" };
    }),

  /**
   * Show options — returns a list of actions available on the current screen.
   */
  options: protectedProcedure
    .input(
      z.object({
        screenName: z.string(),
        productContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { screenName, productContext } = input;

      const userMessage = [
        `I'm on the "${screenName}" screen in MyNovaPilot.`,
        productContext ? `My product context: ${productContext}` : "",
        "What are the key actions I can take here? Give me a concise list of 3-5 options with a one-sentence description of each.",
      ]
        .filter(Boolean)
        .join(" ");

      const apiUrl =
        ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
          ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
          : "https://forge.manus.im/v1/chat/completions";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: ARIA_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Aria options failed: ${response.status} – ${errorText}`,
        });
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      return { content: data.choices[0]?.message?.content ?? "" };
    }),
});
