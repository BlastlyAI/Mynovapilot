import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import MissionHeader from "@/components/MissionHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { FleetProduct } from "../../../drizzle/schema";

// ── Status config — Language v2 ──────────────────────────────────────────────
type ProductStatus = "all-good" | "needs-attention" | "action-required";

const STATUS_CONFIG: Record<
  ProductStatus | "live" | "planning",
  { label: string; badgeClass: string; dotClass: string }
> = {
  "all-good": {
    label: "All Good",
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/25",
    dotClass: "bg-green-400",
  },
  "needs-attention": {
    label: "Needs Attention",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-400",
  },
  "action-required": {
    label: "Action Required",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/25",
    dotClass: "bg-red-400",
  },
  "live": {
    label: "Live",
    badgeClass: "bg-teal-500/15 text-teal-400 border-teal-500/25",
    dotClass: "bg-teal-400 animate-pulse",
  },
  "planning": {
    label: "Planning",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    dotClass: "bg-blue-400",
  },
};

// Map legacy DB values → Language v2 display
function mapClearanceStatus(raw: string, launchStage: string): keyof typeof STATUS_CONFIG {
  if (launchStage === "live") return "live";
  if (launchStage === "product-brief" || launchStage === "market-research") return "planning";
  if (raw === "all-good" || raw === "approved") return "all-good";
  if (raw === "needs-attention") return "needs-attention";
  if (raw === "action-required" || raw === "locked" || raw === "high-risk") return "action-required";
  return "needs-attention";
}

