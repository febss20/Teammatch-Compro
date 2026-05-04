import { ZodError } from "zod";

export function getFieldErrors<FieldName extends string>(error: ZodError): Partial<Record<FieldName, string[]>> {
    const flattenedErrors = error.flatten().fieldErrors;
    const result: Partial<Record<FieldName, string[]>> = {};

    Object.entries(flattenedErrors).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            result[key as FieldName] = value;
        }
    });

    return result;
}
