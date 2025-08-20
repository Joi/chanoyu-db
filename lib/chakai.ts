import { z } from 'zod';

export const createChakaiSchema = z.object({
  name_en: z.string().trim().max(200).optional(),
  name_ja: z.string().trim().max(200).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  visibility: z.enum(['open','members','closed']).default('open'),
  notes: z.string().max(4000).optional(),
  location_id: z.string().uuid().optional().or(z.literal('')),
  location_name: z.string().trim().max(200).optional(),
  location_address: z.string().trim().max(400).optional(),
  location_url: z.string().url().optional().or(z.literal('')),
  attendee_ids: z.string().optional().or(z.literal('')),
  item_ids: z.string().optional().or(z.literal('')),
});

export const updateChakaiSchema = createChakaiSchema.extend({
  id: z.string().uuid(),
});

export type ChakaiCreateInput = z.infer<typeof createChakaiSchema>;
export type ChakaiUpdateInput = z.infer<typeof updateChakaiSchema>;


