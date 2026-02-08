import { useState, useRef, useEffect, useCallback } from 'react';
import { RoutePoint } from '@shared/schema';

const MIN_ACCURACY = 30;
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 80;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useRunTracker() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const distanceRef = useRef(0);
  const routeRef = useRef<RoutePoint[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(d => {
          const next = d + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isPaused]);

  const clearWatch = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const attachWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('GPS is not supported on this device');
      return;
    }
    clearWatch();
    setGpsError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!mountedRef.current) return;
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        setCurrentPosition([latitude, longitude]);
        setGpsError(null);

        if (pausedRef.current) return;
        if (accuracy > MIN_ACCURACY) return;

        const point: RoutePoint = {
          latitude, longitude,
          timestamp: pos.timestamp,
          accuracy, speed, heading
        };

        const prev = routeRef.current;
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const d = haversine(last.latitude, last.longitude, latitude, longitude);
          if (d >= MIN_DISTANCE && d <= MAX_DISTANCE) {
            distanceRef.current += d;
            setDistance(distanceRef.current);
            if (speed && speed > 0.3) {
              setCurrentPace((1000 / speed) / 60);
            }
          }
        }

        routeRef.current = [...prev, point];
        setRoute(routeRef.current);
      },
      (err) => {
        if (!mountedRef.current) return;
        if (err.code === 1) setGpsError('Location access denied. Please enable GPS permissions.');
        else if (err.code === 2) setGpsError('GPS signal unavailable. Move to an open area.');
        else setGpsError('GPS timed out. Retrying...');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, [clearWatch]);

  const getRunData = useCallback(() => {
    const d = distanceRef.current;
    const r = routeRef.current;
    const dur = durationRef.current;
    return {
      startTime: new Date(startTimeRef.current),
      endTime: new Date(),
      duration: dur,
      distance: d,
      route: r,
      avgPace: d > 0 ? (dur / 60) / (d / 1000) : 0,
      status: 'completed' as const
    };
  }, []);

  const startRun = useCallback(() => {
    routeRef.current = [];
    distanceRef.current = 0;
    durationRef.current = 0;
    pausedRef.current = false;
    startTimeRef.current = Date.now();
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setCurrentPace(0);
    setIsPaused(false);
    setIsActive(true);
    attachWatch();
  }, [attachWatch]);

  const pauseRun = useCallback(() => {
    setIsPaused(true);
    pausedRef.current = true;
  }, []);

  const resumeRun = useCallback(() => {
    setIsPaused(false);
    pausedRef.current = false;
  }, []);

  const stopRun = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    clearWatch();
    if (timerRef.current) clearInterval(timerRef.current);
    return getRunData();
  }, [clearWatch, getRunData]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearWatch();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clearWatch]);

  return {
    isActive, isPaused, distance, duration,
    currentPace, route, currentPosition, gpsError,
    startRun, pauseRun, resumeRun, stopRun, getRunData
  };
}
