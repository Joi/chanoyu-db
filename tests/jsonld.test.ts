import { describe, it, expect } from 'vitest';
import { buildLinkedArtJSONLD } from '../lib/jsonld';

describe('buildLinkedArtJSONLD', () => {
  it('includes AAT and Wikidata types when provided', () => {
    const obj: any = {
      id: 'uuid', token: 'tok', title: 'Title', title_ja: null, summary: null, summary_ja: null, visibility: 'public'
    };
    const media: any[] = [];
    const classifications: any[] = [
      { scheme: 'aat', uri: 'http://vocab.getty.edu/aat/300123', label: 'X' },
      { scheme: 'wikidata', uri: 'https://www.wikidata.org/entity/Q42', label: 'Y' },
    ];
    const jsonld = buildLinkedArtJSONLD(obj, media, classifications, 'https://example.com/id/tok');
    expect(jsonld.classified_as?.length).toBe(2);
    const ids = (jsonld.classified_as || []).map((t: any) => t.id);
    expect(ids).toContain('http://vocab.getty.edu/aat/300123');
    expect(ids).toContain('https://www.wikidata.org/entity/Q42');
  });
});
