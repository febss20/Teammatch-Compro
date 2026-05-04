"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ZodError } from "zod";
import { getFieldErrors } from "@/lib/shared/action-utils";
import { requireUser } from "@/lib/auth";
import { competitionIdeaBoardInitialState } from "@/lib/forms";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CompetitionIdeaBoardFieldName, FormActionState } from "@/lib/types";
import {
    buildCreateCompetitionIdeaBoardPayload,
    buildUpdateCompetitionIdeaBoardPayload,
} from "@/lib/boards/validation";

export async function logoutAction(): Promise<void> {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
}

export async function createCompetitionIdeaBoard(
    _previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    try {
        const user = await requireUser();
        const payload = buildCreateCompetitionIdeaBoardPayload(formData);
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.from("competition_idea_boards").insert({
            user_id: user.id,
            title: payload.title,
            competition_type: payload.competitionType,
            description: payload.description,
            deadline: payload.deadline,
            required_skills: payload.requiredSkills,
            status: "open",
            updated_at: new Date().toISOString(),
        });

        if (error) {
            throw new Error(`Gagal menyimpan board ide lomba: ${error.message}`);
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/boards/new");
        redirect("/dashboard?created=1");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof ZodError) {
            return {
                ...competitionIdeaBoardInitialState,
                formError: "Periksa kembali field yang masih belum valid.",
                fieldErrors: getFieldErrors<CompetitionIdeaBoardFieldName>(error),
            };
        }

        return {
            ...competitionIdeaBoardInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan ide lomba.",
        };
    }
}

export async function updateCompetitionIdeaBoard(
    _previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    try {
        const user = await requireUser();
        const payload = buildUpdateCompetitionIdeaBoardPayload(formData);
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("competition_idea_boards")
            .update({
                title: payload.title,
                competition_type: payload.competitionType,
                description: payload.description,
                deadline: payload.deadline,
                required_skills: payload.requiredSkills,
                status: payload.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", payload.id)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw new Error(`Gagal memperbarui board ide lomba: ${error.message}`);
        }

        if (!data) {
            throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
        }

        revalidatePath("/dashboard");
        revalidatePath(`/dashboard/boards/${payload.id}/edit`);
        redirect("/dashboard?updated=1");
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof ZodError) {
            return {
                ...competitionIdeaBoardInitialState,
                formError: "Periksa kembali field yang masih belum valid.",
                fieldErrors: getFieldErrors<CompetitionIdeaBoardFieldName>(error),
            };
        }

        return {
            ...competitionIdeaBoardInitialState,
            formError: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui ide lomba.",
        };
    }
}

export async function deleteCompetitionIdeaBoard(formData: FormData): Promise<void> {
    const user = await requireUser();
    const id = formData.get("id");

    if (typeof id !== "string" || id.trim().length === 0) {
        throw new Error("ID board ide tidak valid.");
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from("competition_idea_boards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .maybeSingle();

    if (error) {
        throw new Error(`Gagal menghapus board ide lomba: ${error.message}`);
    }

    if (!data) {
        throw new Error("Board ide tidak ditemukan atau Anda tidak memiliki akses.");
    }

    revalidatePath("/dashboard");
    redirect("/dashboard?deleted=1");
}
