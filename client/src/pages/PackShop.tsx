import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QuoteCard, RARITY_CONFIG } from "../components/QuoteCard";
import { useToast } from "@/hooks/use-toast";
import type { Quote } from "../../../shared/schema";

interface DailyStatus {
  packsOpened: number;
  packsRemaining: number;
  maxPacks: number;
  nextReset: number;    // Unix ms
  windowStart: number;  // Unix ms
}

interface PackResult {
  cards: Quote[];
  packsOpened: number;
  packsRemaining: number;
  nextReset: number;
}

interface PackLogEntry {
  id: number;
  openedAt: number; // Unix ms
  cards: Quote[];
  rarities: string[];
}

type Phase = "idle" | "opening" | "revealing" | "done";

// ── Countdown hook ────────────────────────────────────────────────────────
function useCountdown(targetMs: number | undefined) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!targetMs) return;
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    remaining,
    formatted: remaining <= 0 ? "00:00:00" : `${pad(h)}:${pad(m)}:${pad(s)}`,
    isExpired: remaining <= 0,
  };
}

// ── Relative time helper ──────────────────────────────────────────────────
function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

// ── Rarity badge ──────────────────────────────────────────────────────────
function RarityDot({ rarity }: { rarity: string }) {
  const cfg = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
  if (!cfg) return null;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: cfg.color }}
      title={rarity}
    />
  );
}

