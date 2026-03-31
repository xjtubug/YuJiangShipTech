/**
 * Parse product.images from DB: JSON array string, or a single path/URL string.
 * Kept in a dedicated module so client bundles always resolve this export reliably.
 */
export function parseProductImages(raw: string | null | undefined): string[] {
	if (raw == null || raw === "") return [];
	const trimmed = raw.trim();
	if (!trimmed) return [];
	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(x): x is string => typeof x === "string" && x.trim().length > 0,
			);
		}
		if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
	} catch {
		// not JSON — treat as a single path (legacy / admin paste)
	}
	if (trimmed.startsWith("[")) return [];
	return [trimmed];
}
