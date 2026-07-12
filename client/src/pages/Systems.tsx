import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MissionHeader from "@/components/MissionHeader";
import { toast } from "sonner";

type ConnectionStatus = "connected" | "warning" | "disconnected" | "pending";

interface SystemConnection {
  id: string;
  name: string;
  description: string;
  status: ConnectionStatus;
  icon: string;
  lastChecked: string;
}

const CONNECTIONS: SystemConnection[] = [
  {
    id: "domain",
    name: "Domain Registration",
    description: "tradeflowpro.com",
    status: "connected",
    icon: "🌐",
    lastChecked: "2 min ago",
  },
  {
    id: "payment",
    name: "Payment Gateway",
    description: "Stripe — Test Mode",
    status: "warning",
    icon: "💳",
    lastChecked: "5 min ago",
  },
  {
    id: "email",
    name: "Email Service",
    description: "Not configured",
    status: "disconnected",
    icon: "📧",
    lastChecked: "Never",
  },
  {
    id: "hosting",
    name: "Hosting Platform",
    description: "Manus Cloud — Active",
    status: "connected",
    icon: "☁️",
    lastChecked: "1 min ago",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Not configured",
    status: "pending",
    icon: "📊",
    lastChecked: "Never",
  },
  {
    id: "auth",
    name: "Authentication",
    description: "Manus OAuth — Active",
    status: "connected",
    icon: "🔑",
    lastChecked: "Just now",
  },
];

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; dot: string; bg: string }> = {
  connected: {
    label: "Connected",
    color: "text-green-400",
    dot: "bg-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  warning: {
    label: "Warning",
    color: "text-amber-400",
    dot: "bg-amber-400 animate-pulse",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  disconnected: {
    label: "Disconnected",
    color: "text-red-400",
    dot: "bg-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  pending: {
    label: "Pending",
    color: "text-blue-400",
    dot: "bg-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

// ── Clearance gauge ──────────────────────────────────────────────────────────
function ClearanceGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "All Systems Ready" : score >= 50 ? "Some Setup Needed" : "Setup Required";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-4 mt-4 glass-dark rounded-2xl border border-white/10 p-5 flex items-center gap-5"
    >
      {/* Gauge */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}%</span>
          <span className="text-[9px] text-white/40 leading-none mt-0.5">Setup</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-white mb-1">{label}</h3>
        <p className="text-xs text-white/50 leading-relaxed mb-3">
          {        score >= 80
            ? "All connections are active. Your product is ready to grow."
            : score >= 50
            ? "Some connections need attention before you can go live."
            : "Critical connections are missing. Set these up to proceed."}
        </p>
        <div className="flex gap-2">
          <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            {CONNECTIONS.filter((c) => c.status === "connected").length} Connected
          </span>
          <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            {CONNECTIONS.filter((c) => c.status === "disconnected").length} Offline
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Connection row ───────────────────────────────────────────────────────────
function ConnectionRow({ connection, index }: { connection: SystemConnection; index: number }) {
  const cfg = STATUS_CONFIG[connection.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-3 p-3.5 bg-white/4 hover:bg-white/7 border border-white/8 rounded-xl transition-all cursor-pointer"
      onClick={() => toast.info(`${connection.name}: ${connection.description}`)}
    >
      <span className="text-xl flex-shrink-0">{connection.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{connection.name}</p>
        <p className="text-xs text-white/40 mt-0.5 truncate">{connection.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
          {cfg.label}
        </span>
        <span className="text-[9px] text-white/25">{connection.lastChecked}</span>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Systems() {
  const connected = CONNECTIONS.filter((c) => c.status === "connected").length;
  const clearanceScore = Math.round((connected / CONNECTIONS.length) * 100);
  const [vaultLocked, setVaultLocked] = useState(true);

  return (
    <div className="flex flex-col min-h-full bg-mission">
      <MissionHeader
        title="Connections"
        subtitle="Your product infrastructure"
        clearanceStatus={clearanceScore >= 80 ? "all-good" : "needs-attention"}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar content-scroll">

        {/* Setup gauge */}
        <ClearanceGauge score={clearanceScore} />

        {/* Connections list */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Setup Checklist</h3>
            <button
              onClick={() => toast.info("Running diagnostics…")}
              className="text-xs text-amber font-semibold"
            >
              Run Check
            </button>
          </div>
          <div className="space-y-2">
            {CONNECTIONS.map((conn, i) => (
              <ConnectionRow key={conn.id} connection={conn} index={i} />
            ))}
          </div>
        </div>

        {/* Secure Vault */}
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Secure Vault</h3>
            <span className="text-[10px] font-bold text-amber bg-amber/10 border border-amber/20 px-1.5 py-0.5 rounded-full">
              Secure
            </span>
          </div>

          <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden">
            {/* Vault header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-teal-400" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">API Keys & Credentials</p>
                <p className="text-xs text-white/50">Encrypted at rest. Never exposed to AI engines.</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setVaultLocked(!vaultLocked)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  vaultLocked
                    ? "bg-teal-500/15 border-teal-500/25 text-teal-400"
                    : "bg-red-500/15 border-red-500/25 text-red-400"
                )}
              >
                {vaultLocked ? "🔒 Locked" : "🔓 Open"}
              </motion.button>
            </div>

            {/* Vault CTA — links to full Mission Vault page */}
            <div className="p-4">
              <p className="text-xs text-white/50 mb-3 leading-relaxed">
                Store API keys, passwords, contracts, and ideas — all encrypted with AES-256-GCM. Only you can read them.
              </p>
              <a
                href="/vault"
                className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all"
              >
                <span>Open Mission Vault</span>
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="px-4 mt-4 mb-4">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Billing</h3>
          <div className="glass-dark rounded-2xl border border-white/10 p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: "Monthly Costs", value: "$47/mo", icon: "📉", color: "text-red-400" },
                { label: "Monthly Revenue", value: "$0", icon: "📈", color: "text-green-400" },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-xl p-3 border border-white/8">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] text-white/40">{item.label}</span>
                  </div>
                  <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-amber/8 border border-amber/15 rounded-xl">
              <p className="text-xs text-amber/80 font-medium">
                💡 Connect your payment gateway to start tracking revenue automatically.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
