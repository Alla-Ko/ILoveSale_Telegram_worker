import { sendMessage } from "../helpers/sendMessage";
import { clearSession } from "../services/sessionService";

export async function handleStop(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const token = c.env.TELEGRAM_BOT_TOKEN;

  await clearSession(kv, userId);

  await sendMessage(chatId, "Stopped", token);

  return c.text("ok");
}
