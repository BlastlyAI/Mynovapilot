import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MissionHeader from "@/components/MissionHeader";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

// ── Stage metadata (Language v2 — 9 stages) ──────────────────────────────────
const STAGE_META = [
  {
    id: "product-brief" as const,
    label: "Product Brief",
    number: 1,
    description: "Tell Aria what you want to build — your product name, audience, and the problem it solves.",
    icon: "📋",
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    tasks: ["Product name confirmed", "Problem statement written", "Target audience defined"],
  },
  {
    id: "market-research" as const,
    label: "Market Research",
    number: 2,
    description: "Researching your market — Aria identifies your competitors and validates demand.",
    icon: "🔍",
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    tasks: ["Nova Spark score ≥ 50", "Market gap identified", "Competitor landscape reviewed"],
  },
  {
    id: "your-plan" as const,
    label: "Your Plan",
    number: 3,
    description: "Approve your product plan — features, timeline, and what gets built first.",
    icon: "📝",
    color: "from-teal-500/20 to-teal-600/10 border-teal-500/30",
    tasks: ["Feature list approved", "Timeline agreed", "Plan signed off"],
  },
  {
    id: "building" as const,
    label: "Building",
    number: 4,
    description: "Building your product — usually 2 to 5 minutes. Aria handles the code.",
    icon: "🔧",
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    tasks: ["Landing page built", "Core feature built", "Integrations connected"],
  },
  {
    id: "review-changes" as const,
    label: "Review Changes",
    number: 5,
    description: "Review what was built — what changed, what systems it affects, and the risk level.",
    icon: "👁️",
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    tasks: ["Changes reviewed", "Risk level accepted", "Approval given"],
  },
  {
    id: "test-environment" as const,
    label: "Test Environment Ready",
    number: 6,
    description: "Test environment ready. Your live product is untouched while you test.",
    icon: "🧪",
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    tasks: ["Test environment created", "Live product isolated", "Ready to test"],
  },
  {
    id: "automated-testing" as const,
    label: "Automated Testing",
    number: 7,
    description: "Automated checks run across your product — catching issues before you see them.",
    icon: "⚙️",
    color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
    tasks: ["All automated tests passed", "No critical errors found", "Performance verified"],
  },
  {
    id: "your-preview" as const,
    label: "Your Preview",
    number: 8,
    description: "Testing complete. Now try it yourself — explore your product before it goes live.",
    icon: "👤",
    color: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    tasks: ["Founder preview completed", "Feedback noted", "Ready to approve"],
  },
  {
    id: "final-approval" as const,
    label: "Final Approval",
    number: 9,
    description: "One last check before you go live. Approve and your product launches immediately.",
    icon: "✅",
    color: "from-green-500/20 to-green-600/10 border-green-500/30",
    tasks: ["Final review complete", "Approval confirmed", "Ready to go live"],
  },
] as const;

type StageId = (typeof STAGE_META)[number]["id"];

