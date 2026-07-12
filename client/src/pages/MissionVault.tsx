import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

// ── Entry type config ─────────────────────────────────────────────────────────
const ENTRY_TYPES = [
  { value: "idea", label: "Idea", emoji: "💡", color: "from-amber-500/20 to-amber-600/10 border-amber-500/25 text-amber-400" },
  { value: "password", label: "Password", emoji: "🔑", color: "from-red-500/20 to-red-600/10 border-red-500/25 text-red-400" },
  { value: "api-key", label: "API Key", emoji: "🔐", color: "from-purple-500/20 to-purple-600/10 border-purple-500/25 text-purple-400" },
  { value: "document", label: "Document", emoji: "📄", color: "from-blue-500/20 to-blue-600/10 border-blue-500/25 text-blue-400" },
  { value: "note", label: "Note", emoji: "📝", color: "from-teal-500/20 to-teal-600/10 border-teal-500/25 text-teal-400" },
  { value: "contract", label: "Contract", emoji: "📋", color: "from-green-500/20 to-green-600/10 border-green-500/25 text-green-400" },
] as const;

type EntryType = (typeof ENTRY_TYPES)[number]["value"];

function getTypeConfig(type: string) {
  return ENTRY_TYPES.find((t) => t.value === type) ?? ENTRY_TYPES[4];
}

