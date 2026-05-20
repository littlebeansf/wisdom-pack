import { db } from "./db";
import { dailyState, collectedQuotes, type DailyState, type CollectedQuote } from "../shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Daily state
  getDailyState(date: string): DailyState | undefined;
  createOrUpdateDailyState(date: string, packsOpened: number): DailyState;
  
  // Collection
  getCollection(): CollectedQuote[];
  addToCollection(quoteId: number): CollectedQuote;
  isInCollection(quoteId: number): boolean;
  toggleFavorite(quoteId: number): CollectedQuote | undefined;
  getCollectionStats(): { total: number; byRarity: Record<string, number>; favorites: number };
}

export class Storage implements IStorage {
  getDailyState(date: string): DailyState | undefined {
    return db.select().from(dailyState).where(eq(dailyState.date, date)).get();
  }

  createOrUpdateDailyState(date: string, packsOpened: number): DailyState {
    const existing = this.getDailyState(date);
    if (existing) {
      return db.update(dailyState)
        .set({ packsOpened })
        .where(eq(dailyState.date, date))
        .returning()
        .get();
    } else {
      return db.insert(dailyState)
        .values({ date, packsOpened })
        .returning()
        .get();
    }
  }

  getCollection(): CollectedQuote[] {
    return db.select().from(collectedQuotes).all();
  }

  addToCollection(quoteId: number): CollectedQuote {
    const existing = db.select().from(collectedQuotes)
      .where(eq(collectedQuotes.quoteId, quoteId)).get();
    if (existing) return existing;
    return db.insert(collectedQuotes)
      .values({ quoteId, collectedAt: new Date().toISOString(), isFavorite: 0 })
      .returning()
      .get();
  }

  isInCollection(quoteId: number): boolean {
    return !!db.select().from(collectedQuotes)
      .where(eq(collectedQuotes.quoteId, quoteId)).get();
  }

  toggleFavorite(quoteId: number): CollectedQuote | undefined {
    const existing = db.select().from(collectedQuotes)
      .where(eq(collectedQuotes.quoteId, quoteId)).get();
    if (!existing) return undefined;
    const newVal = existing.isFavorite === 1 ? 0 : 1;
    return db.update(collectedQuotes)
      .set({ isFavorite: newVal })
      .where(eq(collectedQuotes.quoteId, quoteId))
      .returning()
      .get();
  }

  getCollectionStats(): { total: number; byRarity: Record<string, number>; favorites: number } {
    const all = this.getCollection();
    const favorites = all.filter(q => q.isFavorite === 1).length;
    return { total: all.length, byRarity: {}, favorites };
  }
}

export const storage = new Storage();
