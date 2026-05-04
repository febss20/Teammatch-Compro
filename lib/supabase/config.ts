import "server-only";

export function getSupabaseUrl(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!value) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi.");
    }

    return value;
}

export function getSupabasePublishableKey(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!value) {
        throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi.");
    }

    return value;
}

export function getSupabaseServiceRoleKey(): string {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!value) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");
    }

    return value;
}
