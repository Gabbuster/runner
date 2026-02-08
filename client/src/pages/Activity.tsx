import { useState } from "react";
import { useRuns, useDeleteRun } from "@/hooks/use-runs";
import { Link } from "wouter";
import { format } from "date-fns";
import { ChevronRight, MapPin, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Activity() {
  const { data: runs, isLoading } = useRuns();
  const { mutateAsync: deleteRun, isPending: isDeleting } = useDeleteRun();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleDelete = async (localId: number) => {
    try {
      await deleteRun(localId);
      setDeleteTarget(null);
      toast({ title: "Run Deleted", description: "The activity has been removed." });
    } catch {
      toast({ title: "Error", description: "Could not delete run.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-24 px-6 pt-12 max-w-md mx-auto" data-testid="activity-screen">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
        <h1 className="text-4xl font-display font-bold text-foreground">Activity</h1>
        {runs && runs.length > 0 && (
          <button
            onClick={() => { setEditMode(!editMode); setDeleteTarget(null); }}
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground active:scale-95 transition-transform"
            data-testid="button-edit-activities"
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      <div className="space-y-3 animate-fade-in">
        {runs?.map((run, index) => (
          <div
            key={run.localId}
            className="animate-fade-in relative"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {editMode && (
              <button
                onClick={() => setDeleteTarget(run.localId!)}
                className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-destructive flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                data-testid={`button-delete-run-${run.localId}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive-foreground" />
              </button>
            )}

            <Link href={editMode ? "#" : `/run/${run.localId}`}>
              <div
                className={`bg-card border border-border rounded-2xl p-4 cursor-pointer group transition-all ${editMode ? 'ml-8' : ''}`}
                data-testid={`card-run-${run.localId}`}
              >
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">
                        {format(new Date(run.startTime), "EEEE 'Run'")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(run.startTime), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                  {!editMode && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Dist</div>
                    <div className="font-display text-xl text-foreground">{(run.distance / 1000).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Time</div>
                    <div className="font-display text-xl text-foreground">{Math.floor(run.duration / 60)}:{String(run.duration % 60).padStart(2, '0')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pace</div>
                    <div className="font-display text-xl text-foreground">
                      {run.avgPace && run.avgPace > 0 && isFinite(run.avgPace)
                        ? `${Math.floor(run.avgPace)}'${Math.floor((run.avgPace % 1) * 60).toString().padStart(2, '0')}"`
                        : "--'--\""}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {runs?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-activity">
            No runs recorded yet.
          </div>
        )}
      </div>

      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-8" data-testid="delete-confirm-dialog">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Delete Run?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-bold text-sm active:scale-95 transition-transform"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
                data-testid="button-confirm-delete"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
