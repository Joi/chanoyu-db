"use client";

import { useEffect, useRef, useState } from 'react';

type Props = {
  apiKey?: string;
  namePrefix: string; // uses same hidden field names as GooglePlacePicker
  label?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultPlaceId?: string | null;
  defaultQuery?: string;
  defaultMapsUrl?: string | null;
};

// Minimal, map-first picker with a Google-provided search box on the map
export default function GoogleMapSearchPicker({ apiKey, namePrefix, label = 'Locate on Google Maps', defaultLat, defaultLng, defaultPlaceId = null, defaultQuery = '', defaultMapsUrl = null }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [lat, setLat] = useState<number | null>(typeof defaultLat === 'number' ? defaultLat : null);
  const [lng, setLng] = useState<number | null>(typeof defaultLng === 'number' ? defaultLng : null);
  const [placeId, setPlaceId] = useState<string | null>(defaultPlaceId);
  const [query, setQuery] = useState<string>(defaultQuery || '');
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  // Draft (what user is currently positioning)
  const [mapsUrl, setMapsUrl] = useState<string | null>(defaultMapsUrl);
  const [currentZoom, setCurrentZoom] = useState<number>(14);
  // Committed (written to hidden inputs only after explicit Save)
  const [savedLat, setSavedLat] = useState<number | null>(typeof defaultLat === 'number' ? defaultLat : null);
  const [savedLng, setSavedLng] = useState<number | null>(typeof defaultLng === 'number' ? defaultLng : null);
  const [savedPlaceId, setSavedPlaceId] = useState<string | null>(defaultPlaceId || null);
  const [savedMapsUrl, setSavedMapsUrl] = useState<string | null>(defaultMapsUrl || null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Load Maps JS API with places library
  const resolvedKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const missingKey = !resolvedKey;
  const [loadError, setLoadError] = useState<string | null>(null);
  function logError(msg: string) {
    try { console.error('[GoogleMapSearchPicker]', msg); } catch {}
  }
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = resolvedKey;
    if (!key) {
      setLoadError('Google Maps API key is not configured');
      logError('Google Maps API key is not configured');
      return;
    }
    const existing = document.querySelector('script[data-maps-loader]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.places) {
        setLoaded(true);
        return;
      }
      existing.addEventListener('load', () => setLoaded(true));
      existing.addEventListener('error', () => { setLoadError('Failed to load Google Maps script'); logError('Failed to load Google Maps script'); });
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-maps-loader', 'true');
    s.onload = () => setLoaded(true);
    s.onerror = () => { setLoadError('Failed to load Google Maps script'); logError('Failed to load Google Maps script'); };
    document.head.appendChild(s);
  }, [resolvedKey]);

  useEffect(() => {
    if (!loaded) return;
    const gm = (window as any).google?.maps;
    if (!gm) {
      setLoadError('Google Maps not available in this environment');
      logError('Google Maps not available in this environment');
      return;
    }
    if (!containerRef.current) return;

    // Compute safe center (handle nulls coming from server)
    const centerLat = typeof lat === 'number' ? lat : (typeof defaultLat === 'number' ? defaultLat : 35.6809591);
    const centerLng = typeof lng === 'number' ? lng : (typeof defaultLng === 'number' ? defaultLng : 139.7673068);

    // Initialize map
    const map = new gm.Map(containerRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapRef.current = map;
    setCurrentZoom(map.getZoom() || 14);

    function computeMapsUrl(latValue: number, lngValue: number, zoomValue?: number): string {
      const z = typeof zoomValue === 'number' ? zoomValue : (map.getZoom() || 17);
      return `https://www.google.com/maps/@?api=1&map_action=map&center=${encodeURIComponent(String(latValue))},${encodeURIComponent(String(lngValue))}&zoom=${encodeURIComponent(String(z))}`;
    }

    // Marker (always classic Marker to avoid Map ID requirement)
    const marker: any = new gm.Marker({ position: { lat: centerLat, lng: centerLng }, map });
    markerRef.current = marker;

    // Search box control
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search Google Maps...';
    input.className = 'input';
    input.style.width = '280px';
    // Prevent Enter from submitting the parent form
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') e.preventDefault();
    });
    inputRef.current = input as any;
    map.controls[gm.ControlPosition.TOP_LEFT].push(input);

    let searchBox: any = null;
    try {
      searchBox = new gm.places.SearchBox(input);
    } catch (e) {
      setLoadError('Google Places SearchBox failed to initialize');
      logError('Google Places SearchBox failed to initialize');
      return;
    }
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces() || [];
      if (!places.length) return;
      const p = places[0];
      const loc = p.geometry?.location;
      const newLat = loc ? Number(loc.lat()) : null;
      const newLng = loc ? Number(loc.lng()) : null;
      setQuery(p.name || p.formatted_address || '');
      setSuggestedName(p.name || null);
      setSuggestedAddress(p.formatted_address || null);
      const pid = p.place_id || null;
      setPlaceId(pid);
      if (newLat != null && newLng != null) {
        setLat(newLat);
        setLng(newLng);
        map.panTo({ lat: newLat, lng: newLng });
        map.setZoom(18);
        setCurrentZoom(18);
        if ('position' in (marker as any)) {
          (marker as any).setPosition({ lat: newLat, lng: newLng });
        } else if ('position' in (marker as any)) {
          (marker as any).position = { lat: newLat, lng: newLng };
        }
        setMapsUrl(computeMapsUrl(newLat, newLng, 18));
      }
    });

    // Click to move marker
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const newLat = Number(e.latLng.lat());
      const newLng = Number(e.latLng.lng());
      setLat(newLat);
      setLng(newLng);
      setPlaceId(null);
      map.setZoom(18);
      setCurrentZoom(18);
      setMapsUrl(computeMapsUrl(newLat, newLng, 18));
      if ('setPosition' in (marker as any)) (marker as any).setPosition({ lat: newLat, lng: newLng });
    });

    map.addListener('zoom_changed', () => {
      const z = map.getZoom() || 14;
      setCurrentZoom(z);
      if (lat != null && lng != null) {
        setMapsUrl(computeMapsUrl(lat, lng, z));
      }
    });

    return () => {
      // let GC clean up
      markerRef.current = null as any;
      mapRef.current = null as any;
    };
  }, [loaded]);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div ref={containerRef} style={{ width: '100%', height: 320 }} className="border rounded" />
      {(missingKey || loadError) ? (
        <div className="text-xs text-red-600">
          {missingKey ? 'Google Maps key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.' : loadError}
        </div>
      ) : null}
      <div className="flex items-center gap-2 text-xs text-gray-700">
        <button type="button" className="button secondary" onClick={() => { if (mapRef.current) { mapRef.current.setZoom(18); setCurrentZoom(18); if (lat != null && lng != null) setMapsUrl(`https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=18`); } }}>Zoom to building</button>
        <span>Zoom: {currentZoom}</span>
        {(savedLat !== lat || savedLng !== lng || savedMapsUrl !== mapsUrl) ? <span className="text-amber-600">Not saved</span> : <span className="text-green-600">Saved</span>}
        <button
          type="button"
          className="button"
          disabled={!(savedLat !== lat || savedLng !== lng || savedMapsUrl !== mapsUrl)}
          onClick={() => {
            setSavedLat(lat);
            setSavedLng(lng);
            setSavedPlaceId(placeId);
            setSavedMapsUrl(mapsUrl);
            setSaveStatus('saved');
            window.setTimeout(() => setSaveStatus('idle'), 2000);
          }}
        >{saveStatus === 'saved' ? 'Saved ✔' : 'Save map selection'}</button>
      </div>
      <div className="text-xs text-gray-600" aria-live="polite">
        {saveStatus === 'saved' ? 'Map selection saved. Click the page Save button to persist changes.' : ''}
      </div>
      {(mapsUrl && lat != null && lng != null) ? (
        <div className="grid gap-1">
          <label className="text-xs">Google Maps Link</label>
          <div className="flex items-center gap-2">
            <input className="input" readOnly value={mapsUrl} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(mapsUrl || ''); } catch {} }}>Copy</button>
            <a className="button" href={mapsUrl} target="_blank" rel="noreferrer">Open</a>
          </div>
        </div>
      ) : null}
      <input type="hidden" name={`${namePrefix}_query`} value={query ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_lat`} value={savedLat ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_lng`} value={savedLng ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_google_place_id`} value={savedPlaceId ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_google_maps_url`} value={savedMapsUrl ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_suggested_name`} value={suggestedName ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_suggested_address`} value={suggestedAddress ?? ''} readOnly />
    </div>
  );
}


