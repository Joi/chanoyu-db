"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Initial = { value: string; label: string };

export default function SearchSelect({
  name,
  label,
  searchPath,
  valueKey,
  labelFields,
  initial,
  placeholder,
}: {
  name: string;
  label: string;
  searchPath: string;
  valueKey: string;
  labelFields: string[];
  initial?: Initial[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Initial[]>(() => Array.isArray(initial) ? initial : []);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Update selected state when initial prop changes (e.g., after page reload)
  useEffect(() => {
    if (Array.isArray(initial)) {
      setSelected(initial);
    }
  }, [initial]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        const r = await fetch(`${searchPath}?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' });
        if (!alive) return;
        if (!r.ok) {
          setResults([]);
          return;
        }
        const json = await r.json();
        setResults(Array.isArray(json) ? json : []);
        setOpen(true);
      } catch {
        if (alive) setResults([]);
      }
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, searchPath]);

  const hiddenValue = useMemo(() => selected.map(s => s.value).join(','), [selected]);

  function getLabel(row: any): string {
    for (const k of labelFields) {
      if (row && row[k]) return String(row[k]);
    }
    return '';
  }

  return (
    <div ref={containerRef} className="grid gap-2 relative">
      <label className="text-sm font-medium" htmlFor={`${name}-search`}>{label}</label>
      <input
        id={`${name}-search`}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${name}-listbox`}
        aria-autocomplete="list"
        placeholder={placeholder || `Search ${label.toLowerCase()}...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <input type="hidden" name={name} value={hiddenValue} readOnly />
      {open && results.length ? (
        <div id={`${name}-listbox`} role="listbox" className="card absolute left-0 right-0 bg-white border mt-1 p-2 max-h-64 overflow-auto z-30">
          {results.map((row: any, idx: number) => {
            const value = String(row[valueKey]);
            const labelText = getLabel(row) || '(unnamed)';
            const disabled = selected.some((s) => s.value === value);
            const isSelected = disabled;
            return (
              <button
                key={value + ':' + idx}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`block w-full text-left px-2 py-1 rounded ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                onClick={() => {
                  if (disabled) return;
                  setSelected((s) => [...s, { value, label: labelText }]);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {labelText}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="grid gap-1">
        {selected.map((s, i) => (
          <div key={s.value + ':' + i} className="text-sm">
            {s.label}
            <button
              type="button"
              className="ml-2 text-xs underline"
              onClick={() => setSelected((prev) => prev.filter((_, idx) => idx !== i))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


