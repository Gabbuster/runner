import { useParams, Link } from "wouter";
import { useRun } from "@/hooks/use-runs";
import { StaticRunMap } from "@/components/Map";
import { RunStatsDisplay } from "@/components/RunStats";
import { ChevronLeft, Share2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function RunDetails() {
  const params = useParams();
  const id = Number(params.id);
  const { data: run, isLoading } = useRun(id);

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!run) return <div className="h-screen flex items-center justify-center">Run not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/activity">
          <button className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </Link>
        <div className="flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Run Details</span>
            <span className="text-sm font-medium">{format(new Date(run.startTime), 'MMM d, yyyy')}</span>
        </div>
        <button className="p-2 -mr-2 hover:bg-secondary rounded-full transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Map Section */}
        <div className="h-[300px] w-full bg-secondary relative">
          <StaticRunMap route={run.route} />
        </div>

        {/* Stats Content */}
        <div className="px-6 py-8 -mt-6 bg-background rounded-t-3xl relative z-10 border-t border-border/50">
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
             <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" />
                {format(new Date(run.startTime), 'h:mm a')}
             </div>
             <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                {run.status}
             </div>
          </div>

          <RunStatsDisplay 
             distance={run.distance}
             duration={run.duration}
             pace={run.avgPace}
          />

          <hr className="my-8 border-border" />

          {/* Splits or Badges (Placeholder) */}
          <h3 className="text-lg font-display text-foreground mb-4">Splits</h3>
          <div className="space-y-2">
            {[...Array(Math.floor(run.distance / 1000))].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                    <span className="font-mono text-muted-foreground text-sm">{i + 1} km</span>
                    <span className="font-mono font-bold text-foreground">
                        {/* Fake consistent pace for demo since splits aren't in DB yet */}
                        {run.avgPace && run.avgPace > 0 && isFinite(run.avgPace)
                          ? `${Math.floor(run.avgPace)}'${(run.avgPace % 1 * 60).toFixed(0).padStart(2, '0')}"`
                          : "--'--\""}
                    </span>
                </div>
            ))}
            {run.distance < 1000 && <div className="text-muted-foreground text-sm italic">Run too short for splits</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
