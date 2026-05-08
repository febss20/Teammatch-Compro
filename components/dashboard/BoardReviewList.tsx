"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { acceptBoardApplication, rejectBoardApplication, saveBoardApplication } from "@/app/(dashboard)/dashboard/actions";
import type { BoardApplicationRecord, CandidateRecord } from "@/lib/types";

interface BoardReviewListProps {
    applications: BoardApplicationRecord[];
    boardRequiredSkills: string[];
    candidatesById: Map<string, CandidateRecord>;
}

type ReviewQueueFilter = "all" | "pending" | "saved" | "processed";

function normalizeSkillLabel(value: string): string {
    return value.trim().toLowerCase();
}

export default function BoardReviewList({ applications, boardRequiredSkills, candidatesById }: BoardReviewListProps) {
    const [queueFilter, setQueueFilter] = useState<ReviewQueueFilter>("all");

    const filteredApplications = useMemo(() => {
        if (queueFilter === "all") {
            return applications;
        }

        if (queueFilter === "processed") {
            return applications.filter((application) => application.status === "accepted" || application.status === "rejected");
        }

        return applications.filter((application) => application.status === queueFilter);
    }, [applications, queueFilter]);

    return (
        <div className="grid gap-5">
            <div className="flex flex-wrap gap-3">
                {(["all", "pending", "saved", "processed"] as ReviewQueueFilter[]).map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => setQueueFilter(filter)}
                        className={`brutal-chip px-4 py-3 text-base ${queueFilter === filter ? "bg-[var(--tm-accent)]" : "bg-white"}`}
                    >
                        {filter === "all"
                            ? "Semua"
                            : filter === "pending"
                              ? "Belum direview"
                              : filter === "saved"
                                ? "Disimpan"
                                : "Sudah diproses"}
                    </button>
                ))}
            </div>

            {filteredApplications.map((application, index) => {
                const candidate = candidatesById.get(application.applicantId) ?? null;
                const candidateSkillSet = new Set(
                    (candidate?.profile.skills ?? []).map((skill) => normalizeSkillLabel(skill.label)),
                );
                const matchedSkills = boardRequiredSkills.filter((skill) => candidateSkillSet.has(normalizeSkillLabel(skill)));
                const missingSkills = boardRequiredSkills.filter((skill) => !candidateSkillSet.has(normalizeSkillLabel(skill)));

                return (
                    <article key={application.id} className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="brutal-chip bg-[var(--tm-accent-2)]">
                                {index + 1} dari {filteredApplications.length}
                            </span>
                            <span
                                className={`brutal-chip ${
                                    application.status === "accepted"
                                        ? "brutal-status-open"
                                        : application.status === "rejected"
                                          ? "brutal-status-closed"
                                          : "bg-white"
                                }`}
                            >
                                {application.status}
                            </span>
                            <span className="brutal-chip bg-[#d6e4ff]">{application.skillMatchScore}% skill match</span>
                        </div>

                        <div>
                            <h3 className="display-font text-4xl leading-none">
                                {candidate?.profile.fullName ?? candidate?.profile.username ?? "Pelamar"}
                            </h3>
                            <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">{application.message}</p>
                        </div>

                        {candidate && (
                            <>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="brutal-panel-soft p-4">
                                        <p className="display-font text-xl">Track Record</p>
                                        <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                            {candidate.competitionsCount} lomba
                                        </p>
                                    </div>
                                    <div className="brutal-panel-soft p-4">
                                        <p className="display-font text-xl">Best Result</p>
                                        <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                            {candidate.bestResult ?? "Belum ada"}
                                        </p>
                                    </div>
                                    <div className="brutal-panel-soft p-4">
                                        <p className="display-font text-xl">Rating</p>
                                        <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                            {candidate.testimonialAverage.toFixed(1)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="brutal-panel-soft p-4">
                                        <p className="display-font text-xl">Skill Cocok</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {matchedSkills.length > 0 ? (
                                                matchedSkills.map((skill) => (
                                                    <span key={skill} className="brutal-chip bg-[var(--tm-accent)]">
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-[var(--tm-muted)]">
                                                    Belum ada skill yang benar-benar cocok.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="brutal-panel-soft p-4">
                                        <p className="display-font text-xl">Skill Belum Terpenuhi</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {missingSkills.length > 0 ? (
                                                missingSkills.map((skill) => (
                                                    <span key={skill} className="brutal-chip bg-white">
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-[var(--tm-muted)]">
                                                    Semua skill inti sudah terpenuhi.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <form action={acceptBoardApplication}>
                                <input type="hidden" name="application_id" value={application.id} />
                                <button type="submit" className="brutal-button">
                                    Terima
                                </button>
                            </form>
                            <form action={rejectBoardApplication}>
                                <input type="hidden" name="application_id" value={application.id} />
                                <button type="submit" className="brutal-button-danger">
                                    Tolak
                                </button>
                            </form>
                            <form action={saveBoardApplication}>
                                <input type="hidden" name="application_id" value={application.id} />
                                <button type="submit" className="brutal-button-secondary">
                                    Simpan
                                </button>
                            </form>
                            {application.teamId && (
                                <Link href={`/dashboard/teams/${application.teamId}`} className="brutal-button-secondary">
                                    Buka team
                                </Link>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
