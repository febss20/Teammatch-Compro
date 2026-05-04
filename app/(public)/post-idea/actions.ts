"use server";

import { redirect } from "next/navigation";

export async function redirectPostIdeaAction(): Promise<void> {
    redirect("/login?next=/dashboard/boards/new");
}
