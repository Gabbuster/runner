import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Sync endpoint - receives array of runs from client
  app.post(api.runs.sync.path, async (req, res) => {
    try {
      const input = api.runs.sync.input.parse(req.body);
      const syncedCount = await storage.syncRuns(input);
      res.json({ synced: syncedCount });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.runs.list.path, async (req, res) => {
    const runs = await storage.getRuns();
    res.json(runs);
  });

  app.get(api.badges.list.path, async (req, res) => {
    const badges = await storage.getBadges();
    res.json(badges);
  });

  // Simple seed to ensure DB isn't empty (helpful for debugging/first load if sync is used)
  const existingRuns = await storage.getRuns();
  if (existingRuns.length === 0) {
    console.log("Seeding database with example run...");
    await storage.createRun({
       startTime: new Date(Date.now() - 86400000), // Yesterday
       endTime: new Date(Date.now() - 86400000 + 1800000), // 30 mins later
       duration: 1800, // 30 mins
       distance: 5000, // 5km
       avgPace: 6.0, // 6 min/km
       status: "completed",
       route: [], // Empty route for seed
       userId: "demo-user"
    });
  }

  return httpServer;
}
