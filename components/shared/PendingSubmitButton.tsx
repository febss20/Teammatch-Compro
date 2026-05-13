"use client";

import { useFormStatus } from "react-dom";

interface PendingSubmitButtonProps {
    className: string;
    idleLabel: string;
    pendingLabel: string;
}

export default function PendingSubmitButton({ className, idleLabel, pendingLabel }: PendingSubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className={className}>
            {pending ? pendingLabel : idleLabel}
        </button>
    );
}
