import { describe, it, expect } from 'vitest';
import { prepareTeaSchoolPayload, MAX_TEA_SCHOOL_NAME_LENGTH } from '../lib/teaSchools';

describe('prepareTeaSchoolPayload', () => {
	it('returns error when both names are missing', () => {
		const r = prepareTeaSchoolPayload({ nameEn: '', nameJa: '' });
		expect(r.error).toBe('missing_name');
	});

	it('falls back to JA when only JA provided', () => {
		const r = prepareTeaSchoolPayload({ nameEn: '', nameJa: '裏千家' });
		expect(r.payload).toEqual({ name_en: '裏千家', name_ja: '裏千家' });
	});

	it('passes through EN + optional JA', () => {
		const r = prepareTeaSchoolPayload({ nameEn: 'Urasenke', nameJa: '裏千家' });
		expect(r.payload).toEqual({ name_en: 'Urasenke', name_ja: '裏千家' });
	});

	it('rejects overly long names', () => {
		const long = 'x'.repeat(MAX_TEA_SCHOOL_NAME_LENGTH + 1);
		const r = prepareTeaSchoolPayload({ nameEn: long, nameJa: '' });
		expect(r.error).toBe('too_long');
	});
});


