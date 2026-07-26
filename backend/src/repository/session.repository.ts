import { sessionModel } from "../models/session.model.js";
import type { Isession } from "../types/models/Isession.js";

const createSession = async (sessionObject: Isession) => {
  return await sessionModel.create(sessionObject);
};

const findSession = async (sessionId: string) => {
  return await sessionModel.findById(sessionId);
};

const findUserSessions = async (userId: string): Promise<Isession[]> => {
  return await sessionModel.find({ userId, revoke: false });
};

const updateUserSessions = async (userId: string) => {
  return await sessionModel.updateMany(
    { userId, revoke: false },
    {
      $set: {
        revoke: true,
      },
    },
  );
};

const updateSession = async (sessionId: string, payload: Partial<Isession>) => {
  return await sessionModel.findByIdAndUpdate(sessionId, payload, {
    returnDocument: "after",
  });
};

export const sessionRepository = {
  createSession,
  findSession,
  updateSession,
  findUserSessions,
  updateUserSessions,
};
