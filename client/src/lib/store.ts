/**
 * Client-side store — full game logic in the browser using localStorage.
 * No backend required. Used by GitHub Pages (static) build.
 *
 * Storage keys:
 *   wp_pack_state  → { packsOpened, windowStart }
 *   wp_collection  → CollectedEntry[]
 *   wp_pack_log    → PackLogEntry[]
 *   wp_coins       → number
 */

import quotesData from "./quotes_data.json";
import type { Quote } from "../../../shared/schema";

const _quotes: Quote[] = quotesData as Quote[];
function allQuotes(): Quote[] { return _quotes; }
export function getQuotes(): Quote[] { return _quotes; }

const WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_PACKS = 10;
const CARDS_PER_PACK = 5;
const TESTING_COINS = 999999;

// ── Category pack definitions ──────────────────────────────────────────────

export interface CategoryPackDef {
  category: string;
  emoji: string;
  description: string;
  cost: number;
  color: string;
}

export const CATEGORY_PACKS: CategoryPackDef[] = [
  { category: "Historical Figures",  emoji: "⚔️",  description: "Caesar, Marcus Aurelius, Sun Tzu & more", cost: 200, color: "#b45309" },
  { category: "Philosophy & Thinkers", emoji: "🧠", description: "Nietzsche, Plato, Kant, Camus & more",    cost: 200, color: "#7c3aed" },
  { category: "Science & Innovators", emoji: "🔬", description: "Einstein, Tesla, Hawking, Jobs & more",    cost: 250, color: "#0891b2" },
  { category: "Music",               emoji: "🎵",  description: "Tupac, Bowie, Bob Marley, Drake & more",   cost: 300, color: "#db2777" },
  { category: "Movies & TV",         emoji: "🎬",  description: "Godfather, Breaking Bad, Star Wars & more",cost: 300, color: "#1d4ed8" },
  { category: "Anime",               emoji: "🌸",  description: "Naruto, One Piece, Attack on Titan & more",cost: 350, color: "#dc2626" },
  { category: "Cartoons",            emoji: "🎭",  description: "SpongeBob, Simpsons, Rick & Morty & more", cost: 250, color: "#16a34a" },
  { category: "Sports",              emoji: "🏆",  description: "Jordan, Ali, Messi, Ronaldo & more",       cost: 250, color: "#ca8a04" },
  { category: "Politics & Leaders",  emoji: "🗳️",  description: "MLK, Mandela, Obama, JFK & more",          cost: 200, color: "#0f766e" },
  { category: "Literature & Writers",emoji: "📚",  description: "Shakespeare, Tolkien, Wilde & more",       cost: 200, color: "#9333ea" },
  { category: "Personal",            emoji: "✨",  description: "Your personal Notion quotes",              cost: 150, color: "#4f46e5" },
];

// ── Types ─────────────────────────────────────────────────────────────────

export interface PackState {
  packsOpened: number;
  windowStart: number; // Unix ms
}

export interface CollectedEntry {
  quoteId: number;
  collectedAt: string; // ISO string
  isFavorite: boolean;
}

export interface PackLogEntry {
  id: number;
  openedAt: number; // Unix ms
  cardIds: number[];
  rarities: string[];
  packType?: string; // "Daily" or category name
}

// ── LocalStorage helpers ─────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Coins ─────────────────────────────────────────────────────────────────

export function getCoins(): number {
  const stored = localStorage.getItem("wp_coins");
  if (stored === null) {
    // First time — give testing amount
    save("wp_coins", TESTING_COINS);
    return TESTING_COINS;
  }
  return parseInt(stored, 10) || 0;
}

export function addCoins(amount: number): number {
  const current = getCoins();
  const next = current + amount;
  save("wp_coins", next);
  return next;
}

export function spendCoins(amount: number): number {
  const current = getCoins();
  if (current < amount) throw new Error(`Not enough coins! Need ${amount} but have ${current}.`);
  const next = current - amount;
  save("wp_coins", next);
  return next;
}

// ── Pack window ───────────────────────────────────────────────────────────

function getPackState(): PackState & { nextReset: number } {
  const now = Date.now();
  let state = load<PackState>("wp_pack_state", { packsOpened: 0, windowStart: now });

  if (now >= state.windowStart + WINDOW_MS) {
    // Window expired — start fresh
    state = { packsOpened: 0, windowStart: now };
    save("wp_pack_state", state);
  }

  return { ...state, nextReset: state.windowStart + WINDOW_MS };
}

export function getDailyStatus() {
  const s = getPackState();
  return {
    packsOpened: s.packsOpened,
    packsRemaining: Math.max(0, MAX_PACKS - s.packsOpened),
    maxPacks: MAX_PACKS,
    nextReset: s.nextReset,
    windowStart: s.windowStart,
  };
}

// ── Rarity selection ─────────────────────────────────────────────────────

function selectRarity(): string {
  const roll = Math.random() * 100;
  if (roll < 50) return "Common";
  if (roll < 75) return "Uncommon";
  if (roll < 90) return "Rare";
  if (roll < 97) return "Epic";
  return "Legendary";
}

