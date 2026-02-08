import { useState, useEffect, useRef } from "react";

export type GpsSignal = 'searching' | 'weak' | 'good' | 'unavailable';

export function useGpsStatus() {
  const [signal, setSignal] = useState<GpsSignal>('searching');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setSignal('unavailable');
      return;
    }

    setSignal('searching');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const acc = position.coords.accuracy;
        setAccuracy(Math.round(acc));
        if (acc <= 15) {
          setSignal('good');
        } else if (acc <= 50) {
          setSignal('weak');
        } else {
          setSignal('weak');
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setSignal('unavailable');
        } else {
          setSignal('searching');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { signal, accuracy };
}
