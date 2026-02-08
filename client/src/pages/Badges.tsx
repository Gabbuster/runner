import { useBadges } from "@/hooks/use-runs";
import { Medal, Star, Flame, Clock } from "lucide-react";
import { clsx } from "clsx";

const BADGE_CONFIG: Record<string, { icon: any, label: string, color: string }> = {
  'first_run': { icon: Star, label: "First Run", color: "text-yellow-400" },
  '5k': { icon: Medal, label: "5K Crusher", color: "text-blue-400" },
  '10k': { icon: Medal, label: "10K Warrior", color: "text-purple-400" },
  'early_bird': { icon: Clock, label: "Early Bird", color: "text-orange-400" },
  'fast_1k': { icon: Flame, label: "Speed Demon", color: "text-red-400" },
};

export default function Badges() {
  const { data: userBadges } = useBadges();

  const unlockedTypes = new Set(userBadges?.map(b => b.badgeType));

  return (
    <div className="min-h-screen bg-background pb-24 px-6 pt-12 max-w-md mx-auto" data-testid="badges-screen">
      <h1 className="text-4xl font-display font-bold text-foreground mb-2">Achievements</h1>
      <p className="text-muted-foreground mb-8">Unlock badges by pushing your limits.</p>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(BADGE_CONFIG).map(([type, config], index) => {
          const isUnlocked = unlockedTypes.has(type);
          const Icon = config.icon;

          return (
            <div
              key={type}
              className={clsx(
                "aspect-square rounded-3xl border flex flex-col items-center justify-center p-4 text-center animate-fade-in",
                isUnlocked
                  ? "bg-secondary/40 border-primary/20"
                  : "bg-secondary/10 border-border opacity-50 grayscale"
              )}
              style={{ animationDelay: `${index * 80}ms` }}
              data-testid={`badge-${type}`}
            >
              <div className={clsx(
                "w-16 h-16 rounded-full flex items-center justify-center mb-3 text-white shadow-lg",
                isUnlocked ? "bg-gradient-to-br from-gray-700 to-black" : "bg-gray-800"
              )}>
                <Icon className={clsx("w-8 h-8", isUnlocked ? config.color : "text-gray-500")} />
              </div>
              <h3 className="font-bold text-sm text-foreground">{config.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isUnlocked ? "Unlocked" : "Locked"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