function pickQuote(rarity: string, exclude: number[], categoryFilter?: string): Quote {
  const q = allQuotes();
  let pool = q.filter(x => !exclude.includes(x.id));
  if (categoryFilter) pool = pool.filter(x => x.category === categoryFilter);
  const byRarity = pool.filter(x => x.rarity === rarity);
  const source = byRarity.length > 0 ? byRarity : pool;
  const arr = source.length > 0 ? source : q;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Open pack ────────────────────────────────────────────────────────────

export function openPack(): {
  cards: Quote[];
  packsOpened: number;
  packsRemaining: number;
  nextReset: number;
} {
  const s = getPackState();
  if (s.packsOpened >= MAX_PACKS) {
    throw new Error(`No packs remaining. Come back in ${formatMs(s.nextReset - Date.now())}!`);
  }

  const cards: Quote[] = [];
  const usedIds: number[] = [];
  const rarities: string[] = [];

  for (let i = 0; i < CARDS_PER_PACK; i++) {
    const rarity = selectRarity();
    const q = pickQuote(rarity, usedIds);
    cards.push(q);
    usedIds.push(q.id);
    rarities.push(q.rarity);
    addToCollection(q.id);
  }

  const newState: PackState = {
    packsOpened: s.packsOpened + 1,
    windowStart: s.windowStart,
  };
  save("wp_pack_state", newState);
  logPackOpen(usedIds, rarities, "Daily");

  return {
    cards,
    packsOpened: newState.packsOpened,
    packsRemaining: Math.max(0, MAX_PACKS - newState.packsOpened),
    nextReset: s.nextReset,
  };
}

// ── Category pack ─────────────────────────────────────────────────────────

export function openCategoryPack(category: string, cost: number): {
  cards: Quote[];
  coinsRemaining: number;
} {
  // Spend coins first (throws if not enough)
  const coinsRemaining = spendCoins(cost);

  const cards: Quote[] = [];
  const usedIds: number[] = [];
  const rarities: string[] = [];

  for (let i = 0; i < CARDS_PER_PACK; i++) {
    const rarity = selectRarity();
    const q = pickQuote(rarity, usedIds, category);
    cards.push(q);
    usedIds.push(q.id);
    rarities.push(q.rarity);
    addToCollection(q.id);
  }

  logPackOpen(usedIds, rarities, category);

  return { cards, coinsRemaining };
}

// ── Collection ───────────────────────────────────────────────────────────

export function getCollection(): CollectedEntry[] {
  return load<CollectedEntry[]>("wp_collection", []);
}

function addToCollection(quoteId: number): void {
  const col = getCollection();
  if (col.some(e => e.quoteId === quoteId)) return;
  col.push({ quoteId, collectedAt: new Date().toISOString(), isFavorite: false });
  save("wp_collection", col);
}

export function toggleFavorite(quoteId: number): CollectedEntry[] {
  const col = getCollection().map(e =>
    e.quoteId === quoteId ? { ...e, isFavorite: !e.isFavorite } : e
  );
  save("wp_collection", col);
  return col;
}

export function getCollectionWithQuotes() {
  const q = allQuotes();
  return getCollection()
    .map(entry => ({ ...entry, quote: q.find(x => x.id === entry.quoteId) }))
    .filter((e): e is typeof e & { quote: Quote } => !!e.quote);
}

// ── Pack log ──────────────────────────────────────────────────────────────

function logPackOpen(cardIds: number[], rarities: string[], packType: string): void {
  const logs = load<PackLogEntry[]>("wp_pack_log", []);
  const nextId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
  logs.unshift({ id: nextId, openedAt: Date.now(), cardIds, rarities, packType });
  save("wp_pack_log", logs.slice(0, 100)); // keep last 100
}

export function getPackLog() {
  const q = allQuotes();
  return load<PackLogEntry[]>("wp_pack_log", []).map(entry => ({
    ...entry,
    cards: entry.cardIds
      .map(id => q.find(x => x.id === id))
      .filter((x): x is Quote => !!x),
  }));
}

// ── Stats ─────────────────────────────────────────────────────────────────

export function getStats() {
  const q = allQuotes();
  const col = getCollection();
  const collectedIds = new Set(col.map(e => e.quoteId));
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;
  const byRarity: Record<string, { total: number; collected: number }> = {};
  rarities.forEach(r => {
    byRarity[r] = {
      total: q.filter(x => x.rarity === r).length,
      collected: q.filter(x => x.rarity === r && collectedIds.has(x.id)).length,
    };
  });

  // By category
  const allCategories = [...new Set(q.map(x => x.category))].sort();
  const byCategory: Record<string, { total: number; collected: number }> = {};
  allCategories.forEach(cat => {
    byCategory[cat] = {
      total: q.filter(x => x.category === cat).length,
      collected: q.filter(x => x.category === cat && collectedIds.has(x.id)).length,
    };
  });

  return {
    totalQuotes: q.length,
    collectedQuotes: col.length,
    favorites: col.filter(e => e.isFavorite).length,
    byRarity,
    byCategory,
  };
}

export function getCategories(): string[] {
  return [...new Set(allQuotes().map(q => q.category))].sort();
}

// ── Util ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}
