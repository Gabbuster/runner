import { RoutePoint } from "@shared/schema";

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function compressRouteForStorage(route: RoutePoint[]) {
  if (route.length <= 2) return route;

  const out: RoutePoint[] = [];
  let lastKept = route[0];
  out.push({
    latitude: +lastKept.latitude.toFixed(5),
    longitude: +lastKept.longitude.toFixed(5),
    timestamp: lastKept.timestamp,
    accuracy: Math.round(lastKept.accuracy),
    speed: null,
    heading: null,
  });

  const MIN_DT_MS = 5000; // store at most every 5s...
  const MIN_D_M = 10;     // ...or every 10m

  for (let i = 1; i < route.length - 1; i++) {
    const p = route[i];
    const dt = p.timestamp - lastKept.timestamp;
    const d = haversineMeters(lastKept.latitude, lastKept.longitude, p.latitude, p.longitude);

    if (dt < MIN_DT_MS && d < MIN_D_M) continue;

    out.push({
      latitude: +p.latitude.toFixed(5),
      longitude: +p.longitude.toFixed(5),
      timestamp: p.timestamp,
      accuracy: Math.round(p.accuracy),
      speed: null,
      heading: null,
    });

    lastKept = p;
  }

  const last = route[route.length - 1];
  out.push({
    latitude: +last.latitude.toFixed(5),
    longitude: +last.longitude.toFixed(5),
    timestamp: last.timestamp,
    accuracy: Math.round(last.accuracy),
    speed: null,
    heading: null,
  });

  return out;
}

