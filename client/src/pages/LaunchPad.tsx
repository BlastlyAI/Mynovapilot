import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MissionHeader from "@/components/MissionHeader";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

type FlowStep = "form" | "analysing" | "result";

interface IdeaForm {
  name: string;
  description: string;
  targetAudience: string;
  problemSolved: string;
}

// ── Spark result type (mirrors tRPC output) ───────────────────────────────────
interface SparkResult {
  sparkScore: number;
  scoreLabel: string;
  marketClarity: number;
  problemFit: number;
  audienceDefinition: number;
  summary: string;
  strengths: string[];
  risks: string[];
  nextStep: string;
  missionBadge: string;
  clearanceStatus: "all-good" | "needs-attention" | "action-required";
}

// Map Language v2 clearance values → market signal labels
function mapMarketSignal(raw: string): { label: string; cls: string } {
  if (raw === "all-good") {
    return { label: "Strong Opportunity", cls: "bg-green-500/15 text-green-400 border-green-500/25" };
  }
  if (raw === "needs-attention") {
    return { label: "Competitive Market", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
  }
  return { label: "High Risk", cls: "bg-red-500/15 text-red-400 border-red-500/25" };
}

// Map to MissionHeader status
function mapHeaderStatus(raw: string): "all-good" | "needs-attention" | "action-required" {
  if (raw === "all-good") return "all-good";
  if (raw === "needs-attention") return "needs-attention";
  return "action-required";
}

// ── Score reveal component ────────────────────────────────────────────────────
function ScoreReveal({
  result,
  onContinue,
  onRunAgain,
}: {
  result: SparkResult;
  onContinue: () => void;
  onRunAgain: () => void;
}) {
  const { sparkScore, scoreLabel, marketClarity, problemFit, audienceDefinition } = result;
  const color =
    sparkScore >= 75 ? "#22c55e" : sparkScore >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (sparkScore / 100) * circumference;
  const marketSignal = mapMarketSignal(result.clearanceStatus);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center text-center px-5 py-6"
    >
      <p className="text-xs text-white/50 uppercase tracking-wider mb-5">
        Nova Spark Analysis Complete
      </p>

      {/* Score ring */}
      <div className="relative w-36 h-36 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <motion.circle
            cx="48" cy="48" r="44"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-4xl font-black text-white"
          >
            {sparkScore}
          </motion.span>
          <span className="text-xs text-white/50">/ 100</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mb-4 w-full"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-white">{scoreLabel}</h2>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              marketSignal.cls
            )}
          >
            {marketSignal.label}
          </span>
        </div>
        <p className="text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
          {result.summary}
        </p>
      </motion.div>

      {/* Sub-scores */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full max-w-sm space-y-2 mb-5"
      >
        {[
          { label: "Market Clarity", score: marketClarity, icon: "🎯" },
          { label: "Problem Fit", score: problemFit, icon: "🔧" },
          { label: "Audience Definition", score: audienceDefinition, icon: "👥" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-xs text-white/70 flex-1">{item.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: 1.2, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
              <span className="text-xs font-semibold text-white/60 w-6">{item.score}</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Strengths & Risks */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="w-full max-w-sm grid grid-cols-2 gap-3 mb-5"
      >
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">
            Strengths
          </p>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-xs text-white/70 flex gap-1.5">
                <span className="text-green-400 flex-shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">
            Risks
          </p>
          <ul className="space-y-1.5">
            {result.risks.map((r, i) => (
              <li key={i} className="text-xs text-white/70 flex gap-1.5">
                <span className="text-red-400 flex-shrink-0">!</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Next step */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="w-full max-w-sm p-3 bg-amber/8 border border-amber/20 rounded-xl mb-5 text-left"
      >
        <p className="text-[10px] font-bold text-amber uppercase tracking-wider mb-1">
          Aria's Recommendation
        </p>
        <p className="text-xs text-white/70 leading-relaxed">{result.nextStep}</p>
      </motion.div>

      {/* Premium locked — full report */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="w-full max-w-sm relative rounded-2xl overflow-hidden mb-5"
      >
        <div className="p-4 blur-sm pointer-events-none select-none opacity-60">
          <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
          <div className="h-3 bg-white/15 rounded w-full mb-1.5" />
          <div className="h-3 bg-white/15 rounded w-5/6 mb-1.5" />
          <div className="h-3 bg-white/15 rounded w-2/3" />
        </div>
        <div className="absolute inset-0 frosted-lock rounded-2xl flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-full bg-amber/20 border border-amber/30 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Unlock your full report</h4>
          <p className="text-xs text-white/60 mb-3 max-w-[200px]">
            Your idea scored {sparkScore}/100. Upgrade to start building.
          </p>
          <button
            onClick={() =>
              toast.info("Upgrade to Nova Pro", {
                description: "Full analysis and AI-powered build tools available in Pro.",
              })
            }
            className="px-4 py-2 bg-amber/20 border border-amber/30 text-amber text-xs font-semibold rounded-xl hover:bg-amber/30 transition-all"
          >
            Unlock with Nova Pro
          </button>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="w-full max-w-sm space-y-2"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="w-full py-3.5 bg-amber text-[#1a274d] font-bold text-sm rounded-2xl shadow-lg shadow-amber/20"
        >
          Start Building →
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRunAgain}
          className="w-full py-3 bg-white/5 border border-white/10 text-white/60 text-sm font-medium rounded-2xl"
        >
          Validate Another Idea
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Premium locked section ────────────────────────────────────────────────────
function PremiumLockedSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="p-4 blur-sm pointer-events-none select-none opacity-60">
        <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/15 rounded w-full mb-1.5" />
        <div className="h-3 bg-white/15 rounded w-5/6 mb-1.5" />
        <div className="h-3 bg-white/15 rounded w-2/3" />
      </div>
      <div className="absolute inset-0 frosted-lock rounded-2xl flex flex-col items-center justify-center text-center p-4">
        <div className="w-10 h-10 rounded-full bg-amber/20 border border-amber/30 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-white/60 mb-3 max-w-[200px]">{description}</p>
        <button
          onClick={() =>
            toast.info("Upgrade to Nova Pro", {
              description: "Unlock your full report and start building for $[price]/month.",
            })
          }
          className="px-4 py-2 bg-amber/20 border border-amber/30 text-amber text-xs font-semibold rounded-xl hover:bg-amber/30 transition-all"
        >
          Unlock with Nova Pro
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LaunchPad() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<FlowStep>("form");
  const [sparkResult, setSparkResult] = useState<SparkResult | null>(null);
  const [form, setForm] = useState<IdeaForm>({
    name: "",
    description: "",
    targetAudience: "",
    problemSolved: "",
  });

  const analyzeMutation = trpc.spark.analyze.useMutation({
    onSuccess: (data) => {
      setSparkResult(data);
      setStep("result");
    },
    onError: (err) => {
      toast.error("Analysis failed", { description: err.message });
      setStep("form");
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Product name and description are required.");
      return;
    }
    if (!isAuthenticated) {
      toast.info("Sign in to run Nova Spark", {
        description: "Create a free account to validate your idea with Aria.",
        action: { label: "Sign In", onClick: () => startLogin() },
      });
      return;
    }
    setStep("analysing");
    analyzeMutation.mutate({
      ideaName: form.name.trim(),
      ideaDescription: form.description.trim(),
      targetAudience: form.targetAudience.trim() || undefined,
      problemSolved: form.problemSolved.trim() || undefined,
    });
  };

  const handleRunAgain = () => {
    setStep("form");
    setSparkResult(null);
    setForm({ name: "", description: "", targetAudience: "", problemSolved: "" });
  };

  const headerStatus = sparkResult
    ? mapHeaderStatus(sparkResult.clearanceStatus)
    : "all-good";

  return (
    <div className="flex flex-col min-h-full bg-mission">
      <MissionHeader
        title="New Product"
        subtitle="Validate your idea in 4 minutes"
        clearanceStatus={sparkResult ? headerStatus : undefined}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar content-scroll">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Idea Form ─────────────────────────────────────── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-4 space-y-4"
            >
              {/* Nova Spark badge */}
              <div className="flex items-center gap-3 p-3 bg-amber/10 border border-amber/20 rounded-2xl">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs font-bold text-amber">Nova Spark — Free</p>
                  <p className="text-xs text-white/50">
                    Validate your idea in 4 minutes. No commitment.
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TradeFlow Pro"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber/50 focus:bg-white/8 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    Describe Your Idea *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What does your product do? Keep it simple — one or two sentences."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber/50 focus:bg-white/8 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    Who is it for?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tradies who invoice on-site"
                    value={form.targetAudience}
                    onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber/50 focus:bg-white/8 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                    What problem does it solve?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chasing unpaid invoices takes hours every week"
                    value={form.problemSolved}
                    onChange={(e) => setForm((f) => ({ ...f, problemSolved: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber/50 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                className="w-full py-4 bg-amber text-[#1a274d] font-bold text-sm rounded-2xl shadow-lg shadow-amber/20 hover:bg-amber/90 transition-all"
              >
                ⚡ Run Nova Spark Analysis
              </motion.button>

              {/* Premium locked sections */}
              <div className="space-y-3 mt-2">
                <p className="text-xs text-white/30 uppercase tracking-wider text-center">
                  Nova Pro Features
                </p>
                <PremiumLockedSection
                  title="Competitor Intelligence"
                  description="AI scans 50+ competitors and identifies your market gap."
                />
                <PremiumLockedSection
                  title="Revenue Modelling"
                  description="Projected revenue, pricing strategy, and break-even analysis."
                />
                <PremiumLockedSection
                  title="Domain & Brand Scout"
                  description="Aria finds available domains and brand names that fit your product."
                />
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Analysing ─────────────────────────────────────── */}
          {step === "analysing" && (
            <motion.div
              key="analysing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-5xl mb-6"
              >
                ⚡
              </motion.div>
              <h2 className="text-lg font-bold text-white mb-2">Researching your idea…</h2>
              <p className="text-sm text-white/50 max-w-xs">
                Aria is scanning market signals, validating your concept, and computing your score.
              </p>
              <div className="flex gap-1.5 mt-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>

              {/* Analysis steps */}
              <div className="mt-8 space-y-2 w-full max-w-xs">
                {[
                  "Evaluating market size…",
                  "Checking problem-solution fit…",
                  "Assessing audience clarity…",
                  "Computing Nova Spark score…",
                ].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-2 text-left"
                  >
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    />
                    <span className="text-xs text-white/40">{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Score Result ──────────────────────────────────── */}
          {step === "result" && sparkResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ScoreReveal
                result={sparkResult}
                onContinue={() => {
                  toast.success("Ready to build!", {
                    description: "Head to Build to start your launch sequence.",
                  });
                  setStep("form");
                  setSparkResult(null);
                  setForm({ name: "", description: "", targetAudience: "", problemSolved: "" });
                }}
                onRunAgain={handleRunAgain}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
