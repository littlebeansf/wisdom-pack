import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QuoteCard, RARITY_CONFIG } from "../components/QuoteCard";
import { useToast } from "@/hooks/use-toast";
import type { Quote } from "../../../shared/schema";

interface DailyStatus {
  packsOpened: number;
  packsRemaining: number;
  maxPacks: number;
  date: string;
}

interface PackResult {
  cards: Quote[];
  packsOpened: number;
  packsRemaining: number;
}

type Phase = "idle" | "opening" | "revealing" | "done";

export default function PackShop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [cards, setCards] = useState<Quote[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Quote | null>(null);

  const { data: status } = useQuery<DailyStatus>({
    queryKey: ["/api/daily-status"],
    queryFn: () => apiRequest("GET", "/api/daily-status").then(r => r.json()),
  });

  const openPackMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/open-pack").then(r => r.json()),
    onSuccess: (data: PackResult) => {
      setCards(data.cards);
      setRevealedCount(0);
      setPhase("opening");
      queryClient.invalidateQueries({ queryKey: ["/api/daily-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      // Sequential reveal with delay
      setTimeout(() => {
        setPhase("revealing");
        data.cards.forEach((_, i) => {
          setTimeout(() => {
            setRevealedCount(i + 1);
          }, i * 400);
        });
        setTimeout(() => {
          setPhase("done");
        }, data.cards.length * 400 + 200);
      }, 800);
    },
    onError: (err: Error) => {
      toast({ title: "No packs remaining!", description: err.message || "Come back tomorrow!", variant: "destructive" });
    },
  });

  const packsRemaining = status?.packsRemaining ?? 0;
  const totalPacks = status?.maxPacks ?? 10;
  const packsOpened = status?.packsOpened ?? 0;

  // Pack visual array (filled / empty)
  const packSlots = Array.from({ length: totalPacks }, (_, i) => i < packsOpened ? "opened" : "available");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden py-12 px-4"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%), radial-gradient(ellipse at 100% 50%, rgba(251,191,36,0.1) 0%, transparent 60%)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Daily Pack Shop</h1>
          <p className="text-muted-foreground mb-8">Open up to 10 packs per day. Each pack contains 5 wisdom cards.</p>

          {/* Pack slots display */}
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

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-3">
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
                  ? "No Packs Left Today"
                  : `Open Pack (${packsRemaining} remaining)`}
              </span>
              {packsRemaining > 0 && (
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              )}
            </button>
            {packsRemaining === 0 && (
              <p className="text-sm text-muted-foreground">Your daily packs reset at midnight ✨</p>
            )}
          </div>
        </div>
      </div>

      {/* Cards reveal area */}
      {(phase === "opening" || phase === "revealing" || phase === "done") && (
        <div className="flex-1 px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">
                {phase === "opening" ? "Opening pack..." : phase === "revealing" ? "Revealing cards..." : "Your cards!"}
              </h2>
            </div>
            
            {/* Cards grid */}
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
                  <QuoteCard
                    quote={card}
                    isRevealed={i < revealedCount}
                    size="md"
                  />
                </div>
              ))}
            </div>

            {/* Selected card detail */}
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

            {/* Open another pack */}
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

      {/* Idle state: show rarity info */}
      {phase === "idle" && (
        <div className="flex-1 px-4 py-8">
          <div className="max-w-3xl mx-auto">
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

            {/* Collection teaser */}
            <div className="mt-8 rounded-2xl p-6 border border-border bg-muted/30 text-center">
              <p className="text-muted-foreground text-sm">
                All opened cards are automatically added to your <strong className="text-foreground">Collection</strong>.
                Collect all {1738} quotes from philosophers, visionaries, and thinkers throughout history.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
