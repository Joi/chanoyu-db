import { z } from 'zod';

function normalizeDateToIso(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw; // let zod fail with message below
  return parsed.toISOString().slice(0, 10);
}

function normalizeTimeToHHMM(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw;
  const h = Math.max(0, Math.min(23, Number(m[1])));
  const mm = Math.max(0, Math.min(59, Number(m[2])));
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const createChakaiSchema = z.object({
  name_en: z.string().trim().max(200).optional(),
  name_ja: z.string().trim().max(200).optional(),
  event_date: z.string()
    .transform((s) => normalizeDateToIso(s))
    .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')), {
      message: 'Must be YYYY-MM-DD',
      path: ['event_date'],
    }),
  start_time: z.string()
    .optional()
    .or(z.literal(''))
    .transform((s) => normalizeTimeToHHMM(String(s || '')))
    .refine((s) => !s || /^\d{2}:\d{2}$/.test(String(s)), {
      message: 'Must be HH:MM',
      path: ['start_time'],
    }),
  visibility: z.enum(['open','members','closed']).default('open'),
  notes: z.string().max(4000).optional(),
  location_id: z.string().uuid().optional().or(z.literal('')),
  location_name_en: z.string().trim().max(200).optional(),
  location_name_ja: z.string().trim().max(200).optional(),
  location_address_en: z.string().trim().max(400).optional(),
  location_address_ja: z.string().trim().max(400).optional(),
  location_url: z.string().url().optional().or(z.literal('')),
  attendee_ids: z.string().optional().or(z.literal('')),
  item_ids: z.string().optional().or(z.literal('')),
});

export const updateChakaiSchema = createChakaiSchema.extend({
  id: z.string().uuid(),
});

export type ChakaiCreateInput = z.infer<typeof createChakaiSchema>;
export type ChakaiUpdateInput = z.infer<typeof updateChakaiSchema>;


