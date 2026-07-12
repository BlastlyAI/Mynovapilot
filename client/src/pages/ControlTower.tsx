import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MissionHeader from "@/components/MissionHeader";
import { toast } from "sonner";

type WeatherStatus = "all-good" | "needs-attention" | "action-required";

interface ProductHealth {
  id: string;
  name: string;
  domain: string;
  overallScore: number;
  trend: "up" | "down" | "stable";
  status: WeatherStatus;
  metrics: {
    label: string;
    score: number;
    icon: string;
  }[];
  alerts: string[];
}

const PRODUCTS: ProductHealth[] = [
  {
    id: "1",
    name: "TradeFlow Pro",
    domain: "tradeflowpro.com",
    overallScore: 87,
    trend: "up",
    status: "all-good",
    metrics: [
      { label: "Uptime", score: 99, icon: "⚡" },
      { label: "Performance", score: 91, icon: "🚀" },
      { label: "Security", score: 88, icon: "🔒" },
      { label: "Revenue", score: 72, icon: "💰" },
    ],
    alerts: [],
  },
  {
    id: "2",
    name: "NestNest",
    domain: "nestnest.io",
    overallScore: 54,
    trend: "down",
    status: "needs-attention",
    metrics: [
      { label: "Uptime", score: 78, icon: "⚡" },
      { label: "Performance", score: 61, icon: "🚀" },
      { label: "Security", score: 55, icon: "🔒" },
      { label: "Revenue", score: 20, icon: "💰" },
    ],
    alerts: ["Domain expires in 7 days", "SSL certificate warning"],
  },
];

const WEATHER_CONFIG: Record<WeatherStatus, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  "all-good": {
    label: "All Good",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    dot: "bg-green-400",
    icon: "🟢",
  },
  "needs-attention": {
    label: "Needs Attention",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400 animate-pulse",
    icon: "🟡",
  },
  "action-required": {
    label: "Action Required",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
    icon: "🔴",
  },
};

// ── Score mini-ring ──────────────────────────────────────────────────────────
function MiniScore({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-10 h-10">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <motion.circle
          cx="18" cy="18" r="16"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

// ── Product health card ──────────────────────────────────────────────────────
function ProductHealthCard({ product, index }: { product: ProductHealth; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const weatherCfg = WEATHER_CONFIG[product.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-dark rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="relative">
          <MiniScore score={product.overallScore} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0",
                weatherCfg.bg,
                weatherCfg.color
              )}
            >
              <span className={cn("w-1 h-1 rounded-full", weatherCfg.dot)} />
              {weatherCfg.label}
            </span>
          </div>
          <p className="text-xs text-white/40 truncate">{product.domain}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-xs font-bold", product.trend === "up" ? "text-green-400" : product.trend === "down" ? "text-red-400" : "text-white/40")}>
            {product.trend === "up" ? "↑" : product.trend === "down" ? "↓" : "—"}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn("w-4 h-4 text-white/30 transition-transform duration-200", expanded && "rotate-180")}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Expanded metrics */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/8 pt-3">
              {/* Metric bars */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {product.metrics.map((metric) => (
                  <div key={metric.label} className="bg-white/4 rounded-xl p-2.5 border border-white/8">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs">{metric.icon}</span>
                      <span className="text-[10px] text-white/50">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              metric.score >= 75 ? "#22c55e" : metric.score >= 50 ? "#f59e0b" : "#ef4444",
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.score}%` }}
                          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white/60 w-6 text-right">{metric.score}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {product.alerts.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {product.alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-amber/8 border border-amber/15 rounded-lg">
                      <span className="text-xs">⚠️</span>
                      <span className="text-xs text-amber/80">{alert}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => toast.info("Opening product details…")}
                  className="flex-1 py-2 bg-amber/15 border border-amber/25 text-amber text-xs font-semibold rounded-xl hover:bg-amber/25 transition-all"
                >
                  Open Product
                </button>
                <button
                  onClick={() => toast.info("Asking Aria for a diagnosis…")}
                  className="flex-1 py-2 bg-white/5 border border-white/10 text-white/60 text-xs font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  Ask Aria
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Emergency lock ───────────────────────────────────────────────────────────
function EmergencyLock() {
  const [locked, setLocked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handlePress = () => {
    if (!locked) {
      setConfirming(true);
    } else {
      setLocked(false);
      setConfirming(false);
                    toast.success("Emergency lock lifted. All connections restored.");
    }
  };

  const handleConfirm = () => {
    setLocked(true);
    setConfirming(false);
              toast.error("Emergency lock engaged. All external connections paused.", {
      duration: 5000,
    });
  };

  return (
    <div className="px-4 mt-4 mb-4">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Emergency Controls</h3>
          <p className="text-xs text-white/30 mb-3">Use this if your account is compromised or you need to pause all activity immediately.</p>
      <div className={cn(
        "rounded-2xl border p-4 transition-all duration-300",
        locked ? "bg-red-500/10 border-red-500/30" : "glass-dark border-white/10"
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            locked ? "bg-red-500/20 border border-red-500/30" : "bg-white/8 border border-white/12"
          )}>
            <svg viewBox="0 0 24 24" fill="none" className={cn("w-5 h-5", locked ? "text-red-400" : "text-white/60")} stroke="currentColor" strokeWidth={2}>
              <path d="M18.364 5.636l-1.414 1.414M5.636 18.364l-1.414 1.414M12 2v2M12 20v2M2 12h2M20 12h2M5.636 5.636l1.414 1.414M18.364 18.364l-1.414-1.414" strokeLinecap="round" />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </div>
          <div>
            <p className={cn("text-sm font-bold", locked ? "text-red-400" : "text-white")}>
              {locked ? "🔴 Emergency Lock Active" : "Emergency Lock"}
            </p>
            <p className="text-xs text-white/50">
              {locked
                ? "All external connections suspended. Tap to unlock."
                : "Instantly pause all external connections and API calls."}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-red-400 font-semibold text-center">
                ⚠️ This will suspend all active connections. Confirm?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/60 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl"
                >
                  Confirm Lock
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePress}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-bold border transition-all",
                locked
                  ? "bg-green-500/15 border-green-500/25 text-green-400 hover:bg-green-500/25"
                  : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              )}
            >
              {locked ? "🔓 Lift Emergency Lock" : "🔴 Engage Emergency Lock"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ControlTower() {
  const hasWarnings = PRODUCTS.some((p) => p.status !== "all-good");

  return (
    <div className="flex flex-col min-h-full bg-mission">
      <MissionHeader
        title="Health"
        subtitle="Your product health overview"
        clearanceStatus={hasWarnings ? "needs-attention" : "all-good"}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar content-scroll">

        {/* Fleet overview strip */}
        <div className="mx-4 mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "All Good", count: PRODUCTS.filter((p) => p.status === "all-good").length, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
            { label: "Needs Attention", count: PRODUCTS.filter((p) => p.status === "needs-attention").length, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "Action Required", count: PRODUCTS.filter((p) => p.status === "action-required").length, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-xl p-3 text-center border", item.bg)}>
              <p className={cn("text-xl font-black", item.color)}>{item.count}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Product health cards */}
        <div className="px-4 mt-4 space-y-3">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Product Health</h3>
          {PRODUCTS.map((product, i) => (
            <ProductHealthCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {/* Emergency lock */}
        <EmergencyLock />

      </div>
    </div>
  );
}
