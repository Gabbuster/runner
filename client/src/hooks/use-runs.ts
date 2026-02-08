import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDB, LocalRun } from "@/lib/db";
import { api } from "@shared/routes";

// === LOCAL-FIRST HOOKS ===

export function useRuns() {
  return useQuery({
    queryKey: ['local-runs'],
    queryFn: async () => {
      const db = await getDB();
      const runs = await db.getAllFromIndex('runs', 'by-date');
      return runs.reverse(); // Newest first
    },
  });
}

export function useRun(id: number) {
  return useQuery({
    queryKey: ['local-runs', id],
    queryFn: async () => {
      const db = await getDB();
      return db.get('runs', id);
    },
    enabled: !!id,
  });
}

export function useSaveRun() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (run: Omit<LocalRun, 'synced'>) => {
      const db = await getDB();
      const id = await db.add('runs', { ...run, synced: false });
      
      // Check for badges logic here (simplified)
      const badges = [];
      if (run.distance >= 5000) badges.push('5k');
      if (run.distance >= 10000) badges.push('10k');
      if (new Date(run.startTime).getHours() < 7) badges.push('early_bird');
      
      const runsCount = await db.count('runs');
      if (runsCount === 1) badges.push('first_run');

      for (const badgeType of badges) {
        // Check if badge already exists
        const allBadges = await db.getAll('badges');
        if (!allBadges.some(b => b.badgeType === badgeType)) {
             await db.add('badges', {
                badgeType,
                unlockedAt: new Date(),
                runId: id as number,
                synced: false
             });
        }
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-runs'] });
      queryClient.invalidateQueries({ queryKey: ['local-badges'] });
    },
  });
}

export function useSyncRuns() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const db = await getDB();
            const allRuns = await db.getAll('runs');
            const unsyncedRuns = allRuns.filter(r => !r.synced);
            
            if (unsyncedRuns.length === 0) return 0;

            // Transform for API
            const runsPayload = unsyncedRuns.map(r => ({
                startTime: r.startTime,
                endTime: r.endTime,
                duration: r.duration,
                distance: r.distance,
                route: r.route,
                avgPace: r.avgPace,
                status: r.status
            }));

            const res = await fetch(api.runs.sync.path, {
                method: api.runs.sync.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(runsPayload),
                credentials: "include"
            });
            
            if (!res.ok) throw new Error('Sync failed');
            
            // Mark as synced locally
            // In a real app, we'd update specific IDs returned from server
            // For now, assume success means all sent were synced
            const tx = db.transaction('runs', 'readwrite');
            for (const run of unsyncedRuns) {
                if (run.localId) {
                    await tx.store.put({ ...run, synced: true });
                }
            }
            await tx.done;

            return unsyncedRuns.length;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['local-runs'] });
        }
    })
}

export function useDeleteRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (localId: number) => {
      const db = await getDB();
      await db.delete('runs', localId);
      return localId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local-runs'] });
    },
  });
}

export function useBadges() {
    return useQuery({
        queryKey: ['local-badges'],
        queryFn: async () => {
            const db = await getDB();
            return db.getAll('badges');
        }
    });
}
