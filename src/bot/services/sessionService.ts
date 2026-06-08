import { KVNamespace } from "@cloudflare/workers-types";

type SessionState = "IDLE" | "WAITING_TITLE" | "WAITING_COUNTRY" | "ACTIVE";
type Session = {
  state: SessionState;
  announcementId?: number | null;
  tempTitle?: string | null;
  tempCountry?: string | null;
};

const prefix = (userId: number) => `session:${userId}`;
// --------------------
// GET
// --------------------
export async function getSession(
  kv: KVNamespace,
  userId: number,
): Promise<Session> {
  const raw = await kv.get(prefix(userId));
  if (!raw) {
    return {
      state: "IDLE",
      announcementId: null,
      tempTitle: null,
      tempCountry: null,
    };
  }

  return JSON.parse(raw);
}

// --------------------
// SET / SAVE
// --------------------
export async function saveSession(
  kv: KVNamespace,
  userId: number,
  session: Session,
) {
  await kv.put(prefix(userId), JSON.stringify(session));
}

// --------------------
// CLEAR
// --------------------
export async function clearSession(kv: KVNamespace, userId: number) {
  await kv.delete(prefix(userId));
}
