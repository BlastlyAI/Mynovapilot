import { motion } from "framer-motion";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Redirect to="/dashboard" />;

  return (
    <div className="min-h-dvh bg-mission bg-starfield flex flex-col items-center justify-center px-6 py-12">
      {/* Logo mark */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center mb-10"
      >
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-5 shadow-2xl shadow-amber/30"
        >
          <span className="text-4xl">🚀</span>
        </motion.div>
        <h1 className="text-2xl font-black text-white mb-1">MyNovaPilot</h1>
        <p className="text-sm text-white/50">Build and launch your digital products</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm glass-dark rounded-3xl border border-white/12 p-6"
      >
        <h2 className="text-lg font-bold text-white mb-1 text-center">Welcome Back</h2>
        <p className="text-sm text-white/50 text-center mb-6">
          Sign in to access your Dashboard and manage your products.
        </p>

        {/* Sign in button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => startLogin()}
          className="w-full py-4 bg-amber text-[#1a274d] font-bold text-sm rounded-2xl shadow-lg shadow-amber/25 hover:bg-amber/90 transition-all mb-4"
        >
          🚀 Sign In with Manus
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Demo mode */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => startLogin()}
          className="w-full py-3.5 bg-white/5 border border-white/12 text-white/70 font-semibold text-sm rounded-2xl hover:bg-white/8 hover:text-white transition-all"
        >
          Explore as Guest
        </motion.button>

        <p className="text-xs text-white/30 text-center mt-4 leading-relaxed">
          By signing in you agree to the Terms. Your ideas and data stay private — always.
        </p>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-3 gap-3 w-full max-w-sm"
      >
        {[
          { icon: "⚡", label: "Nova Spark", sub: "AI idea scoring" },
          { icon: "🔒", label: "Secure Vault", sub: "Keys stay yours" },
          { icon: "🚀", label: "Go Live", sub: "Launch products" },
        ].map((item) => (
          <div key={item.label} className="text-center p-3 bg-white/4 rounded-2xl border border-white/8">
            <div className="text-xl mb-1">{item.icon}</div>
            <p className="text-[10px] font-bold text-white/70">{item.label}</p>
            <p className="text-[9px] text-white/35 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
