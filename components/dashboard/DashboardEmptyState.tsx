import Link from "next/link";

interface DashboardEmptyStateProps {
    actionHref: string | null;
    actionLabel: string | null;
    body: string;
    title: string;
}

export default function DashboardEmptyState({ actionHref, actionLabel, body, title }: DashboardEmptyStateProps) {
    return (
        <div className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-8">
            <p className="display-font text-4xl leading-none">{title}</p>
            <p className="text-base leading-8 text-[var(--tm-muted)] break-words">{body}</p>
            {actionHref && actionLabel && (
                <div>
                    <Link href={actionHref} className="brutal-button-secondary">
                        {actionLabel}
                    </Link>
                </div>
            )}
        </div>
    );
}
