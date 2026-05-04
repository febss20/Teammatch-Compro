import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
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
