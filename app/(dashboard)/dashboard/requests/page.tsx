import JoinRequestComposer from "@/components/dashboard/JoinRequestComposer";
import { requireCompletedProfile } from "@/lib/auth";
import { getCandidateDiscovery, getJoinRequestsForUser } from "@/lib/dashboard/data";
import { withdrawJoinRequest } from "@/app/(dashboard)/dashboard/actions";

function firstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

export default async function RequestsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { user } = await requireCompletedProfile();
    const [resolvedSearchParams, requests, candidateData] = await Promise.all([
        searchParams,
        getJoinRequestsForUser(user.id),
        getCandidateDiscovery(user.id),
    ]);

    const target = firstParam(resolvedSearchParams.target);
    const targetCandidate = candidateData.candidates.find((candidate) => candidate.profile.id === target) ?? null;
    const outgoingRequests = requests.filter((request) => request.requesterId === user.id);
    const incomingRequests = requests.filter((request) => request.targetProfileId === user.id);

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="section-kicker">Requests</div>
                <h1 className="display-font text-6xl leading-[0.9] md:text-7xl">KELOLA REQUEST MASUK DAN KELUAR</h1>
            </div>

            {targetCandidate && (
                <section className="space-y-4">
                    <div className="section-kicker">Kirim request baru</div>
                    <JoinRequestComposer targetProfileId={targetCandidate.profile.id} />
                </section>
            )}

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="section-kicker">Outgoing</div>
                    {outgoingRequests.map((request) => (
                        <article key={request.id} className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                            <div className="flex flex-wrap gap-3">
                                <span className="brutal-chip bg-[var(--tm-accent-2)]">{request.status}</span>
                                <span className="brutal-chip bg-white">{request.selectedRole}</span>
                            </div>
                            <p className="text-base leading-8 text-[var(--tm-muted)]">{request.message}</p>
                            {request.status === "pending" && (
                                <form action={withdrawJoinRequest}>
                                    <input type="hidden" name="request_id" value={request.id} />
                                    <button type="submit" className="brutal-button-secondary">
                                        Tarik request
                                    </button>
                                </form>
                            )}
                        </article>
                    ))}
                    {outgoingRequests.length === 0 && (
                        <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                            <p className="text-base leading-8 text-[var(--tm-muted)]">Belum ada request keluar.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="section-kicker">Incoming</div>
                    {incomingRequests.map((request) => (
                        <article key={request.id} className="brutal-panel grid gap-4 bg-[var(--tm-paper-strong)] p-5">
                            <div className="flex flex-wrap gap-3">
                                <span className="brutal-chip bg-[#d6e4ff]">{request.status}</span>
                                <span className="brutal-chip bg-white">{request.selectedRole}</span>
                            </div>
                            <p className="text-base leading-8 text-[var(--tm-muted)]">{request.message}</p>
                        </article>
                    ))}
                    {incomingRequests.length === 0 && (
                        <div className="brutal-panel bg-[var(--tm-paper-strong)] p-5">
                            <p className="text-base leading-8 text-[var(--tm-muted)]">Belum ada request masuk.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
