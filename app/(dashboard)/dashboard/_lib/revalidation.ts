import { revalidatePath } from "next/cache";

interface BoardPathInput {
    boardId: string | null;
}

interface TeamPathInput {
    teamId: string;
    boardId: string | null;
}

export function revalidateProfilePaths(): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/setup");
}

export function revalidateBoardPaths(input: BoardPathInput): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/boards");
    revalidatePath("/dashboard/boards/new");

    if (input.boardId) {
        revalidatePath(`/dashboard/boards/${input.boardId}`);
        revalidatePath(`/dashboard/boards/${input.boardId}/edit`);
        revalidatePath(`/dashboard/boards/${input.boardId}/review`);
    }
}

export function revalidateMatchingPaths(): void {
    revalidatePath("/dashboard/find-team");
    revalidatePath("/dashboard/requests");
}

export function revalidateTeamPaths(input: TeamPathInput): void {
    revalidatePath("/dashboard/teams");
    revalidatePath(`/dashboard/teams/${input.teamId}`);

    if (input.boardId) {
        revalidatePath(`/dashboard/boards/${input.boardId}/review`);
    }
}

export function revalidateNotificationPaths(): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard/settings");
}