// ── Pack Log Entry ────────────────────────────────────────────────────────
function PackLogRow({ entry, index }: { entry: PackLogEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const rarityCount: Record<string, number> = {};
  entry.rarities.forEach(r => { rarityCount[r] = (rarityCount[r] ?? 0) + 1; });
  const orderedRarities = ["Legendary", "Epic", "Rare", "Uncommon", "Common"];

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Row header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
        data-testid={`pack-log-row-${index}`}
      >
        {/* Pack number badge */}
        <span
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: "rgba(124,58,237,0.3)", color: "#a78bfa" }}
        >
          #{entry.id}
        </span>

        {/* Rarity dots */}
        <div className="flex items-center gap-1.5 flex-1">
          {entry.rarities.map((r, i) => (
            <RarityDot key={i} rarity={r} />
          ))}
        </div>

        {/* Rarity summary chips */}
        <div className="hidden sm:flex items-center gap-1">
          {orderedRarities.filter(r => rarityCount[r]).map(r => {
            const cfg = RARITY_CONFIG[r as keyof typeof RARITY_CONFIG];
            return (
              <span
                key={r}
                className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{
                  background: `${cfg.color}18`,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                }}
              >
                {rarityCount[r]}× {r}
              </span>
            );
          })}
        </div>

        {/* Time */}
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {relativeTime(entry.openedAt)}
        </span>

        {/* Chevron */}
        <svg
          viewBox="0 0 16 16" width="14" height="14"
          className="flex-shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Expanded: show cards */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-white/5 pt-3">
            <div className="grid grid-cols-1 gap-2">
              {entry.cards.map((card, i) => {
                const cfg = RARITY_CONFIG[card.rarity];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg px-3 py-2"
                    style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}20` }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <RarityDot rarity={card.rarity} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 italic leading-snug line-clamp-2">
                        "{card.text}"
                      </p>
                      <p className="text-xs mt-1" style={{ color: cfg.color }}>
                        — {card.author}
                        <span className="text-muted-foreground ml-2">· {card.rarity}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function PackShop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cards, setCards] = useState<Quote[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Quote | null>(null);
  const [showLog, setShowLog] = useState(false);

  const { data: status, refetch: refetchStatus } = useQuery<DailyStatus>({
    queryKey: ["/api/daily-status"],
    queryFn: () => apiRequest("GET", "/api/daily-status").then(r => r.json()),
    refetchInterval: 30_000, // re-check every 30s in case window expired
  });

  const { data: packLog } = useQuery<PackLogEntry[]>({
    queryKey: ["/api/pack-log"],
    queryFn: () => apiRequest("GET", "/api/pack-log").then(r => r.json()),
  });

  const countdown = useCountdown(status?.packsRemaining === 0 ? status?.nextReset : undefined);

  // Auto-refetch when countdown hits zero
  useEffect(() => {
    if (countdown.isExpired && status?.packsRemaining === 0) {
      refetchStatus();
    }
  }, [countdown.isExpired, status?.packsRemaining]);

  const openPackMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/open-pack").then(r => r.json()),
    onSuccess: (data: PackResult) => {
      setCards(data.cards);
      setRevealedCount(0);
      setPhase("opening");
      queryClient.invalidateQueries({ queryKey: ["/api/daily-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pack-log"] });

      setTimeout(() => {
        setPhase("revealing");
        data.cards.forEach((_, i) => {
          setTimeout(() => setRevealedCount(i + 1), i * 400);
        });
        setTimeout(() => setPhase("done"), data.cards.length * 400 + 200);
      }, 800);
    },
    onError: (err: Error) => {
      toast({ title: "No packs remaining!", description: err.message || "Come back later!", variant: "destructive" });
    },
  });

  const packsRemaining = status?.packsRemaining ?? 0;
  const totalPacks = status?.maxPacks ?? 10;
  const packsOpened = status?.packsOpened ?? 0;
  const packSlots = Array.from({ length: totalPacks }, (_, i) => i < packsOpened ? "opened" : "available");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">

      {/* ── Hero / Pack opener ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%), radial-gradient(ellipse at 100% 50%, rgba(251,191,36,0.1) 0%, transparent 60%)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Daily Pack Shop</h1>
          <p className="text-muted-foreground mb-8">
            Open up to 10 packs every 12 hours. Each pack contains 5 wisdom cards.
          </p>

          {/* Pack slots */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {packSlots.map((state, i) => (
              <div
                key={i}
                className="relative w-10 h-14 rounded-md overflow-hidden transition-all duration-300"
                style={{
                  background: state === "opened"
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #4c1d95 0%, #1e3a8a 100%)",
                  border: state === "opened"
                    ? "1.5px solid rgba(255,255,255,0.1)"
                    : "1.5px solid rgba(139,92,246,0.6)",
                  opacity: state === "opened" ? 0.4 : 1,
                  boxShadow: state === "opened" ? "none" : "0 0 8px rgba(139,92,246,0.3)",
                }}
                data-testid={`pack-slot-${i}`}
              >
                {state === "available" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
                      <path d="M20 6 L30 13 L30 27 L20 34 L10 27 L10 13 Z" stroke="rgba(167,139,250,0.8)" strokeWidth="1.5"/>
                      <circle cx="20" cy="20" r="4" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5"/>
                    </svg>
                  </div>
                )}
                {state === "opened" && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">✓</div>
                )}
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => openPackMutation.mutate()}
              disabled={packsRemaining === 0 || phase === "opening" || phase === "revealing" || openPackMutation.isPending}
              className="relative px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              style={{
                background: packsRemaining > 0
                  ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)"
                  : "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                boxShadow: packsRemaining > 0 ? "0 0 30px rgba(124,58,237,0.5)" : "none",
                color: "white",
              }}
              data-testid="open-pack-button"
            >
              <span className="relative z-10">
                {openPackMutation.isPending || phase === "opening"
                  ? "Opening..."
                  : packsRemaining === 0
                  ? "No Packs Left"
                  : `Open Pack (${packsRemaining} remaining)`}
              </span>
              {packsRemaining > 0 && (
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              )}
            </button>

            {/* ── Countdown timer (shown when packs exhausted) ─────────── */}
            {packsRemaining === 0 && status?.nextReset && (
              <div
                className="rounded-2xl px-6 py-4 text-center"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
                data-testid="countdown-block"
              >
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-medium">
                  Next packs available in
                </p>
                <div
                  className="text-4xl font-mono font-bold tracking-widest tabular-nums"
                  style={{
                    color: countdown.isExpired ? "#4ade80" : "#a78bfa",
                    textShadow: countdown.isExpired
                      ? "0 0 20px rgba(74,222,128,0.5)"
                      : "0 0 20px rgba(167,139,250,0.5)",
                  }}
                  data-testid="countdown-display"
                >
                  {countdown.isExpired ? "Ready!" : countdown.formatted}
                </div>
                {!countdown.isExpired && status.nextReset && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets at {new Date(status.nextReset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Card reveal area ──────────────────────────────────────────────── */}
      {(phase === "opening" || phase === "revealing" || phase === "done") && (
        <div className="flex-1 px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">
                {phase === "opening" ? "Opening pack…" : phase === "revealing" ? "Revealing cards…" : "Your cards!"}
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  className="transition-all duration-500"
                  style={{
                    opacity: i < revealedCount ? 1 : 0,
                    transform: i < revealedCount ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
                  }}
                  onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                  data-testid={`revealed-card-${i}`}
                >
                  <QuoteCard quote={card} isRevealed={i < revealedCount} size="md" />
                </div>
              ))}
            </div>

            {selectedCard && (
              <div className="mt-8 max-w-2xl mx-auto">
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: RARITY_CONFIG[selectedCard.rarity].bg,
                    border: `2px solid ${RARITY_CONFIG[selectedCard.rarity].border}`,
                    boxShadow: `0 0 40px ${RARITY_CONFIG[selectedCard.rarity].glow}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{
                        background: `${RARITY_CONFIG[selectedCard.rarity].color}20`,
                        color: RARITY_CONFIG[selectedCard.rarity].color,
                        border: `1px solid ${RARITY_CONFIG[selectedCard.rarity].color}50`,
                      }}
                    >
                      {selectedCard.rarity}
                    </span>
                    <span className="text-sm text-muted-foreground">{selectedCard.category}</span>
                  </div>
                  <blockquote className="text-lg italic text-white leading-relaxed mb-4">
                    "{selectedCard.text}"
                  </blockquote>
                  <p className="font-semibold" style={{ color: RARITY_CONFIG[selectedCard.rarity].color }}>
                    — {selectedCard.author}
                  </p>
                </div>
              </div>
            )}

            {phase === "done" && packsRemaining > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => { openPackMutation.mutate(); setSelectedCard(null); }}
                  className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    color: "white",
                    boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                  }}
                  data-testid="open-another-pack"
                >
                  Open Another Pack ({packsRemaining} left)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Idle: Rarity info + Pack Log ─────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex-1 px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">

            {/* Rarity chances */}
            <div>
              <h2 className="text-xl font-semibold text-center mb-6">Rarity Chances</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const).map(rarity => {
                  const cfg = RARITY_CONFIG[rarity];
                  const chances = { Common: "50%", Uncommon: "25%", Rare: "15%", Epic: "7%", Legendary: "3%" };
                  return (
                    <div
                      key={rarity}
                      className="rounded-xl p-4 text-center"
                      style={{
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                        boxShadow: `0 0 12px ${cfg.glow}`,
                      }}
                      data-testid={`rarity-info-${rarity}`}
                    >
                      <div className="flex justify-center gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} width="10" height="10" viewBox="0 0 10 10">
                            <polygon points="5,1 6.5,4 9.5,4 7,6 8,9 5,7 2,9 3,6 0.5,4 3.5,4" fill={i < cfg.stars ? cfg.color : "rgba(255,255,255,0.1)"} />
                          </svg>
                        ))}
                      </div>
                      <div className="text-sm font-bold" style={{ color: cfg.color }}>{rarity}</div>
                      <div className="text-lg font-bold text-white mt-1">{chances[rarity]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Pack Opening Log ──────────────────────────────────────── */}
            <div>
              <button
                className="w-full flex items-center justify-between rounded-xl px-5 py-3 transition-colors hover:bg-white/5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onClick={() => setShowLog(l => !l)}
                data-testid="toggle-pack-log"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📜</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Pack History</p>
                    <p className="text-xs text-muted-foreground">
                      {packLog?.length ? `${packLog.length} pack${packLog.length === 1 ? "" : "s"} opened` : "No packs opened yet"}
                    </p>
                  </div>
                </div>
                <svg
                  viewBox="0 0 16 16" width="16" height="16"
                  className="text-muted-foreground transition-transform duration-200"
                  style={{ transform: showLog ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>

              {showLog && (
                <div className="mt-3 space-y-2" data-testid="pack-log-list">
                  {(!packLog || packLog.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No packs opened yet. Open your first pack above!
                    </div>
                  ) : (
                    packLog.map((entry, i) => (
                      <PackLogRow key={entry.id} entry={entry} index={i} />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Collection teaser */}
            <div className="rounded-2xl p-6 border border-border bg-muted/30 text-center">
              <p className="text-muted-foreground text-sm">
                All opened cards are automatically added to your <strong className="text-foreground">Collection</strong>.
                Collect all 1738 quotes from philosophers, visionaries, and thinkers throughout history.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
