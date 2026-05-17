import type { NotificationCategory } from "@/lib/types";

export const notificationPreferenceFieldMap = {
    application: "board_updates",
    commitment: "commitment_updates",
    reminder: "reminder_updates",
    request: "request_updates",
} as const;

export type NotificationPreferenceField = (typeof notificationPreferenceFieldMap)[keyof typeof notificationPreferenceFieldMap];

export interface NotificationPayload {
    body: string;
    category: NotificationCategory;
    linkPath: string | null;
    title: string;
    userId: string;
}

export function sanitizeNotificationLinkPath(linkPath: string | null | undefined): string | null {
    if (!linkPath || linkPath.length === 0) {
        return null;
    }

    if (!linkPath.startsWith("/") || linkPath.startsWith("//")) {
        return null;
    }

    try {
        const parsedUrl = new URL(linkPath, "https://teammatch.local");
        const isDashboardPath = parsedUrl.pathname === "/dashboard" || parsedUrl.pathname.startsWith("/dashboard/");

        if (parsedUrl.origin !== "https://teammatch.local" || !isDashboardPath) {
            return null;
        }

        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return null;
    }
}

export type NotificationEvent =
    | {
          actorName: string;
          targetUserId: string;
          type: "join_request_received";
      }
    | {
          requesterUserId: string;
          type: "join_request_accepted";
      }
    | {
          requesterUserId: string;
          type: "join_request_rejected";
      }
    | {
          applicantUserId: string;
          teamId: string;
          type: "board_application_accepted";
      }
    | {
          applicantUserId: string;
          type: "board_application_rejected";
      }
    | {
          actorName: string;
          boardId: string;
          ownerUserId: string;
          type: "board_application_received";
      }
    | {
          boardId: string;
          boardTitle: string;
          candidateUserId: string;
          type: "board_match_found";
      }
    | {
          teamId: string;
          teamName: string;
          type: "team_all_members_confirmed";
          userId: string;
      }
    | {
          teamId: string;
          teamName: string;
          type: "team_commitment_reminder";
          userId: string;
      }
    | {
          roleName: string;
          teamId: string;
          teamName: string;
          type: "team_slot_reopened";
          userId: string;
      }
    | {
          roleName: string;
          teamId: string;
          teamName: string;
          type: "team_slot_reopened_auto";
          userId: string;
      }
    | {
          teamId: string;
          teamName: string;
          type: "testimonial_prompt";
          userId: string;
      };

export function createNotificationPayload(event: NotificationEvent): NotificationPayload {
    const withSafeLinkPath = (payload: NotificationPayload): NotificationPayload => ({
        ...payload,
        linkPath: sanitizeNotificationLinkPath(payload.linkPath),
    });

    if (event.type === "join_request_received") {
        return withSafeLinkPath({
            userId: event.targetUserId,
            category: "request",
            title: "Request tim baru",
            body: `${event.actorName} mengirim request untuk berkolaborasi.`,
            linkPath: "/dashboard/requests",
        });
    }

    if (event.type === "join_request_accepted") {
        return withSafeLinkPath({
            userId: event.requesterUserId,
            category: "request",
            title: "Request Anda diterima",
            body: "Kandidat target menerima ajakan kolaborasi Anda. Lanjutkan koordinasi lewat dashboard tim berikutnya.",
            linkPath: "/dashboard/requests",
        });
    }

    if (event.type === "join_request_rejected") {
        return withSafeLinkPath({
            userId: event.requesterUserId,
            category: "request",
            title: "Request Anda ditolak",
            body: "Kandidat target menolak ajakan kolaborasi ini. Anda tidak dapat mengirim ulang request yang sama.",
            linkPath: "/dashboard/find-team",
        });
    }

    if (event.type === "board_application_received") {
        return withSafeLinkPath({
            userId: event.ownerUserId,
            category: "application",
            title: "Pelamar baru masuk",
            body: `${event.actorName} melamar ke board Anda.`,
            linkPath: `/dashboard/boards/${event.boardId}/review`,
        });
    }

    if (event.type === "board_application_accepted") {
        return withSafeLinkPath({
            userId: event.applicantUserId,
            category: "application",
            title: "Lamaran Anda diterima",
            body: "Creator menerima lamaran Anda. Silakan konfirmasi komitmen tim.",
            linkPath: `/dashboard/teams/${event.teamId}`,
        });
    }

    if (event.type === "board_application_rejected") {
        return withSafeLinkPath({
            userId: event.applicantUserId,
            category: "application",
            title: "Lamaran Anda ditolak",
            body: "Creator memilih pelamar lain untuk board ini. Cari board lain yang lebih cocok untuk skill Anda.",
            linkPath: "/dashboard/boards",
        });
    }

    if (event.type === "board_match_found") {
        return withSafeLinkPath({
            userId: event.candidateUserId,
            category: "application",
            title: "Board baru yang cocok untuk Anda",
            body: `Ada board ${event.boardTitle} dengan kecocokan skill yang tinggi untuk profil Anda.`,
            linkPath: `/dashboard/boards/${event.boardId}`,
        });
    }

    if (event.type === "team_all_members_confirmed") {
        return withSafeLinkPath({
            userId: event.userId,
            category: "commitment",
            title: "Semua anggota telah konfirmasi",
            body: `Tim ${event.teamName} siap mulai bekerja.`,
            linkPath: `/dashboard/teams/${event.teamId}`,
        });
    }

    if (event.type === "team_commitment_reminder") {
        return withSafeLinkPath({
            userId: event.userId,
            category: "reminder",
            title: "Reminder komitmen tim",
            body: `Creator mengingatkan Anda untuk segera mengonfirmasi komitmen pada tim ${event.teamName}.`,
            linkPath: `/dashboard/teams/${event.teamId}`,
        });
    }

    if (event.type === "team_slot_reopened") {
        return withSafeLinkPath({
            userId: event.userId,
            category: "commitment",
            title: "Slot tim terbuka kembali",
            body: `Slot ${event.roleName} pada tim ${event.teamName} terbuka kembali karena komitmen tidak dikonfirmasi.`,
            linkPath: `/dashboard/teams/${event.teamId}`,
        });
    }

    if (event.type === "team_slot_reopened_auto") {
        return withSafeLinkPath({
            userId: event.userId,
            category: "commitment",
            title: "Slot tim terbuka kembali otomatis",
            body: `Slot ${event.roleName} pada tim ${event.teamName} dibuka ulang karena batas konfirmasi 48 jam terlewati.`,
            linkPath: `/dashboard/teams/${event.teamId}`,
        });
    }

    return withSafeLinkPath({
        userId: event.userId,
        category: "reminder",
        title: "Saatnya memberi testimoni",
        body: `Hasil untuk tim ${event.teamName} sudah dicatat. Anda bisa mulai menulis testimoni untuk anggota lain.`,
        linkPath: `/dashboard/teams/${event.teamId}`,
    });
}
