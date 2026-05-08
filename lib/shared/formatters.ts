function formatWithOptions(date: string | null, options: Intl.DateTimeFormatOptions): string {
    if (!date) {
        return "Belum tersedia";
    }

    return new Intl.DateTimeFormat("id-ID", options).format(new Date(date));
}

export function formatDashboardDate(date: string | null): string {
    return formatWithOptions(date, {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function formatDashboardDateCompact(date: string | null): string {
    return formatWithOptions(date, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatDashboardDateTime(date: string | null): string {
    return formatWithOptions(date, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
