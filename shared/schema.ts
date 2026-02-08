import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We define the schema for potential server sync, but this will primarily be used 
// to derive types for the frontend to use with IndexedDB.

export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional: for future sync
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  distance: doublePrecision("distance"), // in meters
  route: jsonb("route").$type<RoutePoint[]>(), // Array of GPS points
  avgPace: doublePrecision("avg_pace"), // minutes per km
  status: text("status").notNull().default("completed"), // 'completed', 'discarded'
  createdAt: timestamp("created_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  runId: integer("run_id"), // Linked to the run that unlocked it
  badgeType: text("badge_type").notNull(), // 'first_run', '5k', '10k', 'early_bird', etc.
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// === TYPES ===

export type RoutePoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
};

export const insertRunSchema = createInsertSchema(runs).omit({ id: true, createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, unlockedAt: true });

export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

// === EXPLICIT API CONTRACT TYPES ===

// Response types
export type RunResponse = Run;
export type RunListResponse = Run[];
export type BadgeResponse = Badge;
export type BadgeListResponse = Badge[];
