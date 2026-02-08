import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up" data-testid="install-prompt">
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-xl text-primary shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display text-lg font-bold">Install App</h4>
            <p className="text-sm text-muted-foreground">Add to home screen for offline use</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 rounded-full transition-colors"
            data-testid="button-dismiss-install"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg text-sm"
            data-testid="button-install"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