// ── Stage display labels — Language v2 ───────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  "product-brief": "Product Brief",
  "market-research": "Market Research",
  "your-plan": "Your Plan",
  building: "Building",
  "review-changes": "Review Changes",
  "test-environment": "Test Environment Ready",
  "automated-testing": "Automated Testing",
  "your-preview": "Your Preview",
  "final-approval": "Final Approval",
  live: "Live",
};

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const glowClass =
    score >= 75 ? "score-glow-green" : score >= 50 ? "score-glow-amber" : "score-glow-red";
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative w-14 h-14 flex-shrink-0 rounded-full", glowClass)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r="22"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white leading-none">{score}</span>
        <span className="text-[8px] text-white/40 leading-none mt-0.5">score</span>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, index }: { product: FleetProduct; index: number }) {
  const statusKey = mapClearanceStatus(product.clearanceStatus, product.launchStage);
  const statusCfg = STATUS_CONFIG[statusKey];
  const stageLabel = STAGE_LABELS[product.launchStage] ?? product.launchStage;

  const lastActive = new Date(product.lastActivityAt);
  const diffMs = Date.now() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const lastActivityText =
    diffMins < 2
      ? "Just now"
      : diffMins < 60
      ? `${diffMins} min ago`
      : diffMins < 1440
      ? `${Math.floor(diffMins / 60)} hr ago`
      : `${Math.floor(diffMins / 1440)} day ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="glass-dark rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
    >
      <div className="flex items-start gap-3 mb-3">
        <ScoreRing score={product.statusBoardScore} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white leading-tight truncate">
                {product.missionName}
              </h3>
              <p className="text-xs text-white/40 mt-0.5 truncate">
                {product.domain ?? "No domain set"}
              </p>
            </div>
            <span
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0",
                statusCfg.badgeClass
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dotClass)} />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1.5 leading-relaxed line-clamp-2">
            {product.plainStatus}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Stage</span>
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            {stageLabel}
          </span>
        </div>
        <span className="text-[10px] text-white/30">Active {lastActivityText}</span>
      </div>

      <div className="flex gap-2">
        <Link href="/build">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2 px-3 bg-amber/15 hover:bg-amber/25 border border-amber/25 text-amber text-xs font-semibold rounded-xl transition-all duration-200 text-center"
          >
            Open Product
          </motion.button>
        </Link>
        <Link href="/health">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold rounded-xl transition-all duration-200 text-center"
          >
            View Health
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-12"
    >
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-6xl mb-6"
      >
        🚀
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">Your dashboard is ready</h2>
      <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-8">
        You haven't added any products yet. Every great product started as a single idea — yours is waiting.
      </p>
      <div className="w-full max-w-xs space-y-2 mb-8">
        {[
          { done: true, label: "Dashboard activated" },
          { done: false, label: "First product added" },
          { done: false, label: "Nova Spark analysis complete" },
          { done: false, label: "Ready to start building" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-3 text-left"
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs",
                item.done
                  ? "bg-green-500/20 border border-green-500/40 text-green-400"
                  : "bg-white/5 border border-white/15 text-white/20"
              )}
            >
              {item.done ? "✓" : "○"}
            </div>
            <span className={cn("text-sm", item.done ? "text-white/70" : "text-white/30")}>
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        onClick={onStart}
        className="px-8 py-3.5 bg-amber text-navy-deep font-bold text-sm rounded-2xl shadow-lg shadow-amber/20 transition-all duration-200"
      >
        Start New Product
      </motion.button>
    </motion.div>
  );
}

// ── Add Product Modal ─────────────────────────────────────────────────────────
function AddProductModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.fleet.create.useMutation({
    onSuccess: () => {
      toast.success("Product added!", {
        description: `"${name}" has been added to your portfolio.`,
      });
      setName("");
      setDomain("");
      setDescription("");
      onCreated();
      onClose();
    },
    onError: (err) => {
      toast.error("Failed to add product", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      missionName: name.trim(),
      domain: domain.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1b3d] border-t border-white/10 rounded-t-3xl px-5 pt-5 pb-10 max-w-lg mx-auto"
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h2 className="text-base font-bold text-white mb-1">Start New Product</h2>
            <p className="text-xs text-white/50 mb-5">
              Give your product a name to get started. You can add more details later.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                  Product Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. TradeFlow Pro"
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber/50 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                  Domain (optional)
                </label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. tradeflowpro.com"
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                  One-line description (optional)
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this product do?"
                  className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber/50 transition-colors"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="w-full py-3.5 bg-amber text-[#1a274d] font-bold text-sm rounded-2xl shadow-lg shadow-amber/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createMutation.isPending ? "Adding product…" : "🚀 Add This Product"}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Portfolio Hero ────────────────────────────────────────────────────────────
function PortfolioHero({
  products,
  onStart,
}: {
  products: FleetProduct[];
  onStart: () => void;
}) {
  const liveCount = products.filter((p) => p.launchStage === "live").length;
  const needsAttention = products.filter(
    (p) => p.clearanceStatus === "needs-attention" || p.clearanceStatus === "action-required" || p.clearanceStatus === "high-risk"
  ).length;
  const totalRevenueCents = products.reduce((sum, p) => sum + p.monthlyRevenueCents, 0);
  const revenueDisplay =
    totalRevenueCents === 0 ? "$0" : `$${(totalRevenueCents / 100).toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mx-4 mt-4 rounded-2xl overflow-hidden border border-white/10"
      style={{
        background:
          "linear-gradient(135deg, rgba(26,39,77,0.95) 0%, rgba(13,148,136,0.15) 100%)",
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Your Portfolio</p>
            <h2 className="text-lg font-bold text-white">
              {products.length} Product{products.length !== 1 ? "s" : ""}
            </h2>
          </div>
          {needsAttention > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber/15 border border-amber/25 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-400">
                {needsAttention} need{needsAttention !== 1 ? "" : "s"} attention
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Live", value: liveCount.toString(), color: "text-teal-400", icon: "🟢" },
            { label: "Revenue", value: revenueDisplay, color: "text-amber-400", icon: "💰" },
            { label: "Total", value: products.length.toString(), color: "text-blue-400", icon: "📦" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 rounded-xl p-3 text-center border border-white/8"
            >
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className={cn("text-base font-bold", stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-3 bg-amber text-[#1a274d] font-bold text-sm rounded-xl shadow-lg shadow-amber/20 transition-all duration-200 hover:bg-amber/90"
        >
          + Start New Product
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-dark rounded-2xl p-4 border border-white/10 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-14 h-14 rounded-full bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/6 rounded w-1/2" />
          <div className="h-3 bg-white/6 rounded w-full" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="flex-1 h-8 bg-white/8 rounded-xl" />
        <div className="flex-1 h-8 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MissionControl() {
  const { isAuthenticated } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: products = [], isLoading } = trpc.fleet.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const handleCreated = () => {
    utils.fleet.list.invalidate();
  };

  // Derive overall status for the header badge
  const overallStatus: "all-good" | "needs-attention" | "action-required" =
    products.some((p) => p.clearanceStatus === "action-required" || p.clearanceStatus === "high-risk" || p.clearanceStatus === "locked")
      ? "action-required"
      : products.some((p) => p.clearanceStatus === "needs-attention")
      ? "needs-attention"
      : "all-good";

  return (
    <div className="flex flex-col min-h-full bg-mission">
      <MissionHeader
        title="Dashboard"
        subtitle="Your products at a glance"
        clearanceStatus={isAuthenticated && products.length > 0 ? overallStatus : undefined}
        rightAction={
          !isAuthenticated ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => startLogin()}
              className="px-3 py-1.5 bg-amber/15 border border-amber/25 text-amber text-xs font-semibold rounded-lg"
            >
              Sign In
            </motion.button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar content-scroll">
        {/* Unauthenticated state */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center px-6 py-16"
          >
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl mb-6"
            >
              🚀
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to MyNovaPilot</h2>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-3">
              Sign in to access your products, track progress, and start building your next idea.
            </p>
            <p className="text-xs text-white/30 italic max-w-xs mb-8">
              "You are the pilot. We handle the rest."
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => startLogin()}
              className="px-8 py-3.5 bg-amber text-navy-deep font-bold text-sm rounded-2xl shadow-lg shadow-amber/20"
            >
              🚀 Get Started
            </motion.button>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {isAuthenticated && isLoading && (
          <div className="px-4 mt-4 space-y-3">
            <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Authenticated + loaded */}
        {isAuthenticated && !isLoading && (
          <>
            {products.length === 0 ? (
              <EmptyState onStart={() => setAddOpen(true)} />
            ) : (
              <>
                <PortfolioHero products={products} onStart={() => setAddOpen(true)} />
                <div className="px-4 mt-4 space-y-3 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Your Products
                    </h3>
                    <span className="text-xs text-white/30">{products.length} total</span>
                  </div>
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Product modal */}
      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
