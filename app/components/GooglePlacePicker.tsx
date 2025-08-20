"use client";

import { useEffect, useRef, useState } from 'react';

type Props = {
  apiKey?: string; // optional if already loaded elsewhere
  namePrefix: string; // e.g., "location" → will produce hidden inputs namePrefix_lat, _lng, _google_place_id, _google_maps_url
  label?: string;
  defaultQuery?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultPlaceId?: string | null;
  defaultMapsUrl?: string | null;
};

export default function GooglePlacePicker({ apiKey, namePrefix, label = 'Find on Google Maps', defaultQuery = '', defaultLat = null, defaultLng = null, defaultPlaceId = null, defaultMapsUrl = null }: Props) {
  const [query, setQuery] = useState(defaultQuery);
  const [loaded, setLoaded] = useState(false);
  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [placeId, setPlaceId] = useState<string | null>(defaultPlaceId);
  const [mapsUrl, setMapsUrl] = useState<string | null>(defaultMapsUrl);
  const [suggestedName, setSuggestedName] = useState<string | null>(defaultQuery || null);
  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    // If script already present, skip
    const existing = document.querySelector('script[data-maps-loader]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.places) {
        setLoaded(true);
        return;
      }
      existing.addEventListener('load', () => setLoaded(true));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-maps-loader', 'true');
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;
    if (!(window as any).google?.maps?.places) return;
    const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'url', 'place_id', 'name'],
    });
    autocompleteRef.current = ac;
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const ge = place.geometry;
      const loc = ge?.location;
      const latNum = typeof loc?.lat === 'function' ? Number(loc.lat()) : null;
      const lngNum = typeof loc?.lng === 'function' ? Number(loc.lng()) : null;
      const id = place.place_id || null;
      const url = (place as any).url || null;
      setLat(latNum);
      setLng(lngNum);
      setPlaceId(id);
      setMapsUrl(url);
      setSuggestedName(place.name || null);
      setSuggestedAddress(place.formatted_address || null);
      // If query was empty, populate with primary name or formatted address
      const q = place.name || place.formatted_address || '';
      if (q) setQuery(q);
    });
    return () => {
      // no API to destroy Autocomplete, just drop reference
      autocompleteRef.current = null;
    };
  }, [loaded]);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={`${namePrefix}-gmaps`}>{label}</label>
      <input id={`${namePrefix}-gmaps`} ref={inputRef} className="input" placeholder="Search Google Maps..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <input type="hidden" name={`${namePrefix}_query`} value={query ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_lat`} value={lat ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_lng`} value={lng ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_google_place_id`} value={placeId ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_google_maps_url`} value={mapsUrl ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_suggested_name`} value={suggestedName ?? ''} readOnly />
      <input type="hidden" name={`${namePrefix}_suggested_address`} value={suggestedAddress ?? ''} readOnly />
      {(lat != null && lng != null) ? (
        <iframe
          title="Map preview"
          className="w-full h-40 rounded border"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(String(lat)+','+String(lng))}&hl=en&z=15&output=embed`}
        />
      ) : null}
    </div>
  );
}


