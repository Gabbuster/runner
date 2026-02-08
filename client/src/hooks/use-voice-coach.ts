import { useEffect, useRef } from 'react';

const QUOTES = [
  "Pain is temporary. Pride is forever.",
  "Your legs are not giving out. Your head is giving up. Keep going.",
  "Run when you can, walk if you have to, crawl if you must; just never give up.",
  "The miracle isn't that I finished. The miracle is that I had the courage to start.",
  "Clear your mind of can't."
];

export function useVoiceCoach(distance: number, isActive: boolean, isPaused: boolean) {
  const lastAnnouncedKm = useRef(0);

  useEffect(() => {
    if (!isActive || isPaused) return;

    const currentKm = Math.floor(distance / 1000);
    
    if (currentKm > 0 && currentKm > lastAnnouncedKm.current) {
      lastAnnouncedKm.current = currentKm;
      
      const utterance = new SpeechSynthesisUtterance();
      const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      
      utterance.text = `Distance: ${currentKm} kilometers. Keep pushing. ${quote}`;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [distance, isActive, isPaused]);
}
