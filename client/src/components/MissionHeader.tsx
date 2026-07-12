import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MissionHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  clearanceStatus?: "all-good" | "needs-attention" | "action-required" | "locked";
  rightAction?: React.ReactNode;
  className?: string;
}

// ── Status indicator config — Language v2 ────────────────────────────────────
const STATUS_CONFIG = {
  "all-good": {
    label: "All Good",
    color: "text-green-400",
    dot: "bg-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  "needs-attention": {
    label: "Needs Attention",
    color: "text-amber-400",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  "action-required": {
    label: "Action Required",
    color: "text-red-400",
    dot: "bg-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  "locked": {
    label: "Locked",
    color: "text-red-400",
    dot: "bg-red-400 animate-pulse",
    bg: "bg-red-500/15 border-red-500/30",
  },
};

export default function MissionHeader({
  title,
  subtitle,
  showLogo = false,
  clearanceStatus,
  rightAction,
  className,
}: MissionHeaderProps) {
  const status = clearanceStatus ? STATUS_CONFIG[clearanceStatus] : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 glass-dark border-b border-white/10",
        "px-4 py-3 md:px-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo or Title */}
        <div className="flex items-center gap-3 min-w-0">
          {showLogo && (
            <div className="w-8 h-8 rounded-lg bg-amber/20 border border-amber/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🚀</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-white/50 leading-tight mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Status badge + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                status.bg,
                status.color
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
              <span className="hidden sm:inline">{status.label}</span>
            </motion.div>
          )}
          {rightAction}
          {/* Settings avatar */}
          <Link href="/settings">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/15 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/70" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
}
