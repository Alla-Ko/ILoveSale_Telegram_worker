import { createCollageApi } from "../services/apiService";
import { uploadToImgBB } from "../services/imgbbService";
import { getSession } from "../services/sessionService";
import {
  downloadTelegramFile,
  getTelegramFilePath,
} from "../services/telegramService";

export async function handlePhoto(c: any, msg: any) {
  const kv = c.env.TELEGRAM_SESSIONS;

  const botToken = c.env.TELEGRAM_BOT_TOKEN;
  const imgKey = c.env.IMGBB_API_KEY;

  const userId = msg.from.id;

  // -----------------------------
  // 1. GET SESSION (KV)
  // -----------------------------
  const session = await getSession(kv, userId);

  if (!session) {
    return c.text("No session");
  }

  // -----------------------------
  // 2. CHECK ACTIVE STATE
  // -----------------------------
  if (session.state !== "ACTIVE" || !session.announcementId) {
    return c.text("No active announcement");
  }

  // -----------------------------
  // 3. GET FILE FROM TELEGRAM
  // -----------------------------
  const fileId = msg.photo?.at(-1)?.file_id;

  if (!fileId) {
    return c.text("No file found");
  }

  const filePath = await getTelegramFilePath(fileId, botToken);
  const stream = await downloadTelegramFile(filePath, botToken);

  // -----------------------------
  // 4. UPLOAD TO IMGBB
  // -----------------------------
  const imageUrl = await uploadToImgBB(stream, imgKey);

  // -----------------------------
  // 5. SAVE COLLAGE (POSTGRES)
  // -----------------------------
  await createCollageApi(c.env.BOT_APIKEY, session.announcementId, {
    mediaUrl: imageUrl,
    mediaType: 0,
    caption1: msg.caption ?? undefined,
  });

  return c.text("image saved");
}
