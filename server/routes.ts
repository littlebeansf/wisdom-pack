import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import quotesData from "./quotes_data.json";
import type { Quote } from "../shared/schema";

const quotes: Quote[] = quotesData as Quote[];
const MAX_PACKS_PER_DAY = 10;
const CARDS_PER_PACK = 5;

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// Weighted random rarity selection for pack opening
function selectRarity(): string {
  const roll = Math.random() * 100;
  if (roll < 50) return "Common";
  if (roll < 75) return "Uncommon";
  if (roll < 90) return "Rare";
  if (roll < 97) return "Epic";
  return "Legendary";
}

function getQuotesByRarity(rarity: string): Quote[] {
  return quotes.filter(q => q.rarity === rarity);
}

function pickRandomQuote(rarity: string, exclude: number[]): Quote | null {
  const pool = getQuotesByRarity(rarity).filter(q => !exclude.includes(q.id));
  if (pool.length === 0) {
    // fallback: any quote not excluded
    const fallback = quotes.filter(q => !exclude.includes(q.id));
    if (fallback.length === 0) return quotes[Math.floor(Math.random() * quotes.length)];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function registerRoutes(httpServer: Server, app: Express): void {
  // Get daily status
  app.get("/api/daily-status", (_req, res) => {
    const today = getToday();
    const state = storage.getDailyState(today);
    const packsOpened = state?.packsOpened ?? 0;
    res.json({
      packsOpened,
      packsRemaining: Math.max(0, MAX_PACKS_PER_DAY - packsOpened),
      maxPacks: MAX_PACKS_PER_DAY,
      date: today,
    });
  });

  // Open a pack
  app.post("/api/open-pack", (_req, res) => {
    const today = getToday();
    const state = storage.getDailyState(today);
    const packsOpened = state?.packsOpened ?? 0;

    if (packsOpened >= MAX_PACKS_PER_DAY) {
      return res.status(400).json({ error: "No packs remaining today. Come back tomorrow!" });
    }

    // Generate 5 cards
    const cards: Quote[] = [];
    const usedIds: number[] = [];

    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const rarity = selectRarity();
      const quote = pickRandomQuote(rarity, usedIds);
      if (quote) {
        cards.push(quote);
        usedIds.push(quote.id);
        storage.addToCollection(quote.id);
      }
    }

    const newPacksOpened = packsOpened + 1;
    storage.createOrUpdateDailyState(today, newPacksOpened);

    res.json({
      cards,
      packsOpened: newPacksOpened,
      packsRemaining: Math.max(0, MAX_PACKS_PER_DAY - newPacksOpened),
    });
  });

  // Get collection
  app.get("/api/collection", (_req, res) => {
    const collected = storage.getCollection();
    const collectedWithData = collected.map(entry => {
      const quote = quotes.find(q => q.id === entry.quoteId);
      return { ...entry, quote };
    }).filter(e => e.quote);
    
    res.json(collectedWithData);
  });

  // Toggle favorite
  app.post("/api/collection/:quoteId/favorite", (req, res) => {
    const quoteId = parseInt(req.params.quoteId);
    const updated = storage.toggleFavorite(quoteId);
    if (!updated) return res.status(404).json({ error: "Not in collection" });
    res.json(updated);
  });

  // Get all quotes (for browsing)
  app.get("/api/quotes", (req, res) => {
    const { category, rarity, search } = req.query as Record<string, string>;
    let filtered = quotes;
    if (category) filtered = filtered.filter(q => q.category === category);
    if (rarity) filtered = filtered.filter(q => q.rarity === rarity);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(s) || 
        q.author.toLowerCase().includes(s)
      );
    }
    res.json(filtered.slice(0, 200));
  });

  // Get stats
  app.get("/api/stats", (_req, res) => {
    const collected = storage.getCollection();
    const total = quotes.length;
    const collectedIds = new Set(collected.map(c => c.quoteId));
    
    const byRarity: Record<string, { total: number; collected: number }> = {};
    const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
    rarities.forEach(r => {
      const totalR = quotes.filter(q => q.rarity === r).length;
      const collectedR = quotes.filter(q => q.rarity === r && collectedIds.has(q.id)).length;
      byRarity[r] = { total: totalR, collected: collectedR };
    });

    res.json({
      totalQuotes: total,
      collectedQuotes: collected.length,
      favorites: collected.filter(c => c.isFavorite === 1).length,
      byRarity,
    });
  });

  // Get categories
  app.get("/api/categories", (_req, res) => {
    const cats = [...new Set(quotes.map(q => q.category))].sort();
    res.json(cats);
  });
}

export function createHttpServer(app: Express): Server {
  return createServer(app);
}
