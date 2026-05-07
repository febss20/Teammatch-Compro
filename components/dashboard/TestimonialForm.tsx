"use client";

import { useActionState } from "react";
import { submitTestimonial } from "@/app/(dashboard)/dashboard/actions";
import { testimonialInitialState } from "@/lib/forms";

export default function TestimonialForm({
    defaultBody,
    defaultRating,
    targetProfileId,
    teamId,
    testimonialId,
}: {
    defaultBody?: string;
    defaultRating?: number;
    targetProfileId: string;
    teamId: string;
    testimonialId?: string;
}) {
    const [state, formAction, pending] = useActionState(submitTestimonial, testimonialInitialState);

    return (
        <form action={formAction} className="grid gap-3">
            <input type="hidden" name="team_id" value={teamId} />
            <input type="hidden" name="target_profile_id" value={targetProfileId} />
            {testimonialId && <input type="hidden" name="testimonial_id" value={testimonialId} />}
            {state.formError && <div className="brutal-alert-error text-sm">{state.formError}</div>}
            {state.success && state.message && <div className="brutal-alert-success text-sm">{state.message}</div>}
            <div className="grid gap-2">
                <label htmlFor={`rating-${targetProfileId}`} className="brutal-label">
                    Rating
                </label>
                <select
                    id={`rating-${targetProfileId}`}
                    name="rating"
                    className="brutal-select"
                    defaultValue={String(defaultRating ?? 5)}
                    disabled={pending}
                >
                    {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                            {value} bintang
                        </option>
                    ))}
                </select>
            </div>
            <div className="grid gap-2">
                <label htmlFor={`body-${targetProfileId}`} className="brutal-label">
                    Testimoni
                </label>
                <textarea
                    id={`body-${targetProfileId}`}
                    name="body"
                    rows={3}
                    className="brutal-textarea"
                    placeholder="Tulis pengalaman kerja tim Anda."
                    defaultValue={defaultBody ?? ""}
                    disabled={pending}
                />
            </div>
            <button type="submit" disabled={pending} className="brutal-button-secondary">
                {pending ? "Menyimpan..." : testimonialId ? "Perbarui Testimoni" : "Kirim Testimoni"}
            </button>
        </form>
    );
}
