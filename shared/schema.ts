import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Pack window state: tracks packs opened within a 12h window
// windowStart is a Unix timestamp (ms) marking when the current 12h window started
export const dailyState = sqliteTable("daily_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // key: "singleton" (single row)
  packsOpened: integer("packs_opened").notNull().default(0),
  windowStart: integer("window_start").notNull().default(0), // Unix ms timestamp
});

// Collected quotes (user's book)
export const collectedQuotes = sqliteTable("collected_quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull(),
  collectedAt: text("collected_at").notNull(),
  isFavorite: integer("is_favorite").notNull().default(0),
});

// Pack open history log
export const packOpenLog = sqliteTable("pack_open_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openedAt: integer("opened_at").notNull(), // Unix ms timestamp
  cardIds: text("card_ids").notNull(),      // JSON array of quote IDs
  rarities: text("rarities").notNull(),     // JSON array of rarity strings
});

export const insertDailyStateSchema = createInsertSchema(dailyState).omit({ id: true });
export const insertCollectedQuoteSchema = createInsertSchema(collectedQuotes).omit({ id: true });
export const insertPackOpenLogSchema = createInsertSchema(packOpenLog).omit({ id: true });

export type DailyState = typeof dailyState.$inferSelect;
export type CollectedQuote = typeof collectedQuotes.$inferSelect;
export type PackOpenLog = typeof packOpenLog.$inferSelect;
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