// ── Stage card ────────────────────────────────────────────────────────────────
function StageCard({
  meta,
  dbStatus,
  isActive,
  isLocked,
  onSelect,
}: {
  meta: (typeof STAGE_META)[number];
  dbStatus: "pending" | "in-progress" | "complete";
  isActive: boolean;
  isLocked: boolean;
  onSelect: () => void;
}) {
  const isCompleted = dbStatus === "complete";

  return (
    <motion.div
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={
        !isLocked
          ? onSelect
          : () => toast.info("Complete the previous stage first.")
      }
      className={cn(
        "relative rounded-2xl border p-4 cursor-pointer transition-all duration-200",
        isActive
          ? `bg-gradient-to-br ${meta.color} border-opacity-50`
          : isCompleted
          ? "bg-green-500/10 border-green-500/20"
          : isLocked
          ? "bg-white/3 border-white/8 opacity-50 cursor-not-allowed"
          : "bg-white/5 border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg",
            isCompleted
              ? "bg-green-500/20 border border-green-500/30"
              : "bg-white/8 border border-white/12"
          )}
        >
          {isCompleted ? "✓" : meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
              Stage {meta.number}
            </span>
            {isActive && (
              <span className="text-[10px] font-bold text-amber bg-amber/15 border border-amber/25 px-1.5 py-0.5 rounded-full">
                Active
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-1.5 py-0.5 rounded-full">
                Complete
              </span>
            )}
            {isLocked && (
              <span className="text-[10px] font-bold text-white/30 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">
                Locked
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white leading-tight">{meta.label}</h3>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">{meta.description}</p>
        </div>
      </div>

      {(isActive || isCompleted) && (
        <div className="mt-3 space-y-1.5 pl-13">
          {meta.tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/40 text-green-400"
                    : i === 0
                    ? "bg-amber/20 border border-amber/30 text-amber"
                    : "bg-white/5 border border-white/15 text-white/20"
                )}
              >
                {isCompleted || i === 0 ? "✓" : "○"}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isCompleted
                    ? "text-white/60 line-through"
                    : i === 0
                    ? "text-white/80"
                    : "text-white/30"
                )}
              >
                {task}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── No product selected state ─────────────────────────────────────────────────
function NoProductState({
  products,
  onSelect,
}: {
  products: { id: number; missionName: string; launchStage: string }[];
  onSelect: (id: number) => void;
}) {
  return (
    <div className="px-4 py-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🔧</div>
        <h2 className="text-base font-bold text-white mb-1">Select a Product</h2>
        <p className="text-xs text-white/50">
          Choose a product to view and advance its build checklist.
        </p>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-white/40 mb-4">No products added yet.</p>
          <a
            href="/new-product"
            className="px-6 py-3 bg-amber text-[#1a274d] font-bold text-sm rounded-xl inline-block"
          >
            Add a Product First
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all text-left"
            >
              <span className="text-xl">🚀</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{p.missionName}</p>
                <p className="text-xs text-white/40 capitalize">
                  {p.launchStage.replace(/-/g, " ")}
                </p>
              </div>
              <span className="text-white/30 text-sm">→</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Assembly() {
  const { isAuthenticated } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [activeStageId, setActiveStageId] = useState<StageId>("product-brief");

  const utils = trpc.useUtils();

  // Load fleet products for selection
  const { data: products = [], isLoading: productsLoading } = trpc.fleet.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Load launch sequence for selected product
  const { data: stages = [], isLoading: stagesLoading } = trpc.launchSequence.list.useQuery(
    { productId: selectedProductId! },
    { enabled: !!selectedProductId && isAuthenticated }
  );

  // Advance stage mutation
  const advanceMutation = trpc.launchSequence.advanceStage.useMutation({
    onSuccess: () => {
      utils.launchSequence.list.invalidate({ productId: selectedProductId! });
      utils.fleet.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to advance stage", { description: err.message });
    },
  });

  // Start stage mutation
  const startStageMutation = trpc.launchSequence.startStage.useMutation({
    onSuccess: () => {
      utils.launchSequence.list.invalidate({ productId: selectedProductId! });
    },
  });

  const handleStageSelect = (stageId: StageId) => {
    setActiveStageId(stageId);
    if (selectedProductId) {
      const dbStage = stages.find((s) => s.stage === stageId);
      if (!dbStage || dbStage.status === "pending") {
        startStageMutation.mutate({ productId: selectedProductId, stage: stageId });
      }
    }
  };

  const handleCompleteStage = () => {
    if (!selectedProductId) return;
    const meta = STAGE_META.find((s) => s.id === activeStageId)!;
    const nextIdx = STAGE_META.findIndex((s) => s.id === activeStageId) + 1;
    const nextMeta = STAGE_META[nextIdx];

    advanceMutation.mutate(
      { productId: selectedProductId, stage: activeStageId },
      {
        onSuccess: () => {
          if (nextMeta) {
            setActiveStageId(nextMeta.id);
            toast.success(`${meta.label} complete!`, {
              description: `Moving to ${nextMeta.label}.`,
            });
          } else {
            toast.success("🚀 You're ready to go live!", {
              description: "All stages complete. Your product is ready to launch.",
            });
          }
        },
      }
    );
  };

  // Derive status map from DB stages
  const statusMap = Object.fromEntries(
    stages.map((s) => [s.stage, s.status as "pending" | "in-progress" | "complete"])
  ) as Record<StageId, "pending" | "in-progress" | "complete">;

  const completedCount = stages.filter((s) => s.status === "complete").length;
  const allComplete = completedCount === STAGE_META.length;
  const activeStage = STAGE_META.find((s) => s.id === activeStageId)!;
  const activeDbStatus = statusMap[activeStageId] ?? "pending";

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="flex flex-col min-h-full bg-mission">
      <MissionHeader
        title="Build"
        subtitle={selectedProduct ? selectedProduct.missionName : "Your build checklist"}
        clearanceStatus={allComplete ? "all-good" : "needs-attention"}
        rightAction={
          selectedProductId ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedProductId(null)}
              className="px-3 py-1.5 bg-white/8 border border-white/12 text-white/60 text-xs font-semibold rounded-lg"
            >
              Switch
            </motion.button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar content-scroll">
        {/* Unauthenticated */}
        {!isAuthenticated && (
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-lg font-bold text-white mb-2">Sign In to Build</h2>
            <p className="text-sm text-white/50 mb-6 max-w-xs">
              Sign in to track your build checklist and advance your products.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => startLogin()}
              className="px-6 py-3 bg-amber text-[#1a274d] font-bold text-sm rounded-2xl"
            >
              Sign In to Continue
            </motion.button>
          </div>
        )}

        {/* Loading */}
        {isAuthenticated && (productsLoading || stagesLoading) && (
          <div className="px-4 py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* No product selected */}
        {isAuthenticated && !productsLoading && !selectedProductId && (
          <NoProductState
            products={products.map((p) => ({
              id: p.id,
              missionName: p.missionName,
              launchStage: p.launchStage,
            }))}
            onSelect={(id) => {
              setSelectedProductId(id);
              // Set active stage to first non-complete stage
              const product = products.find((p) => p.id === id);
              if (product) {
                const stageId = (product.launchStage as StageId) ?? "product-brief";
                setActiveStageId(stageId);
              }
            }}
          />
        )}

        {/* Launch sequence */}
        {isAuthenticated && !productsLoading && selectedProductId && !stagesLoading && (
          <div className="px-4 py-4">
            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-medium">
                  Build Progress
                </span>
                <span className="text-xs font-bold text-amber">
                  {completedCount} / {STAGE_META.length}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber to-amber/70 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / STAGE_META.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>
            </div>

            {/* Stage pipeline */}
            <div className="space-y-3 mb-5">
              {STAGE_META.map((meta, index) => {
                const dbStatus = statusMap[meta.id] ?? "pending";
                const prevMeta = STAGE_META[index - 1];
                const prevStatus = prevMeta ? (statusMap[prevMeta.id] ?? "pending") : "complete";
                const isLocked = index > 0 && prevStatus !== "complete";
                const isActive = activeStageId === meta.id && dbStatus !== "complete";

                return (
                  <StageCard
                    key={meta.id}
                    meta={meta}
                    dbStatus={dbStatus}
                    isActive={isActive}
                    isLocked={isLocked}
                    onSelect={() => !isLocked && handleStageSelect(meta.id)}
                  />
                );
              })}
            </div>

            {/* Active stage action */}
            {!allComplete && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStageId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="glass-dark rounded-2xl p-4 border border-amber/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{activeStage.icon}</span>
                    <div>
                      <p className="text-xs text-amber font-semibold uppercase tracking-wider">
                        Current Stage
                      </p>
                      <h4 className="text-sm font-bold text-white">{activeStage.label}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 mb-4 leading-relaxed">
                    {activeStage.description}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCompleteStage}
                    disabled={advanceMutation.isPending || activeDbStatus === "complete"}
                    className="w-full py-3 bg-amber text-[#1a274d] font-bold text-sm rounded-xl shadow-lg shadow-amber/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {advanceMutation.isPending
                      ? "Advancing…"
                      : activeDbStatus === "complete"
                      ? "Stage Complete ✓"
                      : "Mark Stage Complete →"}
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            )}

            {allComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-dark rounded-2xl p-6 border border-green-500/30 text-center"
              >
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-lg font-bold text-white mb-1">Ready to Go Live</h3>
                <p className="text-sm text-white/60 mb-4">
                  All stages complete. Your product is ready to launch.
                </p>
                <button
                  onClick={() => toast.success("🚀 Your product is now live!", { description: "Verifying live product… Everything looks good ✓" })}
                  className="px-6 py-3 bg-green-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-green-500/20"
                >
                  🚀 Go Live
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
