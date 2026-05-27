import { useState } from "react";

// Legendary card background images — original 20
import caesarImg from "@assets/legendary/leg_01_caesar.png";
import laotZuImg from "@assets/legendary/leg_02_laotzu.png";
import santayanaImg from "@assets/legendary/leg_03_santayana.png";
import yodaImg from "@assets/legendary/leg_04_yoda.png";
import einsteinDiffImg from "@assets/legendary/leg_05_einstein_difficulty.png";
import einsteinMistakeImg from "@assets/legendary/leg_06_einstein_mistake.png";
import mlkImg from "@assets/legendary/leg_07_mlk.png";
import platoImg from "@assets/legendary/leg_08_plato.png";
import mandelaImg from "@assets/legendary/leg_09_mandela.png";
import burkeImg from "@assets/legendary/leg_10_burke.png";
import suntzuImg from "@assets/legendary/leg_11_suntzu.png";
import aliImg from "@assets/legendary/leg_12_ali.png";
import capaldiImg from "@assets/legendary/leg_13_capaldi.png";
import twainImg from "@assets/legendary/leg_14_twain.png";
import narutoImg from "@assets/legendary/leg_15_naruto.png";
import shakespeareImg from "@assets/legendary/leg_16_shakespeare.png";
import confuciusImg from "@assets/legendary/leg_17_confucius.png";
import socratesImg from "@assets/legendary/leg_18_socrates.png";
import spidermanImg from "@assets/legendary/leg_19_spiderman.png";
import armstrongImg from "@assets/legendary/leg_20_armstrong.png";

// Legendary card background images — new 10
import descartesImg from "@assets/legendary/leg_21_descartes.png";
import nietzscheImg from "@assets/legendary/leg_22_nietzsche.png";
import gandhiImg from "@assets/legendary/leg_23_gandhi.png";
import stevejobsImg from "@assets/legendary/leg_24_stevejobs.png";
import frostImg from "@assets/legendary/leg_25_frost.png";
import rooseveltTImg from "@assets/legendary/leg_26_roosevelt.png";
import jfkImg from "@assets/legendary/leg_27_jfk.png";
import buzzImg from "@assets/legendary/leg_28_buzzlightyear.png";
import tolkienImg from "@assets/legendary/leg_29_tolkien.png";
import eleanorImg from "@assets/legendary/leg_30_eleanor.png";

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

// Persona-based category emojis
type CategoryEmoji = Record<string, string>;
const CATEGORY_EMOJI: CategoryEmoji = {
  "Historical Figures":   "⚔️",
  "Philosophy & Thinkers":"🧠",
  "Science & Innovators": "🔬",
  "Music":                "🎵",
  "Movies & TV":          "🎬",
  "Anime":                "🌸",
  "Cartoons":             "🎭",
  "Sports":               "🏆",
  "Politics & Leaders":   "🗳️",
  "Literature & Writers": "📚",
  "Personal":             "✨",
};

// Legendary card image mapping — keyed by quote ID
// Original 20 images
const LEGENDARY_IMAGES: Record<number, string> = {
  1:  caesarImg,          // Julius Caesar — "Veni, vidi, vici."
  2:  shakespeareImg,     // William Shakespeare — "To be, or not to be..."
  5:  aliImg,             // Muhammad Ali — "Float like a butterfly..."
  6:  mlkImg,             // Martin Luther King Jr. — "I have a dream..."
  8:  capaldiImg,         // Lewis Capaldi — "I can't breathe without you..."
  9:  yodaImg,            // Yoda — "Do or do not."
  12: spidermanImg,       // Uncle Ben (Spider-Man) — "With great power..."
  13: einsteinMistakeImg, // Albert Einstein — "A person who never made a mistake..."
  16: armstrongImg,       // Lance Armstrong — "Pain is temporary."
  18: platoImg,           // Plato — "The measure of a man..."
  20: laotZuImg,          // Lao Tzu — "The journey of a thousand miles..."
  21: santayanaImg,       // George Santayana — "Those who cannot remember the past..."
  25: twainImg,           // Mark Twain — "The secret of getting ahead..."
  28: mandelaImg,         // Nelson Mandela — "It always seems impossible..."
  31: confuciusImg,       // Confucius — "It does not matter how slowly you go..."
  32: socratesImg,        // Socrates — "Know thyself."
  35: suntzuImg,          // Sun Tzu — "Power is nothing without control."
  36: narutoImg,          // Naruto Uzumaki — "I am the storm."
  39: einsteinDiffImg,    // Albert Einstein — "In the middle of difficulty..."
  40: burkeImg,           // Edmund Burke — "The only thing necessary..."
  // New 10 images
  4:  stevejobsImg,       // Steve Jobs — "The only way to do great work..."
  11: gandhiImg,          // Mahatma Gandhi — "Be the change you wish to see..."
  14: frostImg,           // Robert Frost — "Two roads diverged in a wood..."
  15: nietzscheImg,       // Friedrich Nietzsche — "That which does not kill us..."
  17: rooseveltTImg,      // Theodore Roosevelt — "Speak softly and carry a big stick."
  19: jfkImg,             // John F. Kennedy — "Ask not what your country can do..."
  22: buzzImg,            // Buzz Lightyear — "To infinity and beyond!"
  27: tolkienImg,         // J.R.R. Tolkien — "Not all those who wander are lost."
  30: descartesImg,       // René Descartes — "It is not enough to have a good mind..."
  37: eleanorImg,         // Eleanor Roosevelt — "The future belongs to those who believe..."
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
  const legendaryImg = quote.rarity === "Legendary" ? LEGENDARY_IMAGES[quote.id] : undefined;

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
        background: legendaryImg ? `url(${legendaryImg}) center/cover no-repeat` : cfg.bg,
        border: `2px solid ${cfg.border}`,
        boxShadow: hovered ? `0 0 30px ${cfg.glow}, 0 8px 32px rgba(0,0,0,0.4)` : `0 0 15px ${cfg.glow}40, 0 4px 16px rgba(0,0,0,0.3)`,
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`quote-card-${quote.id}`}
    >
      {/* Legendary dark overlay to ensure text readability over the illustration */}
      {legendaryImg && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      )}

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

      {/* Header: Category + Rarity stars */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 relative z-10">
        <div className="flex items-center gap-1">
          <span className="text-base">{emoji}</span>
          <span className={`${ts.category} font-medium leading-tight`} style={{ color: cfg.color, opacity: 0.9, maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
      <div className="mx-3 h-px relative z-10" style={{ background: `${cfg.border}40` }} />

      {/* Quote text */}
      <div className="flex-1 px-3 py-2 flex items-center relative z-10">
        <p
          className={`${ts.quote} leading-relaxed italic`}
          style={{
            color: "rgba(255,255,255,0.95)",
            textShadow: legendaryImg ? "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)" : "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {quote.text.length > 160 ? `"${quote.text.slice(0, 157)}…"` : `"${quote.text}"`}
        </p>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className={`${ts.author} font-semibold`} style={{ color: cfg.color, textShadow: legendaryImg ? "0 1px 3px rgba(0,0,0,0.9)" : "none" }}>
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
