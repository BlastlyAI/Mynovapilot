import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { fleetRouter } from "./routers/fleet";
import { launchSequenceRouter } from "./routers/launchSequence";
import { sparkRouter } from "./routers/spark";
import { ariaRouter } from "./routers/aria";
import { vaultRouter } from "./routers/vault";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Mission fleet CRUD
  fleet: fleetRouter,

  // Launch sequence stage management
  launchSequence: launchSequenceRouter,

  // Nova Spark AI analysis
  spark: sparkRouter,

  // Aria AI co-pilot chat
  aria: ariaRouter,

  // Mission Vault — encrypted secure storage
  vault: vaultRouter,
});

export type AppRouter = typeof appRouter;
