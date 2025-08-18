export type TeaSchoolInput = {
	nameEn?: string | null;
	nameJa?: string | null;
};

export type PrepareTeaSchoolResult = {
	payload?: { name_en: string; name_ja: string | null };
	error?: 'missing_name' | 'too_long';
};

export const MAX_TEA_SCHOOL_NAME_LENGTH = 120;

function sanitize(input?: string | null): string {
	return (input ?? '').trim();
}

// Fallback behavior is intentional: when only JA is provided, we reuse it for EN
// so that the DB-required `name_en` is always populated. This keeps the UI simple
// and avoids half-filled rows while still preserving the provided JA label.
export function prepareTeaSchoolPayload(input: TeaSchoolInput): PrepareTeaSchoolResult {
	const nameEn = sanitize(input.nameEn);
	const nameJa = sanitize(input.nameJa);

	if (!nameEn && !nameJa) return { error: 'missing_name' };
	if (nameEn.length > MAX_TEA_SCHOOL_NAME_LENGTH || nameJa.length > MAX_TEA_SCHOOL_NAME_LENGTH) {
		return { error: 'too_long' };
	}

	const finalEn = nameEn || nameJa; // fallback EN = JA when only JA provided
	const finalJa = nameJa || null;

	return { payload: { name_en: finalEn, name_ja: finalJa } };
}


