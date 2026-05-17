import "server-only";

interface ServerErrorContext {
    action: string;
    metadata?: Record<string, boolean | number | string | null>;
    requestId?: string | null;
    userId?: string | null;
}

export function logServerError(context: ServerErrorContext, error: unknown): void {
    console.error("Server operation failed", {
        ...context,
        error: error instanceof Error ? error.message : String(error),
    });
}

export function logServerWarning(context: ServerErrorContext, error: unknown): void {
    console.warn("Server operation warning", {
        ...context,
        error: error instanceof Error ? error.message : String(error),
    });
}

export function getUserErrorMessage(message: string): string {
    return message;
}

export class PublicActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PublicActionError";
    }
}
