import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, ZoomControl } from 'react-leaflet';
import { RoutePoint } from '@shared/schema';
import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { Crosshair } from 'lucide-react';

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
const LABEL_TILES = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function MapController({
  position,
  followUser,
  onUserInteraction
}: {
  position: [number, number] | null;
  followUser: boolean;
  onUserInteraction: () => void;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const handler = () => onUserInteraction();
    map.on('dragstart', handler);
    map.on('zoomstart', handler);
    return () => {
      map.off('dragstart', handler);
      map.off('zoomstart', handler);
    };
  }, [map, onUserInteraction]);

  useEffect(() => {
    if (position && followUser) {
      if (!hasInitialized.current) {
        map.setView(position, 16, { animate: false });
        hasInitialized.current = true;
      } else {
        map.panTo(position, { animate: true, duration: 0.5 });
      }
    }
  }, [position, followUser, map]);

  return null;
}

interface MapProps {
  route: RoutePoint[];
  currentPosition: [number, number] | null;
  interactive?: boolean;
  compact?: boolean;
  showRecenter?: boolean;
  className?: string;
}

export function RunMap({ route, currentPosition, interactive = true, compact = false, showRecenter = true, className = '' }: MapProps) {
  const [followUser, setFollowUser] = useState(true);
  const positions: [number, number][] = route.map(p => [p.latitude, p.longitude]);
  const center: [number, number] = currentPosition || [41.9028, 12.4964];

  const handleUserInteraction = useCallback(() => {
    setFollowUser(false);
  }, []);

  const handleRecenter = useCallback(() => {
    setFollowUser(true);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`} data-testid="map-container">
      <MapContainer
        center={center}
        zoom={compact ? 15 : 16}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full run-map"
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        <TileLayer url={LABEL_TILES} opacity={0.35} />

        {positions.length > 1 && (
          <>
            <Polyline
              positions={positions}
              pathOptions={{
                color: 'rgba(0,0,0,0.4)',
                weight: 7,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#b0ff2b',
                weight: 4,
                lineCap: 'round',
                lineJoin: 'round',
                opacity: 0.95,
              }}
            />
          </>
        )}

        {currentPosition && (
          <>
            <CircleMarker
              center={currentPosition}
              radius={18}
              pathOptions={{
                fillColor: '#b0ff2b',
                fillOpacity: 0.12,
                stroke: false,
              }}
              className="runner-pulse-ring"
            />
            <CircleMarker
              center={currentPosition}
              radius={8}
              pathOptions={{
                fillColor: '#b0ff2b',
                fillOpacity: 0.25,
                stroke: false,
              }}
            />
            <CircleMarker
              center={currentPosition}
              radius={5}
              pathOptions={{
                fillColor: '#ffffff',
                fillOpacity: 1,
                color: '#b0ff2b',
                weight: 3,
                opacity: 1,
              }}
            />
          </>
        )}

        <MapController
          position={currentPosition}
          followUser={followUser}
          onUserInteraction={handleUserInteraction}
        />

        {interactive && !compact && <ZoomControl position="topright" />}
      </MapContainer>

      {showRecenter && !followUser && interactive && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-4 right-4 z-[1000] bg-card/80 backdrop-blur-md border border-border/50 rounded-full p-3 shadow-lg active:scale-95 transition-transform"
          data-testid="button-recenter"
        >
          <Crosshair className="w-5 h-5 text-primary" />
        </button>
      )}
    </div>
  );
}

interface StaticMapProps {
  route: RoutePoint[];
  className?: string;
}

export function StaticRunMap({ route, className = '' }: StaticMapProps) {
  const positions: [number, number][] = route.map(p => [p.latitude, p.longitude]);
  if (positions.length === 0) return null;

  const midIdx = Math.floor(positions.length / 2);
  const center = positions[midIdx] || positions[0];

  return (
    <div className={`relative w-full h-full ${className}`} data-testid="static-map">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full run-map"
      >
        <TileLayer url={TILES} attribution={ATTRIBUTION} />

        {positions.length > 1 && (
          <>
            <Polyline
              positions={positions}
              pathOptions={{
                color: 'rgba(0,0,0,0.3)',
                weight: 6,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#b0ff2b',
                weight: 3,
                lineCap: 'round',
                lineJoin: 'round',
                opacity: 0.9,
              }}
            />
          </>
        )}

        <CircleMarker
          center={positions[0]}
          radius={4}
          pathOptions={{ fillColor: '#22c55e', fillOpacity: 1, color: '#fff', weight: 2 }}
        />
        <CircleMarker
          center={positions[positions.length - 1]}
          radius={4}
          pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: '#fff', weight: 2 }}
        />
      </MapContainer>
    </div>
  );
}
