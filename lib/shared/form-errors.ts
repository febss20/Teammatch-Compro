export function getFirstFieldError(fieldErrors: Partial<Record<string, string[]>>, fieldName: string): string | null {
    return fieldErrors[fieldName]?.[0] ?? null;
}
