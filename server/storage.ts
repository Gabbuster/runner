import { db } from "./db";
import {
  runs,
  badges,
  type InsertRun,
  type Run,
  type Badge,
  type InsertBadge
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Runs
  createRun(run: InsertRun): Promise<Run>;
  getRuns(): Promise<Run[]>;
  getRun(id: number): Promise<Run | undefined>;
  
  // Badges
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadges(): Promise<Badge[]>;
  
  // Sync
  syncRuns(runs: InsertRun[]): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createRun(run: InsertRun): Promise<Run> {
    const [newRun] = await db.insert(runs).values(run).returning();
    return newRun;
  }

  async getRuns(): Promise<Run[]> {
    return await db.select().from(runs).orderBy(runs.startTime);
  }

  async getRun(id: number): Promise<Run | undefined> {
    const [run] = await db.select().from(runs).where(eq(runs.id, id));
    return run;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async syncRuns(newRuns: InsertRun[]): Promise<number> {
    if (newRuns.length === 0) return 0;
    // In a real app, we'd handle upserts/duplicates here
    // For now, we just insert them
    const result = await db.insert(runs).values(newRuns).returning();
    return result.length;
  }
}

export const storage = new DatabaseStorage();
