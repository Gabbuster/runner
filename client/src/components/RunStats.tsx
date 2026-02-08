import { clsx } from "clsx";

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Stat({ label, value, unit, size = 'md', className }: StatProps) {
  return (
    <div className={clsx("flex flex-col", className)}>
      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={clsx("font-display font-bold leading-none tracking-tight", {
          'text-2xl': size === 'sm',
          'text-4xl': size === 'md',
          'text-6xl': size === 'lg',
          'text-8xl': size === 'xl',
        })}>
          {value}
        </span>
        {unit && <span className="text-muted-foreground font-medium text-sm">{unit}</span>}
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number) {
  return (meters / 1000).toFixed(2);
}

function formatPace(pace: number) {
  if (!pace || pace === Infinity) return "0:00";
  const m = Math.floor(pace);
  const s = Math.floor((pace - m) * 60);
  return `${m}'${s.toString().padStart(2, '0')}"`;
}

interface RunStatsDisplayProps {
  duration: number;
  distance: number;
  pace: number;
}

export function RunStatsDisplay({ duration, distance, pace }: RunStatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-8 w-full">
      <Stat 
        label="Distance" 
        value={formatDistance(distance)} 
        unit="km" 
        size="lg"
        className="col-span-2 text-center items-center"
      />
      <Stat 
        label="Duration" 
        value={formatDuration(duration)} 
        size="md"
      />
      <Stat 
        label="Avg Pace" 
        value={formatPace(pace)} 
        unit="/km" 
        size="md"
        className="items-end text-right"
      />
    </div>
  );
}
