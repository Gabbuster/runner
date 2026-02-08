## Packages
idb | Promise-based IndexedDB wrapper for local-first storage
leaflet | Maps library
react-leaflet | React components for Leaflet
recharts | Charts for pace/elevation visualization
framer-motion | Smooth transitions and animations
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  sans: ["var(--font-sans)"],
  mono: ["var(--font-mono)"],
}

Integration assumptions:
- Map tiles: OpenStreetMap (free, no API key required)
- Voice Synthesis: Browser native `window.speechSynthesis`
- Geolocation: Browser native `navigator.geolocation`
