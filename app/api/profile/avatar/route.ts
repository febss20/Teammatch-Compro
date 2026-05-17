import { NextResponse } from "next/server";
import { z } from "zod";
import {
    avatarAllowedMimeTypes,
    avatarMaxFileSizeBytes,
    getAvatarExtension,
    getProfileAvatarPublicUrl,
    profileAvatarBucket,
    type AvatarMimeType,
} from "@/lib/profile/avatar";
import { assertRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/server-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface AvatarActor {
    manualAvatarPath: string | null;
    oauthAvatarUrl: string | null;
    userId: string;
}

const avatarFileSchema = z
    .file()
    .min(1, "File avatar tidak boleh kosong.")
    .max(avatarMaxFileSizeBytes, "Ukuran foto maksimal 1 MB.")
    .mime([...avatarAllowedMimeTypes], "Format foto harus JPG, PNG, atau WebP.");

function isAvatarMimeType(value: string): value is AvatarMimeType {
    return avatarAllowedMimeTypes.includes(value as AvatarMimeType);
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: AvatarMimeType): boolean {
    if (mimeType === "image/jpeg") {
        return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }

    if (mimeType === "image/png") {
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    }

    return (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
    );
}

function getAvatarUploadPath(userId: string, mimeType: AvatarMimeType): string {
    return `${userId}/avatar/${crypto.randomUUID()}.${getAvatarExtension(mimeType)}`;
}

function getUserFacingUploadError(error: unknown): string {
    if (error instanceof RateLimitError) {
        return error.message;
    }

    if (error instanceof z.ZodError) {
        return error.issues[0]?.message ?? "File avatar tidak valid.";
    }

    if (error instanceof Error && error.message === "SIGNATURE_INVALID") {
        return "Isi file tidak sesuai dengan format gambar yang dipilih.";
    }

    return "Foto profil belum dapat diperbarui saat ini.";
}

async function getAvatarActor(): Promise<AvatarActor | null> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("manual_avatar_path, oauth_avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        throw new Error(`Profil avatar gagal dimuat: ${profileError.message}`);
    }

    return {
        manualAvatarPath: profile?.manual_avatar_path ?? null,
        oauthAvatarUrl: profile?.oauth_avatar_url ?? null,
        userId: user.id,
    };
}

export async function POST(request: Request): Promise<NextResponse> {
    let uploadedPath: string | null = null;

    try {
        const actor = await getAvatarActor();
        if (!actor) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        await assertRateLimit({
            limitCount: 10,
            scope: "profile.avatar.upload",
            subject: `user:${actor.userId}`,
            windowSeconds: 3600,
        });

        const formData = await request.formData();
        const file = formData.get("avatar");
        const validationResult = avatarFileSchema.safeParse(file);

        if (!validationResult.success) {
            throw validationResult.error;
        }

        if (!isAvatarMimeType(validationResult.data.type)) {
            throw new Error("SIGNATURE_INVALID");
        }

        const arrayBuffer = await validationResult.data.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        if (!hasValidImageSignature(bytes, validationResult.data.type)) {
            throw new Error("SIGNATURE_INVALID");
        }

        const supabase = await createServerSupabaseClient();
        uploadedPath = getAvatarUploadPath(actor.userId, validationResult.data.type);
        const { error: uploadError } = await supabase.storage.from(profileAvatarBucket).upload(uploadedPath, bytes, {
            cacheControl: "3600",
            contentType: validationResult.data.type,
            upsert: false,
        });

        if (uploadError) {
            throw new Error(`Upload avatar gagal: ${uploadError.message}`);
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                avatar_source: "manual",
                avatar_updated_at: new Date().toISOString(),
                manual_avatar_path: uploadedPath,
                updated_at: new Date().toISOString(),
            })
            .eq("id", actor.userId);

        if (updateError) {
            await supabase.storage.from(profileAvatarBucket).remove([uploadedPath]);
            uploadedPath = null;
            throw new Error(`Update profile avatar gagal: ${updateError.message}`);
        }

        if (actor.manualAvatarPath && actor.manualAvatarPath !== uploadedPath) {
            const { error: removeOldError } = await supabase.storage.from(profileAvatarBucket).remove([actor.manualAvatarPath]);
            if (removeOldError) {
                logServerError({ action: "profile.avatar.removeOld", userId: actor.userId }, removeOldError);
            }
        }

        return NextResponse.json({
            avatarSource: "manual",
            avatarUrl: getProfileAvatarPublicUrl(uploadedPath),
            success: true,
        });
    } catch (error) {
        if (uploadedPath) {
            try {
                const supabase = await createServerSupabaseClient();
                await supabase.storage.from(profileAvatarBucket).remove([uploadedPath]);
            } catch (cleanupError) {
                logServerError({ action: "profile.avatar.cleanup" }, cleanupError);
            }
        }

        logServerError({ action: "profile.avatar.upload" }, error);
        return NextResponse.json(
            { error: getUserFacingUploadError(error) },
            { status: error instanceof RateLimitError ? 429 : 400 },
        );
    }
}

export async function DELETE(): Promise<NextResponse> {
    try {
        const actor = await getAvatarActor();
        if (!actor) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();
        const nextAvatarSource = actor.oauthAvatarUrl ? "oauth" : "none";
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                avatar_source: nextAvatarSource,
                avatar_updated_at: new Date().toISOString(),
                manual_avatar_path: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", actor.userId);

        if (updateError) {
            throw new Error(`Hapus avatar profile gagal: ${updateError.message}`);
        }

        if (actor.manualAvatarPath) {
            const { error: removeError } = await supabase.storage.from(profileAvatarBucket).remove([actor.manualAvatarPath]);
            if (removeError) {
                logServerError({ action: "profile.avatar.removeManual", userId: actor.userId }, removeError);
            }
        }

        return NextResponse.json({
            avatarSource: nextAvatarSource,
            avatarUrl: actor.oauthAvatarUrl,
            success: true,
        });
    } catch (error) {
        logServerError({ action: "profile.avatar.delete" }, error);
        return NextResponse.json({ error: "Foto profil belum dapat dihapus saat ini." }, { status: 400 });
    }
}
