import { sendMessage } from "../helpers/sendMessage";
import { createAnnouncementApi } from "../services/apiService";
import { getSession, saveSession } from "../services/sessionService";
import { parseCountry } from "../utils/countryParser";

export async function handleText(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;
  const token = c.env.TELEGRAM_BOT_TOKEN;

  const session = await getSession(kv, userId);

  if (!session) {
    await sendMessage(chatId, "Send /start to begin", token);
    return c.text("ok");
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

    await sendMessage(chatId, "Send country", token);
    return c.text("ok");
  }

  // -----------------------------
  // 2. WAITING_COUNTRY
  // -----------------------------
  if (session.state === "WAITING_COUNTRY") {
    const country = parseCountry(text);

    const announcementId = await createAnnouncementApi(c.env.BOT_APIKEY, {
      title: session.tempTitle ?? "",
      country,
    });

    await saveSession(kv, userId, {
      state: "ACTIVE",
      announcementId,
      tempTitle: null,
      tempCountry: null,
    });

    await sendMessage(chatId, "Announcement created. Now send photos.", token);

    return c.text("ok");
  }

  // -----------------------------
  // 3. ACTIVE / IDLE
  // -----------------------------
  if (session.state === "ACTIVE") {
    return c.text("ok");
  }

  await sendMessage(chatId, "Send /start to begin", token);
  return c.text("ok");
}

// ------------------
// helper
// ------------------
