export interface ItokenPayload {
  userId: string;
  sessionId: string;
  type: "access" | "refresh";
}
