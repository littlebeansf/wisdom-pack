import { db } from "./db";
import {
  dailyState,
  collectedQuotes,
  packOpenLog,
  type DailyState,
  type CollectedQuote,
  type PackOpenLog,
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Pack window state
  getPackState(): DailyState | undefined;
  setPackState(packsOpened: number, windowStart: number): DailyState;

  // Pack open log
  logPackOpen(cardIds: number[], rarities: string[]): PackOpenLog;
  getPackOpenLog(limit?: number): PackOpenLog[];

  // Collection
  getCollection(): CollectedQuote[];
  addToCollection(quoteId: number): CollectedQuote;
  isInCollection(quoteId: number): boolean;
  toggleFavorite(quoteId: number): CollectedQuote | undefined;
}

const SINGLETON_KEY = "singleton";

export class Storage implements IStorage {
  getPackState(): DailyState | undefined {
    return db.select().from(dailyState).where(eq(dailyState.date, SINGLETON_KEY)).get();
  }

  setPackState(packsOpened: number, windowStart: number): DailyState {
    const existing = this.getPackState();
    if (existing) {
      return db
        .update(dailyState)
        .set({ packsOpened, windowStart })
        .where(eq(dailyState.date, SINGLETON_KEY))
        .returning()
        .get();
    } else {
      return db
        .insert(dailyState)
        .values({ date: SINGLETON_KEY, packsOpened, windowStart })
        .returning()
        .get();
    }
  }

  logPackOpen(cardIds: number[], rarities: string[]): PackOpenLog {
    return db
      .insert(packOpenLog)
      .values({
        openedAt: Date.now(),
        cardIds: JSON.stringify(cardIds),
        rarities: JSON.stringify(rarities),
      })
      .returning()
      .get();
  }

  getPackOpenLog(limit = 50): PackOpenLog[] {
    return db
      .select()
      .from(packOpenLog)
      .orderBy(desc(packOpenLog.openedAt))
      .limit(limit)
      .all();
  }

  getCollection(): CollectedQuote[] {
    return db.select().from(collectedQuotes).all();
  }

  addToCollection(quoteId: number): CollectedQuote {
    const existing = db
      .select()
      .from(collectedQuotes)
      .where(eq(collectedQuotes.quoteId, quoteId))
      .get();
    if (existing) return existing;
    return db
      .insert(collectedQuotes)
      .values({ quoteId, collectedAt: new Date().toISOString(), isFavorite: 0 })
      .returning()
      .get();
  }

  isInCollection(quoteId: number): boolean {
    return !!db
      .select()
      .from(collectedQuotes)
      .where(eq(collectedQuotes.quoteId, quoteId))
      .get();
  }

  toggleFavorite(quoteId: number): CollectedQuote | undefined {
    const existing = db
      .select()
      .from(collectedQuotes)
      .where(eq(collectedQuotes.quoteId, quoteId))
      .get();
    if (!existing) return undefined;
    const newVal = existing.isFavorite === 1 ? 0 : 1;
    return db
      .update(collectedQuotes)
      .set({ isFavorite: newVal })
      .where(eq(collectedQuotes.quoteId, quoteId))
      .returning()
      .get();
  }
}

export const storage = new Storage();
