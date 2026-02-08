import { Link, useLocation } from "wouter";
import { Play, TrendingUp, History, Navigation, Signal, SignalLow, SignalZero } from "lucide-react";
import { useRuns } from "@/hooks/use-runs";
import { useGpsStatus, GpsSignal } from "@/hooks/use-gps-status";
import { InstallPrompt } from "@/components/InstallPrompt";
import { format } from "date-fns";

function GpsIndicator({ signal, accuracy }: { signal: GpsSignal; accuracy: number | null }) {
  const config: Record<GpsSignal, { color: string; bg: string; border: string; label: string; icon: typeof Signal }> = {
    good: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', label: 'GPS Ready', icon: Signal },
    weak: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: 'Weak Signal', icon: SignalLow },
    searching: { color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border/50', label: 'Searching...', icon: SignalZero },
    unavailable: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: 'No GPS', icon: SignalZero },
  };

  const { color, bg, border, label, icon: Icon } = config[signal];

  return (
    <div className={`flex items-center gap-2 ${bg} ${border} border rounded-full px-3 py-1.5`} data-testid="gps-status">
      <div className="relative">
        <Icon className={`w-4 h-4 ${color}`} />
        {signal === 'searching' && (
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-muted-foreground animate-pulse`} />
        )}
        {signal === 'good' && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
        )}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
      {accuracy !== null && signal !== 'unavailable' && signal !== 'searching' && (
        <span className="text-[9px] text-muted-foreground font-mono">{accuracy}m</span>
      )}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: runs, isLoading } = useRuns();
  const { signal, accuracy } = useGpsStatus();

  const recentRun = runs && runs.length > 0 ? runs[0] : null;
  const totalDistance = runs?.reduce((acc, run) => acc + run.distance, 0) || 0;

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background px-6 pt-12 max-w-md mx-auto" data-testid="home-screen">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-4xl font-display font-bold text-foreground">
            Ready to<br />
            <span className="text-primary">Run?</span>
          </h1>
          <GpsIndicator signal={signal} accuracy={accuracy} />
        </div>
      </header>

      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => setLocation('/active-run')}
          className="group w-full aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center transition-transform active:scale-[0.97]"
          data-testid="button-start-run"
        >
          <div className="relative z-10 bg-black/20 p-6 rounded-full backdrop-blur-sm mb-4 border border-white/10">
            <Play className="w-12 h-12 text-white fill-white ml-1" />
          </div>
          <span className="relative z-10 font-display text-3xl font-bold text-white tracking-wide uppercase">Start Run</span>
          {signal === 'good' && (
            <span className="relative z-10 mt-2 text-xs text-white/70 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-3 h-3" /> GPS Locked
            </span>
          )}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between h-32" data-testid="stat-total-distance">
            <TrendingUp className="w-6 h-6 text-accent mb-2" />
            <div>
              <div className="text-2xl font-display font-bold text-foreground">
                {(totalDistance / 1000).toFixed(1)} <span className="text-sm text-muted-foreground font-sans font-normal">km</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Distance</div>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between h-32" data-testid="stat-total-runs">
            <History className="w-6 h-6 text-primary mb-2" />
            <div>
              <div className="text-2xl font-display font-bold text-foreground">
                {runs?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Runs</div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg text-foreground">Recent Activity</h3>
            <Link href="/activity" className="text-primary text-sm font-semibold" data-testid="link-view-all">View All</Link>
          </div>

          {recentRun ? (
            <Link href={`/run/${recentRun.localId}`} className="block" data-testid="link-recent-run">
              <div className="bg-secondary/50 rounded-2xl p-4 flex items-center gap-4 transition-colors cursor-pointer border border-border/50">
                <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp className="text-muted-foreground w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground truncate">
                    {format(new Date(recentRun.startTime), "EEEE 'Run'")}
                  </h4>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>{(recentRun.distance / 1000).toFixed(2)} km</span>
                    <span>{Math.floor(recentRun.duration / 60)} min</span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border" data-testid="text-no-runs">
              No runs yet. Start your first one!
            </div>
          )}
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
