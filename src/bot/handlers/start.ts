import { getSession, saveSession } from "../services/sessionService";

export async function handleStart(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;
  const userId = msg.from.id;
  const session = await getSession(kv, userId);
  if (session?.state === "ACTIVE" && session?.announcementId) {
    return c.text("Finish current announcement first: send /stop");
  }
  // ініціалізуємо нову сесію / скидаємо стару
  await saveSession(kv, userId, {
    state: "WAITING_TITLE",
    announcementId: null,
    tempTitle: null,
    tempCountry: null,
  });

  return c.text("Send announcement title");
}
