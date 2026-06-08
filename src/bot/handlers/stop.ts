import { clearSession } from "../services/sessionService";

export async function handleStop(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;
  const userId = msg.from.id;

  await clearSession(kv, userId);

  return c.text("Stopped");
}
