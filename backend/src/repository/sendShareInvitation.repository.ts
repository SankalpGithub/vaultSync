import { shareInvitations } from "../models/shareInvitation.model.js";
import type { ICreateShareInvitations } from "../types/models/IshareInvitation.js";

const createSendShareInvitation = async (
  payload: ICreateShareInvitations,
) => {
  return await shareInvitations.create(payload);
};

export const SendShareInvitationRepository = {
  createSendShareInvitation,
};
