"use client";

import { acceptBoardApplication, rejectBoardApplication, saveBoardApplication } from "@/app/(dashboard)/dashboard/actions";
import type { BoardApplicationRecord, CandidateRecord } from "@/lib/types";

interface BoardReviewListProps {
    applications: BoardApplicationRecord[];
    candidatesById: Map<string, CandidateRecord>;
}

export default function BoardReviewList({ applications, candidatesById }: BoardReviewListProps) {
    return (
        <div className="grid gap-5">
            {applications.map((application, index) => {
                const candidate = candidatesById.get(application.applicantId);

                return (
                    <article key={application.id} className="brutal-panel grid gap-5 bg-[var(--tm-paper-strong)] p-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="brutal-chip bg-[var(--tm-accent-2)]">
                                {index + 1} dari {applications.length}
                            </span>
                            <span
                                className={`brutal-chip ${application.status === "accepted" ? "brutal-status-open" : application.status === "rejected" ? "brutal-status-closed" : "bg-white"}`}
                            >
                                {application.status}
                            </span>
                            <span className="brutal-chip bg-[#d6e4ff]">{application.skillMatchScore}% skill match</span>
                        </div>

                        <div>
                            <h3 className="display-font text-4xl leading-none">
                                {candidate?.profile.fullName ?? candidate?.profile.username ?? "Pelamar"}
                            </h3>
                            <p className="mt-3 text-base leading-8 text-[var(--tm-muted)] break-words">
                                {application.message}
                            </p>
                        </div>

                        {candidate && (
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl">Track Record</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">{candidate.competitionsCount} lomba</p>
                                </div>
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl">Best Result</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">{candidate.bestResult ?? "Belum ada"}</p>
                                </div>
                                <div className="brutal-panel-soft p-4">
                                    <p className="display-font text-xl">Rating</p>
                                    <p className="mt-2 text-sm text-[var(--tm-muted)]">
                                        {candidate.testimonialAverage.toFixed(1)}
                                    </p>
                                </div>
                            </div>
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
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
