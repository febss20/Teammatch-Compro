"use server";

import { requireUser } from "@/lib/auth";
import { runDashboardMaintenance } from "@/lib/dashboard/runtime";
import {
    closeBoardRecruitment as closeBoardRecruitmentAction,
    createCompetitionIdeaBoard as createCompetitionIdeaBoardAction,
    deleteCompetitionIdeaBoard as deleteCompetitionIdeaBoardAction,
    discardBoardDraft as discardBoardDraftAction,
    publishBoardFromDraft as publishBoardFromDraftAction,
    saveBoardDraft as saveBoardDraftAction,
    updateCompetitionIdeaBoard as updateCompetitionIdeaBoardAction,
} from "@/app/(dashboard)/dashboard/boards/actions";
import {
    acceptBoardApplication as acceptBoardApplicationAction,
    acceptJoinRequest as acceptJoinRequestAction,
    applyToBoard as applyToBoardAction,
    rejectBoardApplication as rejectBoardApplicationAction,
    rejectJoinRequest as rejectJoinRequestAction,
    saveBoardApplication as saveBoardApplicationAction,
    saveCandidate as saveCandidateAction,
    sendJoinRequest as sendJoinRequestAction,
    unsaveCandidate as unsaveCandidateAction,
    withdrawJoinRequest as withdrawJoinRequestAction,
} from "@/app/(dashboard)/dashboard/matching/actions";
import {
    completeProfileStepOne as completeProfileStepOneAction,
    completeProfileStepThree as completeProfileStepThreeAction,
    completeProfileStepTwo as completeProfileStepTwoAction,
    updateProfile as updateProfileAction,
} from "@/app/(dashboard)/dashboard/profile/actions";
import {
    logoutAction as logoutActionImpl,
    markNotificationRead as markNotificationReadAction,
    updatePassword as updatePasswordAction,
    updateSettings as updateSettingsAction,
} from "@/app/(dashboard)/dashboard/settings/actions";
import {
    confirmTeamCommitment as confirmTeamCommitmentAction,
    recordCompetitionResult as recordCompetitionResultAction,
    renameTeam as renameTeamAction,
    reopenExpiredSlot as reopenExpiredSlotAction,
    saveTeamResource as saveTeamResourceAction,
    sendCommitmentReminder as sendCommitmentReminderAction,
    submitTestimonial as submitTestimonialAction,
} from "@/app/(dashboard)/dashboard/teams/actions";
import type {
    BoardApplicationFieldName,
    CommitmentFieldName,
    CompetitionIdeaBoardFieldName,
    FormActionState,
    JoinRequestFieldName,
    PasswordChangeFieldName,
    ProfileFieldName,
    ProfileStepOneFieldName,
    ProfileStepThreeFieldName,
    ProfileStepTwoFieldName,
    SettingsFieldName,
    TeamRenameFieldName,
    TeamResourceFieldName,
    TeamResultFieldName,
    TestimonialFieldName,
} from "@/lib/types";
import type { DeleteCompetitionIdeaBoardResult } from "@/app/(dashboard)/dashboard/boards/actions";

export async function logoutAction(): Promise<void> {
    return logoutActionImpl();
}

export async function triggerDashboardMaintenance(): Promise<{ updated: boolean }> {
    await requireUser();
    const updated = await runDashboardMaintenance();
    return { updated };
}

