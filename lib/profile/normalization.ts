export function normalizeText(input: string): string {
    return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function validateCustomSkill(value: string): { valid: boolean; error?: string } {
    const normalized = normalizeText(value);

    if (!normalized) return { valid: false, error: 'Skill tidak boleh kosong' };
    if (normalized.length < 2) return { valid: false, error: 'Skill minimal 2 karakter' };
    if (normalized.length > 50) return { valid: false, error: 'Skill maksimal 50 karakter' };

    return { valid: true };
}

export function validateCustomCompetitionType(value: string): { valid: boolean; error?: string } {
    const normalized = normalizeText(value);

    if (!normalized) return { valid: false, error: 'Jenis lomba tidak boleh kosong' };
    if (normalized.length < 2) return { valid: false, error: 'Jenis lomba minimal 2 karakter' };
    if (normalized.length > 50) return { valid: false, error: 'Jenis lomba maksimal 50 karakter' };

    return { valid: true };
}

export function deduplicateAndNormalize(items: string[]): string[] {
    const seen = new Set<string>();
    return items
        .map(normalizeText)
        .filter((normalized) => {
            if (seen.has(normalized)) return false;
            seen.add(normalized);
            return true;
        });
}
