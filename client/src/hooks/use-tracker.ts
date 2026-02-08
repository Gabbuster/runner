import { useState, useRef, useEffect, useCallback } from 'react';
import { RoutePoint } from '@shared/schema';

// Accept only reasonably accurate points
const MAX_ACCEPTED_ACCURACY_M = 35;

// Reduce frequency of accepted points
const MIN_TIME_BETWEEN_POINTS_MS = 2000;     // accept at most every 2s
const MIN_DISTANCE_BETWEEN_POINTS_M = 5;     // or every 5m (whichever comes later)

// Reject unrealistic jumps
const MAX_JUMP_DISTANCE_M = 80;              // keep your current protection
const MAX_RUN_SPEED_MPS = 8;                 // ~28.8 km/h

// Reduce React re-renders (map + UI)
const UI_UPDATE_INTERVAL_MS = 500;           // update UI max 2 Hz

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
  const lastAcceptedTsRef = useRef<number>(0);
  const lastUiTsRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const lastAcceptedTsRef = useRef<number>(0); // last time we accepted/stored a point
  const lastUiTsRef = useRef<number>(0);       // last time we updated React UI


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
  const nowTs = pos.timestamp;

  // Throttle UI marker updates (reduce React rerenders)
  if (nowTs - lastUiTsRef.current >= 500) {
    lastUiTsRef.current = nowTs;
    setCurrentPosition([latitude, longitude]);
    setGpsError(null);
  }

  // If paused, don't record track points
  if (pausedRef.current) return;

  // Drop noisy points
  if (accuracy == null || accuracy > 35) return;

  const prev = routeRef.current;
  const last = prev.length > 0 ? prev[prev.length - 1] : null;

  if (last) {
    const dtMs = nowTs - last.timestamp;
    const dM = haversine(last.latitude, last.longitude, latitude, longitude);

    // Ignore GPS spikes
    if (dM > 80) return;

    // Key optimization: time + distance gate (prevents point spam)
    if (dtMs < 2000 && dM < 5) return;

    // Speed sanity check (reject unrealistic jumps)
    const computedSpeed = dtMs > 0 ? (dM / (dtMs / 1000)) : (speed ?? 0);
    if (computedSpeed > 8) return;

    // Accumulate distance only for accepted segments
    distanceRef.current += dM;
    setDistance(distanceRef.current);

    // Pace using computed speed (GPS speed is often null/unreliable)
    if (computedSpeed > 0.3) {
      setCurrentPace((1000 / computedSpeed) / 60);
    }
  }

  const point: RoutePoint = {
    latitude,
    longitude,
    timestamp: nowTs,
    accuracy,
    speed,
    heading,
  };

  // Keep full route in ref
  routeRef.current = [...prev, point];

  // Throttle map rerender (setRoute) to max 2 Hz
  if (nowTs - lastRouteUiTsRef.current >= 500) {
    lastRouteUiTsRef.current = nowTs;
    setRoute(routeRef.current);
  }
}
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
