import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import AriaCopilot from "./AriaCopilot";

// ── Navigation tabs — Language v2 ────────────────────────────────────────────
const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    href: "/dashboard",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
        <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round" />
      </svg>
    ),
    emoji: "🌍",
  },
  {
    id: "new-product",
    label: "New Product",
    shortLabel: "New",
    href: "/new-product",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path d="M12 2C12 2 7 8 7 14a5 5 0 0010 0C17 8 12 2 12 2z" strokeLinejoin="round" />
        <circle cx="12" cy="14" r="2" />
        <path d="M9 20l-2 3M15 20l2 3" strokeLinecap="round" />
      </svg>
    ),
    emoji: "🚀",
  },
  {
    id: "build",
    label: "Build",
    shortLabel: "Build",
    href: "/build",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17.5 14v7M14 17.5h7" strokeLinecap="round" />
      </svg>
    ),
    emoji: "🔧",
  },
  {
    id: "connections",
    label: "Connections",
    shortLabel: "Connect",
    href: "/connections",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    emoji: "🔒",
  },
  {
    id: "health",
    label: "Health",
    shortLabel: "Health",
    href: "/health",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path d="M3 20h18M8 20V10M16 20V10M5 10h14M8 10l4-7 4 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    emoji: "📊",
  },
];

interface MissionLayoutProps {
  children: React.ReactNode;
}

export default function MissionLayout({ children }: MissionLayoutProps) {
  const [location] = useLocation();

  const activeTab = TABS.find((t) =>
    t.href === "/dashboard" ? location === "/dashboard" : location.startsWith(t.href)
  ) ?? TABS[0];

  return (
    <div className="flex min-h-dvh bg-mission text-white">
      {/* ── Desktop / Tablet Sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 min-h-dvh bg-navy-deep border-r border-white/10 fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-amber flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🚀</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">MyNovaPilot</p>
            <p className="text-xs text-white/50 mt-0.5">Your product dashboard</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map((tab) => {
            const isActive = tab.href === "/dashboard" ? location === "/dashboard" : location.startsWith(tab.href);
            return (
              <Link key={tab.id} href={tab.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                    isActive
                      ? "bg-amber/15 text-amber border border-amber/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-amber"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — Settings */}
        <div className="px-4 py-4 border-t border-white/10">
          <Link href="/settings">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 cursor-pointer transition-all">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-medium">Settings</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-dvh">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Aria Co-Pilot Bubble (always above tab bar) ────────────────── */}
      <AriaCopilot screenName={activeTab.label} />

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10 tab-bar-safe">
        <div className="flex items-center justify-around px-1 pt-2">
          {TABS.map((tab) => {
            const isActive = tab.href === "/dashboard" ? location === "/dashboard" : location.startsWith(tab.href);
            return (
              <Link key={tab.id} href={tab.href}>
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 cursor-pointer relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={cn(
                      "transition-all duration-200",
                      isActive ? "text-amber" : "text-white/40"
                    )}
                  >
                    {tab.icon(isActive)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-none transition-all duration-200",
                      isActive ? "text-amber" : "text-white/40"
                    )}
                  >
                    {tab.shortLabel}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
