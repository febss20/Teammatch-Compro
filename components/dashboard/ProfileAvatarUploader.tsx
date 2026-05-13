"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { avatarAllowedMimeTypes, avatarMaxFileSizeBytes, type AvatarMimeType } from "@/lib/profile/avatar";
import type { ProfileRecord } from "@/lib/types";

interface AvatarApiResponse {
    avatarSource?: string;
    avatarUrl?: string | null;
    error?: string;
    success?: boolean;
}

interface ProfileAvatarUploaderProps {
    profile: ProfileRecord;
}

function getInitials(profile: ProfileRecord): string {
    const source = profile.fullName ?? profile.email ?? profile.username ?? "TM";
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function validateAvatarFile(file: File): string | null {
    if (!avatarAllowedMimeTypes.includes(file.type as AvatarMimeType)) {
        return "Format foto harus JPG, PNG, atau WebP.";
    }

    if (file.size > avatarMaxFileSizeBytes) {
        return "Ukuran foto maksimal 1 MB.";
    }

    return null;
}

export default function ProfileAvatarUploader({ profile }: ProfileAvatarUploaderProps) {
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [hasManualAvatar, setHasManualAvatar] = useState<boolean>(Boolean(profile.manualAvatarPath));
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const initials = useMemo(() => getInitials(profile), [profile]);
    const visibleAvatarUrl = previewUrl ?? avatarUrl;

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const selectedFile = event.target.files?.[0] ?? null;
        setStatusMessage(null);
        setErrorMessage(null);

        if (!selectedFile) {
            setFile(null);
            setPreviewUrl(null);
            return;
        }

        const validationError = validateAvatarFile(selectedFile);
        if (validationError) {
            setFile(null);
            setPreviewUrl(null);
            setErrorMessage(validationError);
            event.target.value = "";
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setFile(selectedFile);
        setPreviewUrl((currentPreviewUrl) => {
            if (currentPreviewUrl) {
                URL.revokeObjectURL(currentPreviewUrl);
            }

            return objectUrl;
        });
    }

    async function uploadAvatar(): Promise<void> {
        if (!file) {
            setErrorMessage("Pilih foto profil terlebih dahulu.");
            return;
        }

        setUploading(true);
        setErrorMessage(null);
        setStatusMessage(null);

        const formData = new FormData();
        formData.append("avatar", file);

        try {
            const response = await fetch("/api/profile/avatar", {
                body: formData,
                method: "POST",
            });
            const payload = (await response.json()) as AvatarApiResponse;

            if (!response.ok || !payload.success) {
                throw new Error(payload.error ?? "Foto profil belum dapat diperbarui saat ini.");
            }

            setAvatarUrl(payload.avatarUrl ?? null);
            setFile(null);
            setHasManualAvatar(true);
            setPreviewUrl(null);
            setStatusMessage("Foto profil berhasil diperbarui.");
            router.refresh();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Foto profil belum dapat diperbarui saat ini.");
        } finally {
            setUploading(false);
        }
    }

    async function removeAvatar(): Promise<void> {
        setUploading(true);
        setErrorMessage(null);
        setStatusMessage(null);

        try {
            const response = await fetch("/api/profile/avatar", {
                method: "DELETE",
            });
            const payload = (await response.json()) as AvatarApiResponse;

            if (!response.ok || !payload.success) {
                throw new Error(payload.error ?? "Foto profil belum dapat dihapus saat ini.");
            }

            setAvatarUrl(payload.avatarUrl ?? null);
            setFile(null);
            setHasManualAvatar(false);
            setPreviewUrl(null);
            setStatusMessage("Foto profil manual berhasil dihapus.");
            router.refresh();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Foto profil belum dapat dihapus saat ini.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <section className="brutal-panel-soft grid gap-5 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[var(--tm-line)] bg-[var(--tm-paper)]">
                    {visibleAvatarUrl ? (
                        <Image
                            src={visibleAvatarUrl}
                            alt="Foto profil"
                            width={112}
                            height={112}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="display-font text-4xl leading-none text-[var(--tm-line)]">{initials || "TM"}</span>
                    )}
                </div>

                <div className="grid flex-1 gap-3">
                    <div>
                        <p className="brutal-label">Foto Profil</p>
                    </div>

                    <input
                        type="file"
                        accept={avatarAllowedMimeTypes.join(",")}
                        disabled={uploading}
                        onChange={handleFileChange}
                        className="brutal-input"
                    />
                </div>
            </div>

            {statusMessage && <div className="brutal-alert-success text-sm">{statusMessage}</div>}
            {errorMessage && <div className="brutal-alert-error text-sm">{errorMessage}</div>}

            <div className="flex flex-wrap gap-3">
                <button type="button" disabled={uploading || !file} onClick={uploadAvatar} className="brutal-button">
                    {uploading ? "Mengunggah..." : "Simpan foto"}
                </button>
                {hasManualAvatar ? (
                    <button type="button" disabled={uploading} onClick={removeAvatar} className="brutal-button-secondary">
                        Hapus foto manual
                    </button>
                ) : null}
            </div>
        </section>
    );
}
