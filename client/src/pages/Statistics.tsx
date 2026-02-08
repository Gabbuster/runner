import { useRuns } from "@/hooks/use-runs";
import { Link } from "wouter";
import { ChevronLeft, TrendingUp, Timer, Zap, Route, Trophy, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, Area, AreaChart } from "recharts";

function formatPace(pace: number): string {
  if (!pace || pace === Infinity || pace <= 0 || isNaN(pace)) return "--'--\"";
  const m = Math.floor(pace);
  const s = Math.floor((pace - m) * 60);
  return `${m}'${s.toString().padStart(2, '0')}"`;
}

function formatPaceShort(pace: number): string {
  if (!pace || pace === Infinity || pace <= 0 || isNaN(pace)) return "--:--";
  const m = Math.floor(pace);
  const s = Math.floor((pace - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PaceTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function PaceTooltip({ active, payload }: PaceTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <div className="text-muted-foreground mb-1">{data.dateLabel}</div>
      <div className="font-bold text-foreground">{formatPace(data.pace)} /km</div>
      <div className="text-muted-foreground">{(data.distance / 1000).toFixed(2)} km</div>
    </div>
  );
}

export default function Statistics() {
  const { data: runs, isLoading } = useRuns();

  if (isLoading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const completedRuns = (runs || []).filter(r => r.status === 'completed' && r.distance > 0 && r.avgPace > 0 && isFinite(r.avgPace));

  const chronologicalRuns = [...completedRuns].reverse();

  const chartData = chronologicalRuns.map((run, i) => ({
    index: i + 1,
    pace: Number(run.avgPace.toFixed(2)),
    distance: run.distance,
    dateLabel: format(new Date(run.startTime), 'MMM d'),
    duration: run.duration,
  }));

  const sortedByPace = [...completedRuns].sort((a, b) => a.avgPace - b.avgPace);
  const top3 = sortedByPace.slice(0, 3);

  const totalDistance = completedRuns.reduce((acc, r) => acc + r.distance, 0);
  const totalDuration = completedRuns.reduce((acc, r) => acc + r.duration, 0);
  const totalRuns = completedRuns.length;
  const avgPaceAll = totalRuns > 0 ? (totalDuration / 60) / (totalDistance / 1000) : 0;
  const bestPace = top3.length > 0 ? top3[0].avgPace : 0;
  const longestRun = completedRuns.reduce((max, r) => r.distance > max ? r.distance : max, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);

  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
  const medalBgs = ['bg-yellow-400/10 border-yellow-400/30', 'bg-gray-300/10 border-gray-300/30', 'bg-amber-600/10 border-amber-600/30'];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24" data-testid="statistics-screen">
      <div className="px-6 pt-8 pb-4 flex items-center gap-3">
        <Link href="/">
          <button className="p-2 -ml-2 rounded-full active:scale-90 transition-transform" data-testid="button-back-stats">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground">Statistics</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {totalRuns === 0 ? (
          <div className="text-center py-16 text-muted-foreground" data-testid="text-no-stats">
            Complete your first run to see statistics.
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Route} label="Total Distance" value={`${(totalDistance / 1000).toFixed(1)} km`} color="text-primary" />
              <StatCard icon={Timer} label="Total Time" value={totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins} min`} color="text-accent" />
              <StatCard icon={Zap} label="Best Pace" value={formatPace(bestPace)} color="text-yellow-400" />
              <StatCard icon={TrendingUp} label="Avg Pace" value={formatPace(avgPaceAll)} color="text-primary" />
              <StatCard icon={Calendar} label="Total Runs" value={`${totalRuns}`} color="text-accent" />
              <StatCard icon={Route} label="Longest Run" value={`${(longestRun / 1000).toFixed(2)} km`} color="text-primary" />
            </div>

            {top3.length > 0 && (
              <div data-testid="top3-podium">
                <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Top 3 Fastest Paces
                </h2>
                <div className="space-y-2">
                  {top3.map((run, i) => (
                    <Link key={run.localId} href={`/run/${run.localId}`} className="block">
                      <div
                        className={`flex items-center gap-4 p-4 rounded-2xl border ${medalBgs[i]} transition-transform active:scale-[0.98]`}
                        data-testid={`top-pace-${i + 1}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0">
                          <span className={`font-display text-2xl font-bold ${medalColors[i]}`}>{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-foreground text-sm">
                            {format(new Date(run.startTime), "EEEE 'Run'")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(run.startTime), 'MMM d')} - {(run.distance / 1000).toFixed(2)} km
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-display text-2xl font-bold ${medalColors[i]}`}>
                            {formatPace(run.avgPace)}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">/km</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {chartData.length >= 2 && (
              <div data-testid="pace-chart">
                <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Pace Over Time
                </h2>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(84, 100%, 59%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(84, 100%, 59%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fill: 'hsl(240, 5%, 64.9%)', fontSize: 10 }}
                          axisLine={{ stroke: 'hsl(240, 3.7%, 15.9%)' }}
                          tickLine={false}
                        />
                        <YAxis
                          reversed
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                          tick={{ fill: 'hsl(240, 5%, 64.9%)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => formatPaceShort(v)}
                        />
                        <Tooltip content={<PaceTooltip />} />
                        {avgPaceAll > 0 && isFinite(avgPaceAll) && (
                          <ReferenceLine
                            y={Number(avgPaceAll.toFixed(2))}
                            stroke="hsl(240, 5%, 64.9%)"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="pace"
                          stroke="hsl(84, 100%, 59%)"
                          strokeWidth={2.5}
                          fill="url(#paceGradient)"
                          dot={{ r: 4, fill: 'hsl(84, 100%, 59%)', stroke: 'hsl(240, 10%, 6%)', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: 'hsl(84, 100%, 59%)', stroke: 'white', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
                      Avg Pace per Run
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t border-dashed border-muted-foreground inline-block" />
                      Overall Avg
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Lower is faster. Y-axis shows min/km.</p>
                </div>
              </div>
            )}

            {chartData.length === 1 && (
              <div className="bg-card border border-border rounded-2xl p-6 text-center" data-testid="text-chart-hint">
                <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Complete one more run to see your pace trend chart.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <div className="font-display text-xl font-bold text-foreground leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">{label}</div>
    </div>
  );
}
