"use client";

import { useCallback, useState } from "react";
import { createIdempotencyKey } from "@/lib/shared/idempotency";

export function useIdempotencyKey(): {
    idempotencyKey: string;
    rotateIdempotencyKey: () => void;
} {
    const [idempotencyKey, setIdempotencyKey] = useState<string>(createIdempotencyKey);
    const rotateIdempotencyKey = useCallback(() => {
        setIdempotencyKey(createIdempotencyKey());
    }, []);

    return {
        idempotencyKey,
        rotateIdempotencyKey,
    };
}
