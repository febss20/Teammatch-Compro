function getFormValue(values: object | undefined, fieldName: string): unknown {
    return values ? (values as Record<string, unknown>)[fieldName] : undefined;
}

export function getStringFormValue(values: object | undefined, fieldName: string): string | null {
    const value = getFormValue(values, fieldName);
    return typeof value === "string" ? value : null;
}

export function getStringArrayFormValue(values: object | undefined, fieldName: string): string[] | null {
    const value = getFormValue(values, fieldName);
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}
