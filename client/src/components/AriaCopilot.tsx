import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Nova Academy topics ──────────────────────────────────────────────────────
const ACADEMY_TOPICS = [
  {
    id: "mission-brief",
    emoji: "📋",
    title: "How MyNovaPilot works — from idea to live product",
    description: "The complete journey from your first idea to a live product.",
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
    question: "Can you explain how MyNovaPilot works from idea to live product?",
  },
  {
    id: "nova-spark",
    emoji: "⚡",
    title: "Your health score — what each number means",
    description: "How the free validation engine works and what your score means.",
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
    question: "What does my Nova Spark score mean and how is it calculated?",
  },
  {
    id: "systems-check",
    emoji: "🔒",
    title: "Your credentials — why they never leave your account",
    description: "Why your API keys and credentials are always safe.",
    color: "from-teal-500/20 to-teal-600/10 border-teal-500/20",
    question: "How does MyNovaPilot keep my API keys and credentials secure?",
  },
  {
    id: "launch-sequence",
    emoji: "🚀",
    title: "Going live — what actually happens when you launch",
    description: "Nine stages from Product Brief to Go Live — what happens at each.",
    color: "from-green-500/20 to-green-600/10 border-green-500/20",
    question: "Walk me through the 9 stages of the Build checklist and what happens at each one.",
  },
  {
    id: "flight-recorder",
    emoji: "📡",
    title: "How AI builds your product — what happens behind the scenes",
    description: "What Aria actually does when she builds and tests your product.",
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
    question: "What does Aria actually do when she builds and tests my product?",
  },
  {
    id: "revenue-orbit",
    emoji: "💰",
    title: "Understanding your security — what keeps your product safe",
    description: "What the Secure Vault protects and how to read your security score.",
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
    question: "What does the Mission Vault protect and how do I read my security score?",
  },
  {
    id: "mission-leases",
    emoji: "📅",
    title: "When something goes wrong — what to do, step by step",
    description: "Calm, clear guidance for every type of issue you might encounter.",
    color: "from-rose-500/20 to-rose-600/10 border-rose-500/20",
    question: "What should I do when something goes wrong with my product?",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

interface AriaCopilotProps {
  screenName?: string;
  screenDescription?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AriaCopilot({
  screenName = "Dashboard",
  screenDescription,
}: AriaCopilotProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"actions" | "chat" | "academy">("actions");
  const [isPulsing, setIsPulsing] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const chatMutation = trpc.aria.chat.useMutation();
  const explainMutation = trpc.aria.explain.useMutation();
  const optionsMutation = trpc.aria.options.useMutation();

  const isLoading = chatMutation.isPending || explainMutation.isPending || optionsMutation.isPending;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsPulsing(false);
  };

  const addMessage = (role: "user" | "assistant", content: string, id?: string): string => {
    const msgId = id ?? `${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, { id: msgId, role, content }]);
    return msgId;
  };

  const setLoadingMessage = (id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, isLoading: false } : m))
    );
  };

  const sendChat = async (userText: string) => {
    if (!userText.trim() || isLoading) return;
    if (!isAuthenticated) {
      addMessage("assistant", "Please sign in to chat with Aria.");
      return;
    }

    const userMsg = userText.trim();
    addMessage("user", userMsg);
    setInputValue("");

    // Add loading placeholder
    const loadingId = `loading-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: "assistant", content: "", isLoading: true },
    ]);

    try {
      // Build history (exclude the loading placeholder)
      const history = messages
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: userMsg });

      const result = await chatMutation.mutateAsync({
        messages: history,
        screenContext: `${screenName}${screenDescription ? `: ${screenDescription}` : ""}`,
      });

      setLoadingMessage(loadingId, result.content);
    } catch {
      setLoadingMessage(loadingId, "Sorry, I had trouble connecting. Please try again.");
    }
  };

  const handleExplain = async () => {
    if (!isAuthenticated) return;
    setActiveTab("chat");

    const loadingId = `loading-${Date.now()}`;
    addMessage("user", `What does the ${screenName} screen mean?`);
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: "assistant", content: "", isLoading: true },
    ]);

    try {
      const result = await explainMutation.mutateAsync({
        screenName,
        screenDescription,
      });
      setLoadingMessage(loadingId, result.content);
    } catch {
      setLoadingMessage(loadingId, "Sorry, I had trouble explaining this screen. Please try again.");
    }
  };

  const handleOptions = async () => {
    if (!isAuthenticated) return;
    setActiveTab("chat");

    const loadingId = `loading-${Date.now()}`;
    addMessage("user", `What are my options on the ${screenName} screen?`);
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: "assistant", content: "", isLoading: true },
    ]);

    try {
      const result = await optionsMutation.mutateAsync({ screenName });
      setLoadingMessage(loadingId, result.content);
    } catch {
      setLoadingMessage(loadingId, "Sorry, I had trouble loading your options. Please try again.");
    }
  };

  const handleTopicTap = async (topic: (typeof ACADEMY_TOPICS)[0]) => {
    setActiveTab("chat");
    await sendChat(topic.question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat(inputValue);
    }
  };

  return (
    <>
      {/* ── Floating Aria Bubble ─────────────────────────────────────────── */}
      <motion.button
        onClick={handleOpen}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "fixed right-4 z-50 w-14 h-14 rounded-full",
          "bg-gradient-to-br from-amber-400 to-amber-600",
          "flex items-center justify-center",
          "shadow-lg shadow-amber-500/30",
          "md:bottom-8 bottom-[5.5rem]"
        )}
        aria-label="Open Aria co-pilot"
      >
        {isPulsing && (
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span className="text-2xl relative z-10">✦</span>
      </motion.button>

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{
                background: "linear-gradient(180deg, #1e2d5a 0%, #141e3a 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderBottom: "none",
                maxHeight: "88dvh",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <span className="text-lg">✦</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aria — Your Co-Pilot</h3>
                  <p className="text-xs text-white/50">AI-powered product guidance</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 mx-5 mt-3 mb-1 p-1 bg-white/5 rounded-xl flex-shrink-0">
                {(["actions", "chat", "academy"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                      activeTab === tab
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/25"
                        : "text-white/50 hover:text-white"
                    )}
                  >
                    {tab === "actions" ? "🎯 Actions" : tab === "chat" ? "💬 Chat" : "🎓 Academy"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <AnimatePresence mode="wait">
                  {/* ── Actions Tab ─────────────────────────────────────── */}
                  {activeTab === "actions" && (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-y-auto px-5 pb-8 pt-3 space-y-3"
                    >
                      <p className="text-xs text-white/40 text-center pb-1">
                        Currently on: <span className="text-white/60 font-medium">{screenName}</span>
                      </p>

                      {/* Ask Aria */}
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab("chat")}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border bg-amber-500/15 border-amber-500/25 text-amber-400 text-left hover:brightness-110 transition-all"
                      >
                        <span className="text-2xl flex-shrink-0">💬</span>
                        <div>
                          <p className="text-sm font-bold leading-tight">Ask Aria anything</p>
                          <p className="text-xs opacity-70 mt-0.5">Get answers about your product</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-auto flex-shrink-0 opacity-50" stroke="currentColor" strokeWidth={2}>
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.button>

                      {/* Explain */}
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleExplain}
                        disabled={isLoading}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border bg-teal-500/15 border-teal-500/25 text-teal-400 text-left hover:brightness-110 transition-all disabled:opacity-60"
                      >
                        <span className="text-2xl flex-shrink-0">🔍</span>
                        <div>
                          <p className="text-sm font-bold leading-tight">What does this mean?</p>
                          <p className="text-xs opacity-70 mt-0.5">Aria will explain what you're looking at</p>
                        </div>
                        {isLoading && explainMutation.isPending ? (
                          <div className="ml-auto w-4 h-4 border-2 border-teal-400/40 border-t-teal-400 rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-auto flex-shrink-0 opacity-50" stroke="currentColor" strokeWidth={2}>
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </motion.button>

                      {/* Options */}
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleOptions}
                        disabled={isLoading}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border bg-blue-500/15 border-blue-500/25 text-blue-400 text-left hover:brightness-110 transition-all disabled:opacity-60"
                      >
                        <span className="text-2xl flex-shrink-0">🗺️</span>
                        <div>
                          <p className="text-sm font-bold leading-tight">Show my options</p>
                          <p className="text-xs opacity-70 mt-0.5">What can you do from here?</p>
                        </div>
                        {isLoading && optionsMutation.isPending ? (
                          <div className="ml-auto w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-auto flex-shrink-0 opacity-50" stroke="currentColor" strokeWidth={2}>
                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </motion.button>

                      {!isAuthenticated && (
                        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                          <p className="text-xs text-white/40">Sign in to chat with Aria.</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Chat Tab ─────────────────────────────────────────── */}
                  {activeTab === "chat" && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col flex-1 min-h-0"
                    >
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2 space-y-3 min-h-0">
                        {messages.length === 0 && (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3">
                              <span className="text-xl">✦</span>
                            </div>
                            <p className="text-sm font-bold text-white mb-1">Hi, I'm Aria</p>
                            <p className="text-xs text-white/50">Ask me anything about your products, ideas, or what to do next.</p>
                          </div>
                        )}

                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2",
                              msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {msg.role === "assistant" && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs">✦</span>
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                                msg.role === "user"
                                  ? "bg-amber-500/20 border border-amber-500/25 text-white rounded-br-sm"
                                  : "bg-white/8 border border-white/10 text-white/90 rounded-bl-sm"
                              )}
                            >
                              {msg.isLoading ? (
                                <div className="flex gap-1 items-center py-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              ) : msg.role === "assistant" ? (
                                <div className="prose prose-invert prose-sm max-w-none text-white/90 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ul]:pl-4 [&>li]:mb-1">
                                  <Streamdown>{msg.content}</Streamdown>
                                </div>
                              ) : (
                                <p>{msg.content}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <div className="px-5 pb-6 pt-2 border-t border-white/10 flex-shrink-0">
                        <div className="flex gap-2 items-end">
                          <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Aria anything…"
                            rows={1}
                            disabled={!isAuthenticated || isLoading}
                            className="flex-1 bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-500/50 disabled:opacity-50 transition-colors"
                            style={{ minHeight: "44px", maxHeight: "120px" }}
                          />
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => sendChat(inputValue)}
                            disabled={!inputValue.trim() || isLoading || !isAuthenticated}
                            className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                          >
                            {chatMutation.isPending ? (
                              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </motion.button>
                        </div>
                        {!isAuthenticated && (
                          <p className="text-xs text-white/30 text-center mt-2">Sign in to chat with Aria</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Academy Tab ──────────────────────────────────────── */}
                  {activeTab === "academy" && (
                    <motion.div
                      key="academy"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-y-auto px-5 pb-8 pt-3"
                    >
                      <p className="text-xs text-white/40 text-center mb-3">
                        Learn how to build with MyNovaPilot — tap any topic to ask Aria
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {ACADEMY_TOPICS.map((topic, i) => (
                          <motion.button
                            key={topic.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleTopicTap(topic)}
                            disabled={!isAuthenticated || isLoading}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r text-left transition-all duration-200 hover:brightness-110 disabled:opacity-60",
                              topic.color
                            )}
                          >
                            <span className="text-xl flex-shrink-0">{topic.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white leading-tight">{topic.title}</p>
                              <p className="text-[11px] text-white/50 mt-0.5 leading-tight line-clamp-1">{topic.description}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
