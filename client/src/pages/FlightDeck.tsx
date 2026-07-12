import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import MissionHeader from "@/components/MissionHeader";
import { toast } from "sonner";

const SETTINGS_SECTIONS = [
  {
    title: "Preferences",
    items: [
      { icon: "🔔", label: "Notifications", description: "Alerts for status changes", action: "toggle" },
      { icon: "🌙", label: "Dark Mode", description: "Always on — mission-grade interface", action: "info" },
      { icon: "📱", label: "Install App", description: "Add to home screen for quick access", action: "install" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: "🔑", label: "Secure Vault", description: "Manage your API keys and credentials", action: "nav" },
      { icon: "💳", label: "Nova Pro", description: "Upgrade for full AI product planning", action: "upgrade" },
      { icon: "📋", label: "Activity Log", description: "Full history of all actions taken", action: "nav" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "✦", label: "Ask Aria", description: "Get help from your AI co-pilot", action: "aria" },
      { icon: "📚", label: "Nova Academy", description: "Learn how MyNovaPilot works", action: "nav" },
      { icon: "📡", label: "Platform Status", description: "Platform health and uptime", action: "nav" },
    ],
  },
];

export default function FlightDeck() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-full bg-mission">
      <MissionHeader title="Settings" subtitle="Your account and preferences" />

      <div className="flex-1 overflow-y-auto no-scrollbar content-scroll">

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-4 mt-4 glass-dark rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
              👨‍🚀
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{user?.name ?? "Mission Commander"}</h2>
              <p className="text-xs text-white/50 truncate">{user?.email ?? "commander@mynovapilot.com"}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold text-amber bg-amber/15 border border-amber/25 px-2 py-0.5 rounded-full">
                  Nova Free
                </span>
                <span className="text-[10px] text-white/30">·</span>
                <span className="text-[10px] text-white/40">3 active products</span>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => toast.info("Nova Pro", { description: "Full AI mission planning, competitor intelligence, and revenue modelling. Coming soon." })}
            className="w-full mt-4 py-3 bg-gradient-to-r from-amber/20 to-teal-500/20 border border-amber/25 text-amber font-bold text-sm rounded-xl hover:from-amber/30 hover:to-teal-500/30 transition-all"
          >
            ✦ Upgrade to Nova Pro
          </motion.button>
        </motion.div>

        {/* Settings sections */}
        <div className="px-4 mt-4 space-y-4">
          {SETTINGS_SECTIONS.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
            >
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
                {section.title}
              </h3>
              <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/6">
                {section.items.map((item) => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (item.action === "upgrade") {
                        toast.info("Nova Pro upgrade coming soon.");
                      } else if (item.action === "install") {
                        toast.info("Add to Home Screen", { description: "Use your browser's Share menu → Add to Home Screen." });
                      } else if (item.action === "aria") {
                        toast.info("Ask Aria — tap the ✦ bubble on any screen.");
                      } else {
                        toast.info(`${item.label} — coming soon.`);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-all text-left"
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{item.label}</p>
                      <p className="text-xs text-white/40 mt-0.5 leading-tight">{item.description}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/25 flex-shrink-0" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 mt-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => logout()}
            className="w-full py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm rounded-2xl hover:bg-red-500/15 transition-all"
          >
            Sign Out
          </motion.button>
          <p className="text-[10px] text-white/20 text-center mt-3">
            MyNovaPilot · Built with Manus
          </p>
        </div>

      </div>
    </div>
  );
}
