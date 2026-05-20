import { useState } from "react";

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const RARITY_CONFIG: Record<Rarity, {
  color: string;
  glow: string;
  border: string;
  bg: string;
  darkBg: string;
  label: string;
  stars: number;
  shimmer: string;
}> = {
  Common: {
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.3)",
    border: "#6b7280",
    bg: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
    darkBg: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    label: "Common",
    stars: 1,
    shimmer: "rgba(255,255,255,0.05)",
  },
  Uncommon: {
    color: "#4ade80",
    glow: "rgba(74,222,128,0.4)",
    border: "#22c55e",
    bg: "linear-gradient(135deg, #14532d 0%, #052e16 100%)",
    darkBg: "linear-gradient(135deg, #052e16 0%, #022c22 100%)",
    label: "Uncommon",
    stars: 2,
    shimmer: "rgba(74,222,128,0.08)",
  },
  Rare: {
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.5)",
    border: "#3b82f6",
    bg: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)",
    darkBg: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
    label: "Rare",
    stars: 3,
    shimmer: "rgba(96,165,250,0.1)",
  },
  Epic: {
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.6)",
    border: "#7c3aed",
    bg: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)",
    darkBg: "linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)",
    label: "Epic",
    stars: 4,
    shimmer: "rgba(167,139,250,0.12)",
  },
  Legendary: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.7)",
    border: "#d97706",
    bg: "linear-gradient(135deg, #78350f 0%, #3d1a02 100%)",
    darkBg: "linear-gradient(135deg, #451a03 0%, #1c0a00 100%)",
    label: "Legendary",
    stars: 5,
    shimmer: "rgba(251,191,36,0.15)",
  },
};

type CategoryEmoji = Record<string, string>;
const CATEGORY_EMOJI: CategoryEmoji = {
  Philosophy: "🧠", Wisdom: "🦉", Stoicism: "⚖️", Life: "🌿", Success: "🏆",
  Motivation: "⚡", Love: "❤️", Death: "☯️", Time: "⏳", Power: "👑",
  Nature: "🌲", Science: "🔬", Art: "🎨", Politics: "🗳️", Freedom: "🕊️",
  Truth: "💎", Knowledge: "📚", Happiness: "✨", Courage: "🦁", Friendship: "🤝",
  Money: "💰", War: "⚔️", Peace: "☮️", Religion: "🙏", Humor: "😄",
  History: "📜", Leadership: "🌟", Change: "🔄", Character: "🎭",
};

type Quote = {
  id: number;
  text: string;
  author: string;
  category: string;
  rarity: Rarity;
  isFromNotion: boolean;
};

interface QuoteCardProps {
  quote: Quote;
  isRevealed?: boolean;
  size?: "sm" | "md" | "lg";
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavorite?: () => void;
}

export function QuoteCard({ quote, isRevealed = true, size = "md", showFavorite, isFavorite, onFavorite }: QuoteCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = RARITY_CONFIG[quote.rarity];
  const emoji = CATEGORY_EMOJI[quote.category] || "💡";

  const sizeClasses = {
    sm: "w-44 h-64",
    md: "w-56 h-80",
    lg: "w-64 h-96",
  };

  const textSizes = {
    sm: { quote: "text-xs", author: "text-xs", category: "text-xs" },
    md: { quote: "text-sm", author: "text-xs", category: "text-xs" },
    lg: { quote: "text-base", author: "text-sm", category: "text-xs" },
  };

  const ts = textSizes[size];

  if (!isRevealed) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl relative overflow-hidden cursor-pointer`}
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "2px solid rgba(99,102,241,0.4)",
          boxShadow: "0 0 20px rgba(99,102,241,0.2)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Card back pattern */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <svg viewBox="0 0 40 40" width="48" height="48" fill="none">
            <path d="M20 4 L32 12 L32 28 L20 36 L8 28 L8 12 Z" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5"/>
            <circle cx="20" cy="20" r="5" fill="none" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5"/>
            <circle cx="20" cy="20" r="2" fill="rgba(99,102,241,0.6)"/>
          </svg>
          <span className="text-xs text-indigo-300 font-medium opacity-70">Wisdom Pack</span>
        </div>
        {/* Shimmer on hover */}
        {hovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl relative overflow-hidden flex flex-col select-none`}
      style={{
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        boxShadow: hovered ? `0 0 30px ${cfg.glow}, 0 8px 32px rgba(0,0,0,0.4)` : `0 0 15px ${cfg.glow}40, 0 4px 16px rgba(0,0,0,0.3)`,
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`quote-card-${quote.id}`}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 30%, ${cfg.shimmer} 50%, transparent 70%)`,
          backgroundSize: "200% 200%",
          animation: hovered ? "shimmer 1.5s ease infinite" : "none",
        }}
      />

      {/* Legendary sparkle border */}
      {quote.rarity === "Legendary" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          border: "2px solid transparent",
          background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706, #fbbf24) border-box",
          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          borderRadius: "inherit",
          animation: "borderGlow 2s ease infinite",
        }} />
      )}

      {/* Header: Category + Rarity */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-1">
          <span className="text-base">{emoji}</span>
          <span className={`${ts.category} font-medium`} style={{ color: cfg.color, opacity: 0.9 }}>
            {quote.category}
          </span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="8" height="8" viewBox="0 0 10 10">
              <polygon
                points="5,1 6.5,4 9.5,4 7,6 8,9 5,7 2,9 3,6 0.5,4 3.5,4"
                fill={i < cfg.stars ? cfg.color : "rgba(255,255,255,0.1)"}
              />
            </svg>
          ))}
        </div>
      </div>

      {/* Thin divider */}
      <div className="mx-3 h-px" style={{ background: `${cfg.border}40` }} />

      {/* Quote text */}
      <div className="flex-1 px-3 py-2 flex items-center">
        <p
          className={`${ts.quote} leading-relaxed italic`}
          style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          {quote.text.length > 160 ? `"${quote.text.slice(0, 157)}…"` : `"${quote.text}"`}
        </p>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className={`${ts.author} font-semibold`} style={{ color: cfg.color }}>
              — {quote.author}
            </p>
            {quote.isFromNotion && (
              <span className="text-xs opacity-50">Personal</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: `${cfg.color}20`,
                color: cfg.color,
                border: `1px solid ${cfg.color}40`,
              }}
            >
              {quote.rarity}
            </span>
            {showFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onFavorite?.(); }}
                className="ml-1 transition-transform hover:scale-125"
                data-testid={`favorite-${quote.id}`}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? "#ef4444" : "none"} stroke={isFavorite ? "#ef4444" : "rgba(255,255,255,0.4)"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
