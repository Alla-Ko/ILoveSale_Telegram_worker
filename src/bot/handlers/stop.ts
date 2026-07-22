import { sendKeyboard } from "../helpers/sendKeyboard";
import { clearSession } from "../services/sessionService";

export async function handleStop(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const token = c.env.TELEGRAM_BOT_TOKEN;

  await clearSession(kv, userId);

  await sendKeyboard(chatId, "Announcement closed", token, [
    {
      text: "▶ Start",
      callback_data: "start",
    },
  ]);

  return c.text("ok");
}
