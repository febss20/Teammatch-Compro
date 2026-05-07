import type {
    BoardVisibility,
    CompetitionTypeOption,
    DashboardMonth,
    NotificationCategory,
    ProfileVisibility,
} from "@/lib/types";

export const dashboardMonthLabels: Record<DashboardMonth, string> = {
    jan: "Januari",
    feb: "Februari",
    mar: "Maret",
    apr: "April",
    may: "Mei",
    jun: "Juni",
    jul: "Juli",
    aug: "Agustus",
    sep: "September",
    oct: "Oktober",
    nov: "November",
    dec: "Desember",
};

export const competitionTypeLabels: Record<CompetitionTypeOption, string> = {
    hackathon: "Hackathon",
    pkm: "PKM",
    business: "Business",
    "ui-ux-design": "UI/UX Design",
    "data-science": "Data Science",
    "karya-tulis": "Karya Tulis",
    others: "Lainnya",
};

export const profileVisibilityLabels: Record<ProfileVisibility, string> = {
    public: "Publik",
    private: "Privat",
};

export const boardVisibilityLabels: Record<BoardVisibility, string> = {
    public: "Publik",
    private: "Privat",
};

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
    request: "Request",
    application: "Lamaran",
    commitment: "Komitmen",
    reminder: "Reminder",
    system: "Sistem",
};