export async function completeProfileStepOne(
    previousState: FormActionState<ProfileStepOneFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepOneFieldName>> {
    return completeProfileStepOneAction(previousState, formData);
}

export async function completeProfileStepTwo(
    previousState: FormActionState<ProfileStepTwoFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepTwoFieldName>> {
    return completeProfileStepTwoAction(previousState, formData);
}

export async function completeProfileStepThree(
    previousState: FormActionState<ProfileStepThreeFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileStepThreeFieldName>> {
    return completeProfileStepThreeAction(previousState, formData);
}

export async function updateProfile(
    previousState: FormActionState<ProfileFieldName>,
    formData: FormData,
): Promise<FormActionState<ProfileFieldName>> {
    return updateProfileAction(previousState, formData);
}

export async function saveBoardDraft(formData: FormData): Promise<void> {
    return saveBoardDraftAction(formData);
}

export async function discardBoardDraft(): Promise<void> {
    return discardBoardDraftAction();
}

export async function publishBoardFromDraft(
    previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    return publishBoardFromDraftAction(previousState, formData);
}

export async function createCompetitionIdeaBoard(
    previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    return createCompetitionIdeaBoardAction(previousState, formData);
}

export async function updateCompetitionIdeaBoard(
    previousState: FormActionState<CompetitionIdeaBoardFieldName>,
    formData: FormData,
): Promise<FormActionState<CompetitionIdeaBoardFieldName>> {
    return updateCompetitionIdeaBoardAction(previousState, formData);
}

export async function deleteCompetitionIdeaBoard(formData: FormData): Promise<DeleteCompetitionIdeaBoardResult> {
    return deleteCompetitionIdeaBoardAction(formData);
}

export async function closeBoardRecruitment(formData: FormData): Promise<void> {
    return closeBoardRecruitmentAction(formData);
}

export async function saveCandidate(formData: FormData): Promise<void> {
    return saveCandidateAction(formData);
}

export async function unsaveCandidate(formData: FormData): Promise<void> {
    return unsaveCandidateAction(formData);
}

export async function sendJoinRequest(
    previousState: FormActionState<JoinRequestFieldName>,
    formData: FormData,
): Promise<FormActionState<JoinRequestFieldName>> {
    return sendJoinRequestAction(previousState, formData);
}

export async function withdrawJoinRequest(formData: FormData): Promise<void> {
    return withdrawJoinRequestAction(formData);
}

export async function acceptJoinRequest(formData: FormData): Promise<void> {
    return acceptJoinRequestAction(formData);
}

export async function rejectJoinRequest(formData: FormData): Promise<void> {
    return rejectJoinRequestAction(formData);
}

export async function applyToBoard(
    previousState: FormActionState<BoardApplicationFieldName>,
    formData: FormData,
): Promise<FormActionState<BoardApplicationFieldName>> {
    return applyToBoardAction(previousState, formData);
}

export async function saveBoardApplication(formData: FormData): Promise<void> {
    return saveBoardApplicationAction(formData);
}

export async function acceptBoardApplication(formData: FormData): Promise<void> {
    return acceptBoardApplicationAction(formData);
}

export async function rejectBoardApplication(formData: FormData): Promise<void> {
    return rejectBoardApplicationAction(formData);
}

export async function confirmTeamCommitment(
    previousState: FormActionState<CommitmentFieldName>,
    formData: FormData,
): Promise<FormActionState<CommitmentFieldName>> {
    return confirmTeamCommitmentAction(previousState, formData);
}

export async function sendCommitmentReminder(formData: FormData): Promise<void> {
    return sendCommitmentReminderAction(formData);
}

export async function reopenExpiredSlot(formData: FormData): Promise<void> {
    return reopenExpiredSlotAction(formData);
}

export async function renameTeam(
    previousState: FormActionState<TeamRenameFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamRenameFieldName>> {
    return renameTeamAction(previousState, formData);
}

export async function saveTeamResource(
    previousState: FormActionState<TeamResourceFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamResourceFieldName>> {
    return saveTeamResourceAction(previousState, formData);
}

export async function recordCompetitionResult(
    previousState: FormActionState<TeamResultFieldName>,
    formData: FormData,
): Promise<FormActionState<TeamResultFieldName>> {
    return recordCompetitionResultAction(previousState, formData);
}

export async function submitTestimonial(
    previousState: FormActionState<TestimonialFieldName>,
    formData: FormData,
): Promise<FormActionState<TestimonialFieldName>> {
    return submitTestimonialAction(previousState, formData);
}

export async function updatePassword(
    previousState: FormActionState<PasswordChangeFieldName>,
    formData: FormData,
): Promise<FormActionState<PasswordChangeFieldName>> {
    return updatePasswordAction(previousState, formData);
}

export async function markNotificationRead(formData: FormData): Promise<void> {
    return markNotificationReadAction(formData);
}

export async function updateSettings(
    previousState: FormActionState<SettingsFieldName>,
    formData: FormData,
): Promise<FormActionState<SettingsFieldName>> {
    return updateSettingsAction(previousState, formData);
}
