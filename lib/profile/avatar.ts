export const profileAvatarBucket = "profile-avatars";
export const avatarMaxFileSizeBytes = 1_048_576;
export const avatarAllowedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type AvatarMimeType = (typeof avatarAllowedMimeTypes)[number];

export function getAvatarExtension(mimeType: AvatarMimeType): string {
    if (mimeType === "image/jpeg") {
        return "jpg";
    }

    if (mimeType === "image/png") {
        return "png";
    }

    return "webp";
}

export function getProfileAvatarPublicUrl(path: string | null): string | null {
    if (!path) {
        return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/${profileAvatarBucket}/${path}`;
}

export function resolveProfileAvatarUrl(input: {
    manualAvatarPath: string | null;
    oauthAvatarUrl: string | null;
}): string | null {
    return getProfileAvatarPublicUrl(input.manualAvatarPath) ?? input.oauthAvatarUrl;
}
