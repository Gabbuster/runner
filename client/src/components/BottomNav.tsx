import { Link, useLocation } from "wouter";
import { Home, Trophy, Settings, Activity, BarChart3 } from "lucide-react";
import { clsx } from "clsx";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: '/', icon: Home, label: 'Run' },
    { href: '/activity', icon: Activity, label: 'Activity' },
    { href: '/statistics', icon: BarChart3, label: 'Stats' },
    { href: '/badges', icon: Trophy, label: 'Badges' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (location === '/active-run') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-border/40 z-40" data-testid="bottom-nav">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} className="w-full h-full">
              <div className={clsx(
                "flex flex-col items-center justify-center h-full gap-0.5 transition-colors duration-150 cursor-pointer w-full relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )} data-testid={`nav-${label.toLowerCase()}`}>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
