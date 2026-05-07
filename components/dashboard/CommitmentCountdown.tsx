"use client";

import { useEffect, useState } from "react";

function formatCountdown(deadlineAt: string): string {
    const diff = new Date(deadlineAt).getTime() - Date.now();

    if (diff <= 0) {
        return "Batas komitmen sudah lewat";
    }

    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours} jam ${minutes} menit tersisa`;
}

export default function CommitmentCountdown({ deadlineAt }: { deadlineAt: string | null }) {
    const [label, setLabel] = useState<string>(deadlineAt ? formatCountdown(deadlineAt) : "Deadline komitmen belum tersedia");

    useEffect(() => {
        if (!deadlineAt) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setLabel(formatCountdown(deadlineAt));
        }, 60_000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [deadlineAt]);

    if (!deadlineAt) {
        return <span className="brutal-chip bg-[#d6e4ff]">Deadline komitmen belum tersedia</span>;
    }

    return <span className={`brutal-chip ${label.includes("lewat") ? "bg-[#ffd9cc]" : "bg-[#d6e4ff]"}`}>{label}</span>;
}
