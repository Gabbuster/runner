import { Volume2, Moon, Ruler } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [useMetric, setUseMetric] = useState(true);

  return (
    <div
      className="min-h-screen bg-background pb-24 px-6 pt-12 max-w-md mx-auto"
      data-testid="settings-screen"
    >
      <h1 className="text-4xl font-display font-bold text-foreground mb-8">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Toggles */}
        <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Voice Coach</span>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                audioEnabled ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  audioEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Units</span>
            </div>
            <button
              onClick={() => setUseMetric(!useMetric)}
              className="text-sm font-bold bg-secondary px-3 py-1 rounded-lg border border-border"
            >
              {useMetric ? "Metric (km)" : "Imperial (mi)"}
            </button>
          </div>

          <div className="p-4 flex items-center justify-between opacity-50 pointer-events-none">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Dark Mode</span>
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Always On
            </span>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-8">
          RunTracker v1.0.0 • Local-First
        </div>
      </div>
    </div>
  );
}
