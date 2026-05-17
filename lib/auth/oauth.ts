import "server-only";

import type { User } from "@supabase/supabase-js";
import { extractEmailDomain, isCampusEmail } from "@/lib/auth/email";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MetadataValue = boolean | number | string | null | undefined;
type UserMetadata = Record<string, MetadataValue>;

function getStringMetadataValue(metadata: UserMetadata, keys: string[]): string | null {
    for (const key of keys) {
        const value = metadata[key];
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
    }

    return null;
}

export function getOAuthAvatarUrl(user: User): string | null {
    const metadata = user.user_metadata as UserMetadata;
    const avatarUrl = getStringMetadataValue(metadata, ["avatar_url", "picture"]);

    if (!avatarUrl || avatarUrl.length > 500) {
        return null;
    }

    try {
        const parsedUrl = new URL(avatarUrl);
        return parsedUrl.protocol === "https:" ? parsedUrl.toString() : null;
    } catch {
        return null;
    }
}

export function isOAuthEmailVerified(user: User): boolean {
    const metadata = user.user_metadata as UserMetadata;
    const value = metadata.email_verified;

    return value !== false;
}

export async function syncOAuthProfile(user: User): Promise<void> {
    if (!user.email || !isCampusEmail(user.email)) {
        throw new Error("Email OAuth bukan email kampus.");
    }

    const supabase = await createServerSupabaseClient();
    const emailDomain = extractEmailDomain(user.email);
    const oauthAvatarUrl = getOAuthAvatarUrl(user);
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, manual_avatar_path, oauth_avatar_url, avatar_source")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        throw new Error(`Gagal memuat profil OAuth: ${profileError.message}`);
    }

    const hasManualAvatar = Boolean(profile?.manual_avatar_path);
    const shouldSyncOAuthAvatar = !hasManualAvatar && oauthAvatarUrl;
    const nextAvatarSource = shouldSyncOAuthAvatar ? "oauth" : (profile?.avatar_source ?? "none");
    const profilePayload: {
        avatar_source: string;
        avatar_updated_at?: string;
        email_domain: string | null;
        id: string;
        oauth_avatar_url: string | null;
        updated_at: string;
    } = {
        avatar_source: nextAvatarSource,
        email_domain: emailDomain,
        id: user.id,
        oauth_avatar_url: shouldSyncOAuthAvatar ? oauthAvatarUrl : (profile?.oauth_avatar_url ?? null),
        updated_at: new Date().toISOString(),
    };

    if (shouldSyncOAuthAvatar) {
        profilePayload.avatar_updated_at = new Date().toISOString();
    }

    const { error } = await supabase.from("profiles").upsert(profilePayload);

    if (error) {
        throw new Error(`Gagal menyinkronkan profil OAuth: ${error.message}`);
    }
}
