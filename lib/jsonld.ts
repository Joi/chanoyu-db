type Classification = {
  scheme: 'aat' | 'wikidata' | string;
  uri: string;
  label?: string | null;
  label_ja?: string | null;
};

type Media = { id: string; kind: string | null; uri: string; sort_order: number | null };

type ObjectRow = {
  id: string;
  token: string;
  local_number: string | null;
  title: string;
  title_ja: string | null;
  visibility: 'public' | 'private';
};

export function buildLinkedArtJSONLD(
  obj: ObjectRow,
  media: Media[],
  classifications: Classification[],
  baseId: string,
  idOverride?: string
) {
  const id = idOverride ?? baseId;

  const types = [
    ...classifications
      .filter((c) => c.scheme === 'aat' && c.uri)
      .map((c) => ({ id: c.uri, type: 'Type', _label: c.label ?? undefined })),
    ...classifications
      .filter((c) => c.scheme === 'wikidata' && c.uri)
      .map((c) => ({ id: c.uri, type: 'Type', _label: c.label ?? undefined })),
  ];

  const identified_by: any[] = [{ type: 'Name', content: obj.title }];
  if (obj.local_number) identified_by.push({ type: 'Identifier', content: obj.local_number });

  const image = media.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  const representation = image?.uri
    ? [{ id: image.uri, type: 'VisualItem', classified_as: [{ id: 'http://vocab.getty.edu/aat/300215302' }] }]
    : undefined;

  return {
    '@context': 'https://linked.art/ns/v1/linked-art.json',
    id,
    type: 'HumanMadeObject',
    identified_by,
    classified_as: types.length ? types : undefined,
    representation,
  };
}
