import { handlePhoto } from "./handlers/photo";
import { handleStart } from "./handlers/start";
import { handleStop } from "./handlers/stop";
import { handleText } from "./handlers/text";

export async function telegramWebhook(c: any) {
  const update = await c.req.json();

  // --------------------------
  // CALLBACK BUTTONS (важливо!)
  // --------------------------
  if (update.callback_query) {
    const callback = update.callback_query;

    if (callback.data === "start") {
      return handleStart(c, {
        chat: callback.message.chat,
        from: callback.from,
      });
    }

    if (callback.data === "stop") {
      return handleStop(c, {
        chat: callback.message.chat,
        from: callback.from,
      });
    }

    return c.text("ok");
  }

  // --------------------------
  // NORMAL MESSAGE
  // --------------------------
  console.log("👤 MSG:", update.message);
  const msg = update.message;

  if (!msg) return c.text("ok");

  const userId = msg.from.id;
  // security check
  const allowed = Number(c.env.TELEGRAM_ALLOWED_USER_ID);
  if (userId !== allowed) return c.text("ignored");

  // ROUTING
  if (msg.text === "/start") return handleStart(c, msg);
  if (msg.text === "/stop") return handleStop(c, msg);

  if (msg.photo) return handlePhoto(c, msg);

  if (msg.text) return handleText(c, msg);

  return c.text("ok");
}
