export const campusEmailMessage = "Gunakan email kampus dengan domain .ac.id atau .edu.";

export function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

export function extractEmailDomain(email: string): string | null {
    const normalizedEmail = normalizeEmail(email);
    const separatorIndex = normalizedEmail.lastIndexOf("@");

    if (separatorIndex <= 0 || separatorIndex === normalizedEmail.length - 1) {
        return null;
    }

    return normalizedEmail.slice(separatorIndex + 1);
}

export function isCampusEmail(email: string): boolean {
    const domain = extractEmailDomain(email);

    if (!domain) {
        return false;
    }

    return domain.endsWith(".ac.id") || domain.endsWith(".edu");
}
