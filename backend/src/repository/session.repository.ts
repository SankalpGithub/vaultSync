import { sessionModel } from "../models/session.model.js";
import type { Isession } from "../types/models/Isession.js";

const createSession = async (sessionObject: Isession) => {
  return await sessionModel.create(sessionObject);
};

const findSession = async (sessionId: string) => {
  return await sessionModel.findOne({
    id: sessionId,
  });
};

const updateSession = async (sessionId: string, payload: Partial<Isession>) => {
  return await sessionModel.findByIdAndUpdate(
    sessionId,
    {
      $set: {
        payload,
      },
    },
    { new: true },
  );
};

export const sessionRepository = {
  createSession,
  findSession,
  updateSession,
};
