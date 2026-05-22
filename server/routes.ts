import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import quotesData from "./quotes_data.json";
import type { Quote } from "../shared/schema";

const quotes: Quote[] = quotesData as Quote[];
const MAX_PACKS_PER_WINDOW = 10;
const CARDS_PER_PACK = 5;
const WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours in ms

// ── Pack window helpers ─────────────────────────────────────────────────────

function getWindowState(): { packsOpened: number; windowStart: number; windowEnd: number; nextReset: number } {
  const now = Date.now();
  const state = storage.getPackState();

  if (!state || now >= state.windowStart + WINDOW_MS) {
    // No state yet, or window has expired → start fresh window
    storage.setPackState(0, now);
    return { packsOpened: 0, windowStart: now, windowEnd: now + WINDOW_MS, nextReset: now + WINDOW_MS };
  }

  return {
    packsOpened: state.packsOpened,
    windowStart: state.windowStart,
    windowEnd: state.windowStart + WINDOW_MS,
    nextReset: state.windowStart + WINDOW_MS,
  };
}

// ── Rarity selection ────────────────────────────────────────────────────────

function selectRarity(): string {
  const roll = Math.random() * 100;
  if (roll < 50) return "Common";
  if (roll < 75) return "Uncommon";
  if (roll < 90) return "Rare";
  if (roll < 97) return "Epic";
  return "Legendary";
}

function pickRandomQuote(rarity: string, exclude: number[]): Quote | null {
  const pool = quotes.filter(q => q.rarity === rarity && !exclude.includes(q.id));
  if (pool.length === 0) {
    const fallback = quotes.filter(q => !exclude.includes(q.id));
    if (fallback.length === 0) return quotes[Math.floor(Math.random() * quotes.length)];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Routes ──────────────────────────────────────────────────────────────────

export function registerRoutes(httpServer: Server, app: Express): void {

  // GET /api/daily-status — pack window status
  app.get("/api/daily-status", (_req, res) => {
    const win = getWindowState();
    res.json({
      packsOpened: win.packsOpened,
      packsRemaining: Math.max(0, MAX_PACKS_PER_WINDOW - win.packsOpened),
      maxPacks: MAX_PACKS_PER_WINDOW,
      nextReset: win.nextReset,       // Unix ms — client uses for countdown
      windowStart: win.windowStart,   // Unix ms — when current window started
    });
  });

  // POST /api/open-pack — open one pack
  app.post("/api/open-pack", (_req, res) => {
    const win = getWindowState();
    if (win.packsOpened >= MAX_PACKS_PER_WINDOW) {
      return res.status(400).json({
        error: "No packs remaining.",
        nextReset: win.nextReset,
      });
    }

    const cards: Quote[] = [];
    const usedIds: number[] = [];
    const rarities: string[] = [];

    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const rarity = selectRarity();
      const quote = pickRandomQuote(rarity, usedIds);
      if (quote) {
        cards.push(quote);
        usedIds.push(quote.id);
        rarities.push(quote.rarity);
        storage.addToCollection(quote.id);
      }
    }

    const newPacksOpened = win.packsOpened + 1;
    storage.setPackState(newPacksOpened, win.windowStart);
    storage.logPackOpen(usedIds, rarities);

    res.json({
      cards,
      packsOpened: newPacksOpened,
      packsRemaining: Math.max(0, MAX_PACKS_PER_WINDOW - newPacksOpened),
      nextReset: win.nextReset,
    });
  });

  // GET /api/pack-log — pack opening history
  app.get("/api/pack-log", (_req, res) => {
    const logs = storage.getPackOpenLog(30);
    const enriched = logs.map(entry => {
      const cardIds: number[] = JSON.parse(entry.cardIds);
      const rarities: string[] = JSON.parse(entry.rarities);
      const cards = cardIds.map(id => quotes.find(q => q.id === id)).filter(Boolean) as Quote[];
      return {
        id: entry.id,
        openedAt: entry.openedAt,
        cards,
        rarities,
      };
    });
    res.json(enriched);
  });

  // GET /api/collection
  app.get("/api/collection", (_req, res) => {
    const collected = storage.getCollection();
    const collectedWithData = collected
      .map(entry => {
        const quote = quotes.find(q => q.id === entry.quoteId);
        return { ...entry, quote };
      })
      .filter(e => e.quote);
    res.json(collectedWithData);
  });

  // POST /api/collection/:quoteId/favorite
  app.post("/api/collection/:quoteId/favorite", (req, res) => {
    const quoteId = parseInt(req.params.quoteId);
    const updated = storage.toggleFavorite(quoteId);
    if (!updated) return res.status(404).json({ error: "Not in collection" });
    res.json(updated);
  });

  // GET /api/quotes
  app.get("/api/quotes", (req, res) => {
    const { category, rarity, search } = req.query as Record<string, string>;
    let filtered = quotes;
    if (category) filtered = filtered.filter(q => q.category === category);
    if (rarity) filtered = filtered.filter(q => q.rarity === rarity);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        q => q.text.toLowerCase().includes(s) || q.author.toLowerCase().includes(s)
      );
    }
    res.json(filtered.slice(0, 200));
  });

  // GET /api/stats
  app.get("/api/stats", (_req, res) => {
    const collected = storage.getCollection();
    const total = quotes.length;
    const collectedIds = new Set(collected.map(c => c.quoteId));

    const byRarity: Record<string, { total: number; collected: number }> = {};
    const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
    rarities.forEach(r => {
      byRarity[r] = {
        total: quotes.filter(q => q.rarity === r).length,
        collected: quotes.filter(q => q.rarity === r && collectedIds.has(q.id)).length,
      };
    });

    res.json({
      totalQuotes: total,
      collectedQuotes: collected.length,
      favorites: collected.filter(c => c.isFavorite === 1).length,
      byRarity,
    });
  });

  // GET /api/categories
  app.get("/api/categories", (_req, res) => {
    const cats = [...new Set(quotes.map(q => q.category))].sort();
    res.json(cats);
  });
}

export function createHttpServer(app: Express): Server {
  return createServer(app);
}
