import { sessionModel } from "../models/session.model.js";
import type { Isession } from "../types/models/Isession.js";

const createSession = async (sessionObject: Isession) => {
  return await sessionModel.create(sessionObject);
};

export const sessionRepository = {
  createSession,
};
