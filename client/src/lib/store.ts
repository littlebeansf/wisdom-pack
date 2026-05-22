/**
 * Client-side store — full game logic in the browser using localStorage.
 * No backend required. Used by GitHub Pages (static) build.
 *
 * Storage keys:
 *   wp_pack_state  → { packsOpened, windowStart }
 *   wp_collection  → CollectedEntry[]
 *   wp_pack_log    → PackLogEntry[]
 */

import quotesData from "./quotes_data.json";
import type { Quote } from "../../../shared/schema";

export const quotes: Quote[] = quotesData as Quote[];

const WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_PACKS = 10;
const CARDS_PER_PACK = 5;

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

function pickQuote(rarity: string, exclude: number[]): Quote {
  const pool = quotes.filter(q => q.rarity === rarity && !exclude.includes(q.id));
  const source = pool.length > 0 ? pool : quotes.filter(q => !exclude.includes(q.id));
  const arr = source.length > 0 ? source : quotes;
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
  logPackOpen(usedIds, rarities);

  return {
    cards,
    packsOpened: newState.packsOpened,
    packsRemaining: Math.max(0, MAX_PACKS - newState.packsOpened),
    nextReset: s.nextReset,
  };
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
  return getCollection()
    .map(entry => ({ ...entry, quote: quotes.find(q => q.id === entry.quoteId) }))
    .filter((e): e is typeof e & { quote: Quote } => !!e.quote);
}

// ── Pack log ──────────────────────────────────────────────────────────────

function logPackOpen(cardIds: number[], rarities: string[]): void {
  const logs = load<PackLogEntry[]>("wp_pack_log", []);
  const nextId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
  logs.unshift({ id: nextId, openedAt: Date.now(), cardIds, rarities });
  save("wp_pack_log", logs.slice(0, 50)); // keep last 50
}

export function getPackLog() {
  return load<PackLogEntry[]>("wp_pack_log", []).map(entry => ({
    ...entry,
    cards: entry.cardIds
      .map(id => quotes.find(q => q.id === id))
      .filter((q): q is Quote => !!q),
  }));
}

// ── Stats ─────────────────────────────────────────────────────────────────

export function getStats() {
  const col = getCollection();
  const collectedIds = new Set(col.map(e => e.quoteId));
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;
  const byRarity: Record<string, { total: number; collected: number }> = {};
  rarities.forEach(r => {
    byRarity[r] = {
      total: quotes.filter(q => q.rarity === r).length,
      collected: quotes.filter(q => q.rarity === r && collectedIds.has(q.id)).length,
    };
  });
  return {
    totalQuotes: quotes.length,
    collectedQuotes: col.length,
    favorites: col.filter(e => e.isFavorite).length,
    byRarity,
  };
}

export function getCategories(): string[] {
  return [...new Set(quotes.map(q => q.category))].sort();
}

// ── Util ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}
