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
};

// Minimal, map-first picker with a Google-provided search box on the map
export default function GoogleMapSearchPicker({ apiKey, namePrefix, label = 'Locate on Google Maps', defaultLat = 35.6809591, defaultLng = 139.7673068, defaultPlaceId = null, defaultQuery = '' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [placeId, setPlaceId] = useState<string | null>(defaultPlaceId);
  const [query, setQuery] = useState<string>(defaultQuery || '');
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);

  // Load Maps JS API with places library
  const resolvedKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const missingKey = !resolvedKey;
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = resolvedKey;
    if (!key) {
      setLoadError('Google Maps API key is not configured');
      return;
    }
    const existing = document.querySelector('script[data-maps-loader]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.places) {
        setLoaded(true);
        return;
      }
      existing.addEventListener('load', () => setLoaded(true));
      existing.addEventListener('error', () => setLoadError('Failed to load Google Maps script'));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,marker&v=weekly`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-maps-loader', 'true');
    s.onload = () => setLoaded(true);
    s.onerror = () => setLoadError('Failed to load Google Maps script');
    document.head.appendChild(s);
  }, [resolvedKey]);

  useEffect(() => {
    if (!loaded) return;
    const gm = (window as any).google?.maps;
    if (!gm || !containerRef.current) return;

    // Initialize map
    const map = new gm.Map(containerRef.current, {
      center: { lat: lat ?? defaultLat!, lng: lng ?? defaultLng! },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapRef.current = map;

    // Marker (AdvancedMarker if available)
    const marker = gm.marker?.AdvancedMarkerElement
      ? new gm.marker.AdvancedMarkerElement({ position: { lat: lat ?? defaultLat!, lng: lng ?? defaultLng! }, map })
      : new gm.Marker({ position: { lat: lat ?? defaultLat!, lng: lng ?? defaultLng! }, map });
    markerRef.current = marker;

    // Search box control
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search Google Maps...';
    input.className = 'input';
    input.style.width = '280px';
    inputRef.current = input as any;
    map.controls[gm.ControlPosition.TOP_LEFT].push(input);

    const searchBox = new gm.places.SearchBox(input);
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
        if ('position' in (marker as any)) {
          (marker as any).setPosition({ lat: newLat, lng: newLng });
        } else if ('position' in (marker as any)) {
          (marker as any).position = { lat: newLat, lng: newLng };
        }
        const url = pid
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newLat},${newLng}`)}&query_place_id=${encodeURIComponent(pid)}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newLat},${newLng}`)}`;
        setMapsUrl(url);
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
      setMapsUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${newLat},${newLng}`)}`);
      if ('setPosition' in (marker as any)) (marker as any).setPosition({ lat: newLat, lng: newLng });
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
      <input type="hidden" name={`${namePrefix}_query`} value={query ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_lat`} value={lat ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_lng`} value={lng ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_google_place_id`} value={placeId ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_google_maps_url`} value={mapsUrl ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_suggested_name`} value={suggestedName ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_suggested_address`} value={suggestedAddress ?? ''} readOnly />
    </div>
  );
}


