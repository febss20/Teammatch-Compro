import type {
    BoardApplicationFieldName,
    CommitmentFieldName,
    CompetitionIdeaBoardFieldName,
    FormActionState,
    JoinRequestFieldName,
    LoginFieldName,
    PasswordChangeFieldName,
    ProfileFieldName,
    ProfileStepOneFieldName,
    ProfileStepThreeFieldName,
    ProfileStepTwoFieldName,
    RegisterFieldName,
    SettingsFieldName,
    TeamResourceFieldName,
    TeamRenameFieldName,
    TeamResultFieldName,
    TestimonialFieldName,
} from "@/lib/types";

function createInitialState<FieldName extends string>(): FormActionState<FieldName> {
    return {
        success: false,
        message: "",
        formError: null,
        fieldErrors: {},
        values: {},
    };
}

export const competitionIdeaBoardInitialState = createInitialState<CompetitionIdeaBoardFieldName>();
export const loginInitialState = createInitialState<LoginFieldName>();
export const registerInitialState = createInitialState<RegisterFieldName>();
export const profileStepOneInitialState = createInitialState<ProfileStepOneFieldName>();
export const profileStepTwoInitialState = createInitialState<ProfileStepTwoFieldName>();
export const profileStepThreeInitialState = createInitialState<ProfileStepThreeFieldName>();
export const profileInitialState = createInitialState<ProfileFieldName>();
export const joinRequestInitialState = createInitialState<JoinRequestFieldName>();
export const boardApplicationInitialState = createInitialState<BoardApplicationFieldName>();
export const settingsInitialState = createInitialState<SettingsFieldName>();
export const passwordChangeInitialState = createInitialState<PasswordChangeFieldName>();
export const commitmentInitialState = createInitialState<CommitmentFieldName>();
export const teamRenameInitialState = createInitialState<TeamRenameFieldName>();
export const teamResultInitialState = createInitialState<TeamResultFieldName>();
export const testimonialInitialState = createInitialState<TestimonialFieldName>();
export const teamResourceInitialState = createInitialState<TeamResourceFieldName>();
