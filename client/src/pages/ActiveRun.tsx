import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useRunTracker } from "@/hooks/use-tracker";
import { useSaveRun } from "@/hooks/use-runs";
import { useVoiceCoach } from "@/hooks/use-voice-coach";
import { RunMap } from "@/components/Map";
import { Pause, Play, Square, Maximize2, Minimize2, Lock, Unlock } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "@/hooks/use-toast";
import { getDB } from "@/lib/db";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number) {
  return (meters / 1000).toFixed(2);
}

function formatPace(pace: number) {
  if (!pace || pace === Infinity || pace <= 0) return "--'--\"";
  const m = Math.floor(pace);
  const s = Math.floor((pace - m) * 60);
  return `${m}'${s.toString().padStart(2, '0')}"`;
}

async function saveRunDirectly(runData: {
  startTime: Date;
  endTime: Date;
  duration: number;
  distance: number;
  route: any[];
  avgPace: number;
  status: 'completed' | 'discarded';
}) {
  const db = await getDB();
  const id = await db.add('runs', { ...runData, synced: false });

  const badges = [];
  if (runData.distance >= 5000) badges.push('5k');
  if (runData.distance >= 10000) badges.push('10k');
  if (runData.startTime.getHours() < 7) badges.push('early_bird');

  const runsCount = await db.count('runs');
  if (runsCount === 1) badges.push('first_run');

  for (const badgeType of badges) {
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
}

export default function ActiveRun() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const {
    isActive, isPaused, distance, duration,
    currentPace, route, currentPosition, gpsError,
    startRun, pauseRun, resumeRun, stopRun
  } = useRunTracker();

  const { mutateAsync: saveRun } = useSaveRun();
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const hasStoppedRef = useRef(false);
  const stopRunRef = useRef(stopRun);

  stopRunRef.current = stopRun;

  useEffect(() => {
    startRun();
  }, []);

  useVoiceCoach(distance, isActive, isPaused);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStoppedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    window.history.pushState({ activeRun: true }, '');

    const handlePopState = () => {
      if (hasStoppedRef.current) return;
      hasStoppedRef.current = true;

      const runData = stopRunRef.current();

      if (runData.distance >= 10) {
        saveRunDirectly(runData).then(() => {
          queryClient.invalidateQueries({ queryKey: ['local-runs'] });
          queryClient.invalidateQueries({ queryKey: ['local-badges'] });
          toast({ title: "Run Auto-Saved", description: "Your run was saved before leaving." });
        }).catch(() => {
          toast({ title: "Error", description: "Could not save run.", variant: "destructive" });
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [queryClient]);

  useEffect(() => {
    return () => {
      if (hasStoppedRef.current) return;
      hasStoppedRef.current = true;

      const runData = stopRunRef.current();

      if (runData.distance >= 10) {
        saveRunDirectly(runData).then(() => {
          queryClient.invalidateQueries({ queryKey: ['local-runs'] });
          queryClient.invalidateQueries({ queryKey: ['local-badges'] });
        }).catch(console.error);
      }
    };
  }, [queryClient]);

  const handleStop = useCallback(async () => {
    if (hasStoppedRef.current) return;
    hasStoppedRef.current = true;

    const runData = stopRun();

    if (window.history.state?.activeRun) {
      window.history.back();
    }

    if (runData.distance < 10) {
      toast({ title: "Run Discarded", description: "Run was too short to save.", variant: "destructive" });
      setLocation("/");
      return;
    }
    try {
      const id = await saveRun(runData);
      toast({ title: "Run Saved!", description: "Great job on your run." });
      setLocation(`/run/${id}`);
    } catch (e) {
      console.error(e);
      toast({ title: "Error Saving", description: "Could not save run locally.", variant: "destructive" });
      setLocation("/");
    }
  }, [stopRun, saveRun, setLocation]);

  const toggleLock = useCallback(() => {
    setIsLocked(prev => {
      toast({
        title: !prev ? "Controls Locked" : "Controls Unlocked",
        description: !prev ? "Tap lock icon to unlock" : "You can now interact",
        duration: 1500
      });
      return !prev;
    });
  }, []);

  const avgPace = distance > 0 ? (duration / 60) / (distance / 1000) : 0;

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden" data-testid="active-run-screen">

      <div
        className={clsx(
          "w-full relative shrink-0 transition-all duration-300 ease-out",
          mapFullscreen ? "absolute inset-0 z-0 h-full" : "h-[35%]"
        )}
      >
        <RunMap
          route={route}
          currentPosition={currentPosition}
          interactive={mapFullscreen}
          compact={!mapFullscreen}
          showRecenter={mapFullscreen}
        />

        {!mapFullscreen && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        )}

        <div className="absolute top-4 left-4 z-[1000]">
          {gpsError ? (
            <div className="flex items-center gap-1.5 bg-destructive/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-destructive" data-testid="gps-error">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{gpsError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/30" data-testid="gps-indicator">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">GPS</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setMapFullscreen(prev => !prev)}
          className="absolute top-4 right-4 z-[1000] bg-black/60 backdrop-blur-md border border-border/40 rounded-full p-2.5 active:scale-90 transition-transform"
          data-testid="button-toggle-map"
        >
          {mapFullscreen ? (
            <Minimize2 className="w-4 h-4 text-foreground" />
          ) : (
            <Maximize2 className="w-4 h-4 text-foreground" />
          )}
        </button>
      </div>

      {!mapFullscreen && (
        <div className="flex-1 flex flex-col relative z-10 px-6 pt-4 pb-8 animate-fade-in">
          <div className="text-center mb-2" data-testid="text-duration">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Duration</span>
            <div className="font-display text-7xl font-bold text-foreground leading-none tracking-tight mt-1">
              {formatDuration(duration)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 mb-auto">
            <div className="text-center" data-testid="text-distance">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Distance</span>
              <div className="font-display text-3xl font-bold text-foreground leading-none mt-1">
                {formatDistance(distance)}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">km</span>
            </div>
            <div className="text-center" data-testid="text-pace">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Pace</span>
              <div className="font-display text-3xl font-bold text-primary leading-none mt-1">
                {formatPace(currentPace)}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">/km</span>
            </div>
            <div className="text-center" data-testid="text-avg-pace">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Avg Pace</span>
              <div className="font-display text-3xl font-bold text-foreground leading-none mt-1">
                {formatPace(avgPace)}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">/km</span>
            </div>
          </div>

          {!isLocked ? (
            <div className="flex items-center justify-center gap-8 animate-fade-in">
              <button onClick={toggleLock} className="flex flex-col items-center gap-1.5" data-testid="button-lock">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border/50 active:scale-90 transition-transform">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Lock</span>
              </button>

              <button
                onClick={isPaused ? resumeRun : pauseRun}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_-8px_hsl(84,100%,59%)] active:scale-90 transition-transform"
                data-testid="button-pause-resume"
              >
                {isPaused ? (
                  <Play className="w-9 h-9 text-primary-foreground fill-primary-foreground ml-1" />
                ) : (
                  <Pause className="w-9 h-9 text-primary-foreground fill-primary-foreground" />
                )}
              </button>

              <button
                onClick={handleStop}
                disabled={!isPaused}
                className={clsx("flex flex-col items-center gap-1.5", !isPaused && "opacity-40")}
                data-testid="button-stop"
              >
                <div className={clsx(
                  "w-12 h-12 rounded-full flex items-center justify-center border active:scale-90 transition-transform",
                  isPaused
                    ? "bg-destructive border-destructive/80 shadow-lg shadow-destructive/20"
                    : "bg-secondary border-border/50"
                )}>
                  <Square className={clsx("w-5 h-5 fill-current", isPaused ? "text-destructive-foreground" : "text-muted-foreground")} />
                </div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Finish</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <button onClick={toggleLock} className="w-16 h-16 rounded-full bg-secondary border border-primary/40 flex items-center justify-center active:scale-90 transition-transform" data-testid="button-unlock">
                <Unlock className="w-7 h-7 text-primary" />
              </button>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Tap to Unlock</p>
            </div>
          )}
        </div>
      )}

      {mapFullscreen && (
        <div className="absolute bottom-6 left-4 right-4 z-[1000] bg-black/70 backdrop-blur-xl rounded-2xl border border-border/30 px-5 py-4 animate-slide-up">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center" data-testid="floating-duration">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Time</span>
              <div className="font-display text-2xl font-bold text-foreground leading-none mt-0.5">{formatDuration(duration)}</div>
            </div>
            <div className="text-center" data-testid="floating-distance">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Dist</span>
              <div className="font-display text-2xl font-bold text-foreground leading-none mt-0.5">{formatDistance(distance)} <span className="text-xs text-muted-foreground">km</span></div>
            </div>
            <div className="text-center" data-testid="floating-pace">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Pace</span>
              <div className="font-display text-2xl font-bold text-primary leading-none mt-0.5">{formatPace(currentPace)}</div>
            </div>

            <button
              onClick={isPaused ? resumeRun : pauseRun}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              data-testid="floating-pause-resume"
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
              ) : (
                <Pause className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
