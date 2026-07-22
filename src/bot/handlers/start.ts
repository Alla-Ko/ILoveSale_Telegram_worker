import { sendKeyboard } from "../helpers/sendKeyboard";
import { getSession, saveSession } from "../services/sessionService";

export async function handleStart(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const token = c.env.TELEGRAM_BOT_TOKEN;

  const session = await getSession(kv, userId);

  // 🔴 блок якщо вже ACTIVE
  if (session?.state === "ACTIVE" && session?.announcementId) {
    await sendKeyboard(
      chatId,
      "Finish current announcement first: send /stop",
      token,
      [
        {
          text: "⏹ Stop",
          callback_data: "stop",
        },
      ],
    );

    return c.text("ok");
  }

  // 🔄 reset session
  await saveSession(kv, userId, {
    state: "WAITING_TITLE",
    announcementId: null,
    tempTitle: null,
    tempCountry: null,
  });

  // ✅ ВАЖЛИВО: це має бути Telegram message
  await await sendKeyboard(chatId, "Send announcement title", token, [
    {
      text: "⏹ Stop",
      callback_data: "stop",
    },
  ]);

  return c.text("ok");
}
