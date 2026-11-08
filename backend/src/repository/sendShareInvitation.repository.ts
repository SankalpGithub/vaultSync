import { SendShareInvitation } from "../models/sendShareInvitation.model.js";
import type { ICreateSendShareInvitation } from "../types/models/IsendShareInvitation.js";

const createSendShareInvitation = async (
  payload: ICreateSendShareInvitation,
) => {
  return await SendShareInvitation.create(payload);
};

export const SendShareInvitationRepository = {
  createSendShareInvitation,
};
