import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QuoteCard, RARITY_CONFIG } from "../components/QuoteCard";
import type { Quote } from "../../../shared/schema";

interface CollectedEntry {
  id: number;
  quoteId: number;
  collectedAt: string;
  isFavorite: number;
  quote: Quote;
}

const RARITIES = ["All", "Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;

export default function Collection() {
  const queryClient = useQueryClient();
  const [filterRarity, setFilterRarity] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<CollectedEntry | null>(null);

  const { data: collection = [], isLoading } = useQuery<CollectedEntry[]>({
    queryKey: ["/api/collection"],
    queryFn: () => apiRequest("GET", "/api/collection").then(r => r.json()),
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories").then(r => r.json()),
  });

  const favMutation = useMutation({
    mutationFn: (quoteId: number) => apiRequest("POST", `/api/collection/${quoteId}/favorite`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const filtered = collection.filter(entry => {
    if (!entry.quote) return false;
    if (filterRarity !== "All" && entry.quote.rarity !== filterRarity) return false;
    if (filterCategory !== "All" && entry.quote.category !== filterCategory) return false;
    if (showFavoritesOnly && entry.isFavorite !== 1) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!entry.quote.text.toLowerCase().includes(s) && !entry.quote.author.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // Sort: favorites first, then by rarity (Legendary first), then by collected time
  const rarityOrder = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite - a.isFavorite;
    return (rarityOrder[a.quote.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[b.quote.rarity as keyof typeof rarityOrder] || 0);
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">My Quote Collection</h1>
          <p className="text-muted-foreground text-sm">
            {collection.length} cards collected{collection.filter(c => c.isFavorite === 1).length > 0 ? ` · ${collection.filter(c => c.isFavorite === 1).length} favorites` : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <input
            type="text"
            placeholder="Search quotes or authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary"
            data-testid="search-input"
          />

          {/* Rarity filter */}
          <select
            value={filterRarity}
            onChange={e => setFilterRarity(e.target.value)}
            className="px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none"
            data-testid="filter-rarity"
          >
            {RARITIES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none"
            data-testid="filter-category"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Favorites toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{
              background: showFavoritesOnly ? "rgba(239,68,68,0.15)" : undefined,
              borderColor: showFavoritesOnly ? "#ef4444" : undefined,
              color: showFavoritesOnly ? "#ef4444" : undefined,
            }}
            data-testid="favorites-toggle"
          >
            ♥ Favorites
          </button>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-4">{sorted.length} cards shown</p>

        {/* Empty state */}
        {isLoading && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading collection...
          </div>
        )}

        {!isLoading && collection.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="text-6xl">📦</div>
            <h2 className="text-xl font-semibold">No cards yet!</h2>
            <p className="text-muted-foreground text-sm">Open some packs in the Pack Shop to start your collection.</p>
          </div>
        )}

        {!isLoading && collection.length > 0 && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-4xl">🔍</div>
            <p className="text-muted-foreground">No cards match your filters.</p>
            <button onClick={() => { setFilterRarity("All"); setFilterCategory("All"); setSearch(""); setShowFavoritesOnly(false); }} className="text-primary text-sm underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Cards grid */}
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          {sorted.map(entry => (
            <div
              key={entry.id}
              onClick={() => setSelectedQuote(selectedQuote?.id === entry.id ? null : entry)}
              className="cursor-pointer"
              data-testid={`collection-card-${entry.quoteId}`}
            >
              <QuoteCard
                quote={entry.quote}
                isRevealed
                size="sm"
                showFavorite
                isFavorite={entry.isFavorite === 1}
                onFavorite={() => favMutation.mutate(entry.quoteId)}
              />
            </div>
          ))}
        </div>

        {/* Selected card modal */}
        {selectedQuote && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedQuote(null)}
          >
            <div
              className="max-w-xl w-full rounded-2xl p-6 relative"
              style={{
                background: RARITY_CONFIG[selectedQuote.quote.rarity].bg,
                border: `2px solid ${RARITY_CONFIG[selectedQuote.quote.rarity].border}`,
                boxShadow: `0 0 60px ${RARITY_CONFIG[selectedQuote.quote.rarity].glow}`,
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                onClick={() => setSelectedQuote(null)}
                data-testid="close-card-detail"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{
                    background: `${RARITY_CONFIG[selectedQuote.quote.rarity].color}20`,
                    color: RARITY_CONFIG[selectedQuote.quote.rarity].color,
                    border: `1px solid ${RARITY_CONFIG[selectedQuote.quote.rarity].color}50`,
                  }}
                >
                  {selectedQuote.quote.rarity}
                </span>
                <span className="text-sm text-white/60">{selectedQuote.quote.category}</span>
                {selectedQuote.quote.isFromNotion && (
                  <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">Personal</span>
                )}
              </div>

              <blockquote className="text-xl italic text-white leading-relaxed mb-6">
                "{selectedQuote.quote.text}"
              </blockquote>

              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold" style={{ color: RARITY_CONFIG[selectedQuote.quote.rarity].color }}>
                  — {selectedQuote.quote.author}
                </p>
                <button
                  onClick={() => favMutation.mutate(selectedQuote.quoteId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105"
                  style={{
                    background: selectedQuote.isFavorite === 1 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
                    color: selectedQuote.isFavorite === 1 ? "#ef4444" : "white",
                    border: `1px solid ${selectedQuote.isFavorite === 1 ? "#ef444450" : "rgba(255,255,255,0.2)"}`,
                  }}
                  data-testid="modal-favorite-button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={selectedQuote.isFavorite === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {selectedQuote.isFavorite === 1 ? "Favorited" : "Favorite"}
                </button>
              </div>

              <p className="text-xs text-white/30 mt-3">
                Collected {new Date(selectedQuote.collectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
