import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";

// ── ElevenLabs agent ID ───────────────────────────────────────────────────────
// Set VITE_ELEVENLABS_AGENT_ID in secrets to enable voice. Falls back to a
// graceful "coming soon" state if not configured.
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

// ── Aria image ────────────────────────────────────────────────────────────────
const ARIA_IMAGE = "/manus-storage/aria-landing_320e4c74.png";

// ── Animation variants ────────────────────────────────────────────────────────
const wordVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.4 + i * 0.55,
      duration: 0.7,
      ease: "easeOut" as const,
    },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 2.0 + i * 0.2,
      duration: 0.6,
      ease: "easeOut" as const,
    },
  }),
};

// ── Voice agent hook ──────────────────────────────────────────────────────────
function useElevenLabsAgent() {
  const [status, setStatus] = useState<"idle" | "loading" | "active" | "error">("idle");
  const widgetRef = useRef<HTMLDivElement>(null);

  const startAgent = async () => {
    if (!ELEVENLABS_AGENT_ID) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      // Dynamically inject the ElevenLabs convai widget script once
      if (!document.getElementById("elevenlabs-convai-script")) {
        const script = document.createElement("script");
        script.id = "elevenlabs-convai-script";
        script.src = "https://elevenlabs.io/convai-widget/index.js";
        script.async = true;
        script.type = "text/javascript";
        document.head.appendChild(script);
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
          script.onerror = () => resolve(); // still try
        });
      }
      setStatus("active");
    } catch {
      setStatus("error");
    }
  };

  return { status, startAgent, widgetRef };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { status, startAgent, widgetRef } = useElevenLabsAgent();
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleCTA = () => {
    if (!ELEVENLABS_AGENT_ID) {
      // Graceful fallback — open login/signup
      window.location.href = "/dashboard";
      return;
    }
    setShowVoiceModal(true);
    startAgent();
  };

  return (
    <div className="min-h-screen bg-[#1a2744] text-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col md:flex-row">

        {/* Mobile: Aria top portrait */}
        <div className="md:hidden relative w-full h-[55vw] max-h-[420px] overflow-hidden flex-shrink-0">
          <img
            src={ARIA_IMAGE}
            alt="Aria — your AI co-pilot"
            className="w-full h-full object-cover object-top"
          />
          {/* Fade to navy at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a2744] to-transparent" />
        </div>

        {/* Desktop: Aria left half */}
        <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative items-end justify-center overflow-hidden">
          <img
            src={ARIA_IMAGE}
            alt="Aria — your AI co-pilot"
            className="w-full h-full object-cover object-center"
            style={{ maxHeight: "100vh" }}
          />
          {/* Fade to navy on the right edge */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#1a2744] to-transparent" />
        </div>

        {/* Copy + CTA */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-16 pb-16 md:pb-0 pt-4 md:pt-0">

          {/* Growing tagline */}
          <div className="mb-10 md:mb-12 select-none" aria-label="think build launch">
            {(["think", "build", "launch"] as const).map((word, i) => {
              const sizes = [
                // think — 1x
                "text-4xl md:text-5xl font-light tracking-tight",
                // build — 1.6x
                "text-[2.5rem] md:text-[4rem] font-medium tracking-tight",
                // launch — 2.4x
                "text-[3.75rem] md:text-[6rem] font-bold tracking-tight leading-none",
              ];
              const indents = ["ml-0", "ml-6 md:ml-10", "ml-12 md:ml-20"];
              return (
                <motion.div
                  key={word}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={wordVariants}
                  className={`block ${sizes[i]} ${indents[i]} text-white`}
                >
                  {word}
                </motion.div>
              );
            })}
          </div>

          {/* Subheadline */}
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-white/70 text-lg md:text-xl leading-relaxed mb-8 max-w-sm"
          >
            The fastest way to go from idea to live product.
            <br />
            <span className="text-white/50">No developer. No technical knowledge. No guesswork.</span>
          </motion.p>

          {/* CTA button */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-4"
          >
            <button
              onClick={handleCTA}
              disabled={status === "loading"}
              className="w-full md:w-auto px-10 py-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-[#1a2744] font-bold text-xl md:text-2xl transition-all duration-150 ease-out shadow-lg shadow-amber-500/30 disabled:opacity-70 disabled:cursor-wait"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-3 justify-center">
                  <span className="inline-block w-5 h-5 border-2 border-[#1a2744]/40 border-t-[#1a2744] rounded-full animate-spin" />
                  Starting Aria…
                </span>
              ) : (
                "Talk to Aria — it's free"
              )}
            </button>
          </motion.div>

          {/* Subline */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-white/35 text-sm"
          >
            No signup required. Takes about 8 minutes.
          </motion.p>

          {/* Sign in link */}
          <motion.p
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 text-white/30 text-sm"
          >
            Already have an account?{" "}
            <Link href="/dashboard" className="text-amber-400/70 hover:text-amber-400 underline underline-offset-2 transition-colors">
              Sign in
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ── VOICE AGENT OVERLAY ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showVoiceModal && status === "active" && ELEVENLABS_AGENT_ID && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1a2744]/95 backdrop-blur-sm flex flex-col items-center justify-center px-6"
          >
            {/* Close */}
            <button
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white/80 text-3xl transition-colors"
              aria-label="Close"
            >
              ×
            </button>

            {/* Aria portrait small */}
            <img
              src={ARIA_IMAGE}
              alt="Aria"
              className="w-28 h-28 rounded-full object-cover object-top border-2 border-amber-500/40 mb-6"
            />

            <p className="text-white/60 text-sm mb-8 text-center max-w-xs">
              Aria is listening. Tell her about your idea — she'll guide you through the rest.
            </p>

            {/* ElevenLabs convai widget */}
            <div ref={widgetRef} className="w-full max-w-sm">
              {/* @ts-expect-error — custom element from ElevenLabs */}
              <elevenlabs-convai
                agent-id={ELEVENLABS_AGENT_ID}
                style={{
                  width: "100%",
                  "--el-convai-button-color": "#f59e0b",
                  "--el-convai-button-text-color": "#1a2744",
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-red-900/80 border border-red-500/30 rounded-2xl px-6 py-4 text-sm text-red-200 max-w-sm text-center"
          >
            Voice agent not configured yet.{" "}
            <Link href="/dashboard" className="text-amber-400 underline">
              Go to dashboard →
            </Link>
            <button
              onClick={() => setShowVoiceModal(false)}
              className="ml-3 text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 md:px-16 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-2xl md:text-3xl font-semibold text-white/90 mb-14 text-center"
        >
          How it works
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {[
            {
              number: "01",
              title: "Talk to Aria",
              body: "Describe your idea by voice. No forms, no typing. Just talk — even while driving.",
            },
            {
              number: "02",
              title: "See your score",
              body: "Aria analyses your idea and reveals a score with three key insights. Find out if you're onto something.",
            },
            {
              number: "03",
              title: "Start building",
              body: "Go from brief to live product. Your idea is already waiting in your dashboard.",
            },
          ].map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" as const }}
              className="flex flex-col gap-4"
            >
              <span className="text-amber-500 font-mono text-sm font-semibold tracking-widest">{step.number}</span>
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="text-white/55 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOUNDERS SAY ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 md:px-16 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-2xl md:text-3xl font-semibold text-white/90 mb-4 text-center"
        >
          Founders say
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-white/35 text-center text-sm mb-12"
        >
          Real stories from real founders — coming soon.
        </motion.p>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-500/40 text-sm">★</span>
                ))}
              </div>
              <div className="h-16 rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-8 rounded-full bg-white/[0.07]" />
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── THE PROMISE ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-8 md:px-16 bg-white/[0.03] border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="text-2xl md:text-3xl font-semibold text-white/90 mb-4"
          >
            We treat founders fairly.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-white/40 mb-14"
          >
            Three promises we keep, always.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🛡",
                title: "Failed builds never cost you credits",
                body: "If something goes wrong on our side, you don't pay for it.",
              },
              {
                icon: "🔗",
                title: "We never cut off a build halfway",
                body: "Once a build starts, it completes. No surprises mid-flight.",
              },
              {
                icon: "💡",
                title: "You always know the cost before you start",
                body: "Full transparency on pricing before any credits are used.",
              },
            ].map((promise, i) => (
              <motion.div
                key={promise.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: "easeOut" as const }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07]"
              >
                <span className="text-3xl">{promise.icon}</span>
                <h3 className="text-base font-semibold text-white/90 text-center">{promise.title}</h3>
                <p className="text-sm text-white/45 text-center leading-relaxed">{promise.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-8 md:px-16 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <span className="text-2xl">🚀</span>
            <span className="font-semibold text-lg tracking-tight">MyNovaPilot</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-white/35">
            <span>© {new Date().getFullYear()} MyNovaPilot</span>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
