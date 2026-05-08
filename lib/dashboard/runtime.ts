import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { sendAdminNotificationSafely } from "@/lib/notifications/service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const dashboardMaintenanceIntervalMs = 30_000;

let dashboardMaintenancePromise: Promise<void> | null = null;
let lastDashboardMaintenanceAt: number | null = null;

interface ExpiredCommitmentRow {
    id: string;
    profile_id: string;
    role_name: string;
    team_id: string;
    teams: {
        board_id: string | null;
        creator_id: string;
        name: string;
    } | null;
    team_commitments: {
        id: string;
        confirmed_at: string | null;
        deadline_at: string;
    } | null;
}

function shouldRunDashboardMaintenance(currentTime: number, lastRunAt: number | null): boolean {
    if (lastRunAt === null) {
        return true;
    }

    return currentTime - lastRunAt >= dashboardMaintenanceIntervalMs;
}

async function processExpiredCommitments(): Promise<number> {
    const supabase = createAdminSupabaseClient();
    const now = new Date();
    const nowIso = now.toISOString();
    const { data, error } = await supabase
        .from("team_members")
        .select(
            "id, profile_id, role_name, team_id, teams!inner(board_id, creator_id, name), team_commitments!inner(id, confirmed_at, deadline_at)",
        )
        .eq("confirmation_status", "pending")
        .lt("team_commitments.deadline_at", nowIso)
        .is("team_commitments.confirmed_at", null);

    if (error) {
        throw new Error(`Gagal memuat komitmen yang expired: ${error.message}`);
    }

    const expiredMembers = (data ?? []) as unknown as ExpiredCommitmentRow[];
    await Promise.all(
        expiredMembers.map(async (member) => {
            const commitment = member.team_commitments ?? null;
            if (!commitment || !member.teams) {
                return;
            }

            const [memberUpdate, boardUpdate, activityInsert] = await Promise.all([
                supabase
                    .from("team_members")
                    .update({
                        confirmation_status: "expired",
                        updated_at: nowIso,
                    })
                    .eq("id", member.id),
                member.teams.board_id
                    ? supabase
                          .from("competition_idea_boards")
                          .update({
                              status: "open",
                              updated_at: nowIso,
                          })
                          .eq("id", member.teams.board_id)
                    : Promise.resolve({ error: null }),
                supabase.from("team_activity_events").insert({
                    team_id: member.team_id,
                    actor_id: null,
                    event_type: "slot_expired_auto",
                    payload: {
                        team_member_id: member.id,
                        role_name: member.role_name,
                        deadline_at: commitment.deadline_at,
                    } as Json,
                }),
            ]);

            if (memberUpdate.error) {
                throw new Error(`Gagal memperbarui anggota expired ${member.id}: ${memberUpdate.error.message}`);
            }
            if (boardUpdate.error) {
                throw new Error(`Gagal membuka ulang board untuk anggota ${member.id}: ${boardUpdate.error.message}`);
            }
            if (activityInsert.error) {
                throw new Error(`Gagal mencatat aktivitas expired untuk anggota ${member.id}: ${activityInsert.error.message}`);
            }

            await sendAdminNotificationSafely({
                type: "team_slot_reopened_auto",
                roleName: member.role_name,
                teamId: member.team_id,
                teamName: member.teams.name,
                userId: member.teams.creator_id,
            });
        }),
    );

    return expiredMembers.length;
}

export async function runDashboardMaintenance(): Promise<boolean> {
    const currentTime = Date.now();
    if (!shouldRunDashboardMaintenance(currentTime, lastDashboardMaintenanceAt)) {
        return false;
    }

    if (dashboardMaintenancePromise) {
        await dashboardMaintenancePromise;
        return false;
    }

    let processedCount = 0;
    dashboardMaintenancePromise = processExpiredCommitments().then((count) => {
        processedCount = count;
    });

    try {
        await dashboardMaintenancePromise;
        lastDashboardMaintenanceAt = Date.now();
        return processedCount > 0;
    } finally {
        dashboardMaintenancePromise = null;
    }
}
