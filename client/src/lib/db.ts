import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { RoutePoint } from '@shared/schema';

// Local-first DB Schema
interface RunTrackerDB extends DBSchema {
  runs: {
    key: number;
    value: {
      localId?: number;
      id?: number;
      startTime: Date;
      endTime?: Date;
      duration: number;
      distance: number;
      route: RoutePoint[];
      avgPace: number;
      status: 'completed' | 'discarded';
      synced: boolean;
    };
    indexes: { 'by-date': Date };
  };
  badges: {
    key: number;
    value: {
      localId?: number;
      id?: number;
      badgeType: string;
      unlockedAt: Date;
      runId?: number;
      synced: boolean;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<RunTrackerDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<RunTrackerDB>('run-tracker-db', 1, {
      upgrade(db) {
        // Runs store
        const runStore = db.createObjectStore('runs', { keyPath: 'localId', autoIncrement: true });
        runStore.createIndex('by-date', 'startTime');

        // Badges store
        db.createObjectStore('badges', { keyPath: 'localId', autoIncrement: true });

        // Settings store
        db.createObjectStore('settings');
      },
    });
  }
  return dbPromise;
};

export type LocalRun = RunTrackerDB['runs']['value'];
export type LocalBadge = RunTrackerDB['badges']['value'];
