import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getProfileRecord } from "@/lib/dashboard/data";
import { runDashboardMaintenance } from "@/lib/dashboard/runtime";
import type { ProfileRecord } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user;
}

export async function requireUser(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }
    return user;
}

export async function getCurrentProfile(): Promise<ProfileRecord | null> {
    const user = await getCurrentUser();
    if (!user) {
        return null;
    }
    return getProfileRecord(user.id, user.email);
}

export async function requireCompletedProfile(): Promise<{ user: User; profile: ProfileRecord }> {
    const user = await requireUser();
    await runDashboardMaintenance();
    const profile = await getProfileRecord(user.id, user.email);

    if (!profile) {
        redirect("/dashboard/profile/setup");
    }

    if (!profile.profileCompletedAt) {
        redirect("/dashboard/profile/setup");
    }

    return { user, profile };
}

export function sanitizeNextPath(nextPath: string | null | undefined): string {
    if (!nextPath || nextPath.length === 0) {
        return "/dashboard";
    }
    if (!nextPath.startsWith("/")) {
        return "/dashboard";
    }
    if (nextPath.startsWith("//")) {
        return "/dashboard";
    }
    if (!nextPath.startsWith("/dashboard")) {
        return "/dashboard";
    }
    return nextPath;
}
