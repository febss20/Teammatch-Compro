export function createIdempotencyKey(): string {
    return crypto.randomUUID();
}

export function requireIdempotencyKey(formData: FormData, actionName: string): string {
    const value = formData.get("idempotency_key");

    if (typeof value !== "string" || value.trim().length < 8) {
        throw new Error(`Kunci idempotensi untuk ${actionName} tidak valid.`);
    }

    return value.trim();
}
