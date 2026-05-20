import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Daily pack state: tracks packs opened today
export const dailyState = sqliteTable("daily_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD
  packsOpened: integer("packs_opened").notNull().default(0),
});

// Collected quotes (user's book)
export const collectedQuotes = sqliteTable("collected_quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull(),
  collectedAt: text("collected_at").notNull(),
  isFavorite: integer("is_favorite").notNull().default(0),
});

export const insertDailyStateSchema = createInsertSchema(dailyState).omit({ id: true });
export const insertCollectedQuoteSchema = createInsertSchema(collectedQuotes).omit({ id: true });

export type DailyState = typeof dailyState.$inferSelect;
export type CollectedQuote = typeof collectedQuotes.$inferSelect;
export type InsertCollectedQuote = z.infer<typeof insertCollectedQuoteSchema>;

// Quote type (from JSON data)
export type Quote = {
  id: number;
  text: string;
  author: string;
  category: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  isFromNotion: boolean;
};