// ── PIN Entry Modal ───────────────────────────────────────────────────────────
function PinModal({
  mode,
  onSuccess,
  onCancel,
}: {
  mode: "set" | "verify";
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const setPinMutation = trpc.vault.setPin.useMutation();
  const verifyPinMutation = trpc.vault.verifyPin.useMutation();

  const handleSubmit = async () => {
    setError("");
    if (mode === "set") {
      if (pin.length < 4) { setError("PIN must be at least 4 digits."); return; }
      if (pin !== confirmPin) { setError("PINs do not match."); return; }
      try {
        await setPinMutation.mutateAsync({ pin });
        toast.success("Vault PIN set successfully");
        onSuccess();
      } catch {
        setError("Failed to set PIN. Please try again.");
      }
    } else {
      try {
        const result = await verifyPinMutation.mutateAsync({ pin });
        if (result.valid) {
          onSuccess();
        } else {
          setError("Incorrect PIN. Please try again.");
          setPin("");
        }
      } catch {
        setError("Failed to verify PIN. Please try again.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "linear-gradient(135deg, #1e2d5a 0%, #141e3a 100%)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/25 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            {mode === "set" ? "Set Vault PIN" : "Unlock Vault"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {mode === "set"
              ? "Choose a 4–8 digit PIN to protect your vault"
              : "Enter your PIN to access your vault"}
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter PIN"
            className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-white text-center text-xl tracking-widest placeholder-white/30 focus:outline-none focus:border-teal-500/50 transition-colors"
          />
          {mode === "set" && (
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Confirm PIN"
              className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-white text-center text-xl tracking-widest placeholder-white/30 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          )}
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/12 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={setPinMutation.isPending || verifyPinMutation.isPending}
            className="flex-1 py-3 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-400 transition-all disabled:opacity-60"
          >
            {setPinMutation.isPending || verifyPinMutation.isPending ? "..." : mode === "set" ? "Set PIN" : "Unlock"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Entry Form Modal ──────────────────────────────────────────────────────────
function EntryFormModal({
  editEntry,
  onClose,
  onSaved,
}: {
  editEntry?: { id: number; title: string; entryType: string; tags: string | null; content: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(editEntry?.title ?? "");
  const [entryType, setEntryType] = useState<EntryType>((editEntry?.entryType as EntryType) ?? "note");
  const [content, setContent] = useState(editEntry?.content ?? "");
  const [tags, setTags] = useState(editEntry?.tags ?? "");

  const createMutation = trpc.vault.create.useMutation();
  const updateMutation = trpc.vault.update.useMutation();
  const utils = trpc.useUtils();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!content.trim()) { toast.error("Please enter some content"); return; }

    try {
      if (editEntry) {
        await updateMutation.mutateAsync({
          id: editEntry.id,
          title: title.trim(),
          entryType,
          content,
          tags: tags.trim() || undefined,
        });
        toast.success("Entry updated");
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          entryType,
          content,
          tags: tags.trim() || undefined,
        });
        toast.success("Entry saved to vault");
      }
      utils.vault.list.invalidate();
      onSaved();
    } catch {
      toast.error("Failed to save entry");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, #1e2d5a 0%, #141e3a 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          maxHeight: "90dvh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base font-bold text-white">{editEntry ? "Edit Entry" : "New Vault Entry"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">✕</button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stripe API Key, Business Plan v2"
              className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {ENTRY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setEntryType(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-2xl border text-xs font-semibold transition-all",
                    entryType === type.value
                      ? `bg-gradient-to-br ${type.color} brightness-125`
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8"
                  )}
                >
                  <span className="text-lg">{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">
              Content <span className="text-teal-400 normal-case font-normal">(encrypted)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                entryType === "password" ? "Enter password or passphrase…"
                : entryType === "api-key" ? "sk_live_… or paste your API key"
                : entryType === "idea" ? "Describe your idea in detail…"
                : entryType === "contract" ? "Paste contract text or key terms…"
                : "Enter your content here…"
              }
              rows={6}
              className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-teal-500/50 transition-colors font-mono"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">Tags <span className="normal-case font-normal">(optional, comma-separated)</span></label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. stripe, production, billing"
              className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          {/* Encryption notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <span className="text-teal-400 text-sm">🔒</span>
            <p className="text-xs text-teal-400/80">Your content is encrypted with AES-256-GCM before being stored. Only you can read it.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/12 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-3 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-400 transition-all disabled:opacity-60"
          >
            {isLoading ? "Saving…" : editEntry ? "Save Changes" : "Save to Vault"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── View Entry Modal ──────────────────────────────────────────────────────────
function ViewEntryModal({
  entryId,
  onClose,
  onEdit,
  onDeleted,
}: {
  entryId: number;
  onClose: () => void;
  onEdit: (entry: { id: number; title: string; entryType: string; tags: string | null; content: string }) => void;
  onDeleted: () => void;
}) {
  const [showContent, setShowContent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: entry, isLoading } = trpc.vault.get.useQuery({ id: entryId });
  const deleteMutation = trpc.vault.delete.useMutation();
  const utils = trpc.useUtils();

  const typeConfig = entry ? getTypeConfig(entry.entryType) : null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: entryId });
      utils.vault.list.invalidate();
      toast.success("Entry deleted");
      onDeleted();
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, #1e2d5a 0%, #141e3a 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          maxHeight: "85dvh",
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {typeConfig && (
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br border", typeConfig.color)}>
                <span className="text-base">{typeConfig.emoji}</span>
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-white">{entry?.title ?? "Loading…"}</h2>
              {typeConfig && <p className="text-xs text-white/40">{typeConfig.label}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal-500/40 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : entry ? (
            <>
              {/* Tags */}
              {entry.tags && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.split(",").map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs text-white/50">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Content</label>
                  <button
                    onClick={() => setShowContent((v) => !v)}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    {showContent ? "🙈 Hide" : "👁 Reveal"}
                  </button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative">
                  {showContent ? (
                    <pre className="text-sm text-white/90 font-mono whitespace-pre-wrap break-all">{entry.content}</pre>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <span className="text-white/30 font-mono text-sm tracking-widest">{"•".repeat(Math.min((entry.content ?? "").length, 24))}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="text-xs text-white/30 space-y-1">
                <p>Created: {new Date(entry.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(entry.updatedAt).toLocaleString()}</p>
              </div>

              {/* Encryption notice */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-teal-400 text-sm">🔒</span>
                <p className="text-xs text-teal-400/80">This content is stored encrypted. It was decrypted only for this view.</p>
              </div>
            </>
          ) : null}
        </div>

        {entry && (
          <div className="flex gap-3 px-5 py-4 border-t border-white/10 flex-shrink-0">
            {confirmDelete ? (
              <>
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/15 text-white/70 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition-all disabled:opacity-60"
                >
                  {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="py-3 px-4 rounded-2xl bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all"
                >
                  🗑
                </button>
                <button
                  onClick={() => onEdit({ id: entry.id, title: entry.title, entryType: entry.entryType, tags: entry.tags, content: entry.content ?? "" })}
                  className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/12 transition-all"
                >
                  Edit
                </button>
                <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-400 transition-all">
                  Done
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Mission Vault Page ───────────────────────────────────────────────────
export default function MissionVault() {
  const { isAuthenticated } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "verify">("verify");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewEntryId, setViewEntryId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<{ id: number; title: string; entryType: string; tags: string | null; content: string } | null>(null);
  const [filterType, setFilterType] = useState<EntryType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: hasPinData } = trpc.vault.hasPin.useQuery(undefined, { enabled: isAuthenticated });
  const { data: entries, isLoading: entriesLoading } = trpc.vault.list.useQuery(undefined, {
    enabled: isAuthenticated && isUnlocked,
  });

  const handleUnlockPress = () => {
    if (!isAuthenticated) return;
    if (hasPinData?.hasPin) {
      setPinMode("verify");
    } else {
      setPinMode("set");
    }
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setIsUnlocked(true);
  };

  const handleLock = () => {
    setIsUnlocked(false);
  };

  const handleEditFromView = (entry: { id: number; title: string; entryType: string; tags: string | null; content: string }) => {
    setViewEntryId(null);
    setEditEntry(entry);
    setShowAddModal(true);
  };

  const filteredEntries = entries?.filter((e) => {
    const matchesType = filterType === "all" || e.entryType === filterType;
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.tags ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) ?? [];

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/25 flex items-center justify-center mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Mission Vault</h2>
        <p className="text-sm text-white/50 mb-6 max-w-xs">Sign in to access your encrypted secure storage for API keys, passwords, documents, and ideas.</p>
        <button
          onClick={() => startLogin()}
          className="px-6 py-3 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-400 transition-all"
        >
          Sign In to Access Vault
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-32 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Mission Vault</h1>
          <p className="text-xs text-white/40 mt-0.5">Encrypted secure storage</p>
        </div>
        {isUnlocked && (
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/8 border border-white/15 text-white/70 text-xs font-semibold hover:bg-white/12 transition-all"
          >
            🔒 Lock Vault
          </button>
        )}
      </div>

      {/* Locked state */}
      {!isUnlocked ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl bg-teal-500/20 border border-teal-500/25 flex items-center justify-center mb-6"
          >
            <span className="text-5xl">🔒</span>
          </motion.div>
          <h2 className="text-lg font-bold text-white mb-2">Vault is Locked</h2>
          <p className="text-sm text-white/50 mb-8 max-w-xs">
            Your vault is protected with AES-256-GCM encryption. Enter your PIN to access your secure entries.
          </p>
          <button
            onClick={handleUnlockPress}
            className="px-8 py-4 rounded-2xl bg-teal-500 text-white font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
          >
            🔓 Unlock Vault
          </button>

          {/* Security info */}
          <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-xs">
            {[
              { emoji: "🔐", label: "AES-256-GCM" },
              { emoji: "🛡️", label: "PIN Protected" },
              { emoji: "☁️", label: "Encrypted at Rest" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/5 border border-white/8">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-[10px] text-white/40 text-center leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        /* Unlocked state */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Search + Add */}
          <div className="flex gap-2 mb-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries…"
              className="flex-1 bg-white/8 border border-white/15 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
            <button
              onClick={() => { setEditEntry(null); setShowAddModal(true); }}
              className="px-4 py-2.5 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-400 transition-all flex-shrink-0"
            >
              + Add
            </button>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                filterType === "all"
                  ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              )}
            >
              All
            </button>
            {ENTRY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  filterType === type.value
                    ? `bg-gradient-to-r ${type.color}`
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                )}
              >
                <span>{type.emoji}</span>
                {type.label}
              </button>
            ))}
          </div>

          {/* Entry count */}
          <p className="text-xs text-white/30 mb-3">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
            {filterType !== "all" ? ` · ${getTypeConfig(filterType).label}` : ""}
          </p>

          {/* Entries list */}
          {entriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm font-semibold text-white/60 mb-1">
                {searchQuery ? "No entries match your search" : "No entries yet"}
              </p>
              <p className="text-xs text-white/30">
                {searchQuery ? "Try a different search term" : "Tap + Add to store your first secure entry"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredEntries.map((entry, i) => {
                  const typeConfig = getTypeConfig(entry.entryType);
                  return (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setViewEntryId(entry.id)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-left"
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br border flex-shrink-0", typeConfig.color)}>
                        <span className="text-lg">{typeConfig.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-xs font-medium", typeConfig.color.split(" ").pop())}>{typeConfig.label}</span>
                          {entry.tags && (
                            <span className="text-xs text-white/30 truncate">· {entry.tags}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.isLocked && <span className="text-xs text-white/30">🔒</span>}
                        <span className="text-white/20 text-xs">
                          {new Date(entry.updatedAt).toLocaleDateString()}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/20" stroke="currentColor" strokeWidth={2}>
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showPinModal && (
          <PinModal
            mode={pinMode}
            onSuccess={handlePinSuccess}
            onCancel={() => setShowPinModal(false)}
          />
        )}
        {showAddModal && (
          <EntryFormModal
            editEntry={editEntry ?? undefined}
            onClose={() => { setShowAddModal(false); setEditEntry(null); }}
            onSaved={() => { setShowAddModal(false); setEditEntry(null); }}
          />
        )}
        {viewEntryId !== null && (
          <ViewEntryModal
            entryId={viewEntryId}
            onClose={() => setViewEntryId(null)}
            onEdit={handleEditFromView}
            onDeleted={() => setViewEntryId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
