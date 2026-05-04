import type { CompetitionIdeaBoardFieldName, FormActionState, LoginFieldName, RegisterFieldName } from "@/lib/types";

export const competitionIdeaBoardInitialState: FormActionState<CompetitionIdeaBoardFieldName> = {
    success: false,
    message: "",
    formError: null,
    fieldErrors: {},
};

export const loginInitialState: FormActionState<LoginFieldName> = {
    success: false,
    message: "",
    formError: null,
    fieldErrors: {},
};

export const registerInitialState: FormActionState<RegisterFieldName> = {
    success: false,
    message: "",
    formError: null,
    fieldErrors: {},
};
