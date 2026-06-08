import { createAnnouncement } from "../services/announcementService";
import { getSession, saveSession } from "../services/sessionService";
import { parseCountry } from "../utils/countryParser";

export async function handleText(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;

  const userId = msg.from.id;
  const text = msg.text;

  const session = await getSession(kv, userId);

  if (!session) {
    return c.text("Send /start to begin");
  }

  // -----------------------------
  // 1. WAITING_TITLE
  // -----------------------------
  if (session.state === "WAITING_TITLE") {
    await saveSession(kv, userId, {
      ...session,
      tempTitle: text,
      state: "WAITING_COUNTRY",
    });

    return c.text("Send country");
  }

  // -----------------------------
  // 2. WAITING_COUNTRY
  // -----------------------------
  if (session.state === "WAITING_COUNTRY") {
    const country = parseCountry(text);

    const announcementId = await createAnnouncement(c.env.DB, {
      title: session.tempTitle ?? "",
      country,
      creatorId: c.env.BOT_CREATOR_USER_ID,
    });

    await saveSession(kv, userId, {
      state: "ACTIVE",
      announcementId,
      tempTitle: null,
      tempCountry: null,
    });

    return c.text("Announcement created. Now send photos.");
  }

  // -----------------------------
  // 3. ACTIVE / IDLE
  // -----------------------------
  if (session.state === "ACTIVE") {
    return c.text("Now send photos for this announcement.");
  }

  return c.text("Send /start to begin");
}
