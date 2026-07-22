import { KVNamespace } from "@cloudflare/workers-types";
export type Env = {
  TELEGRAM_BOT_TOKEN: string;
  DATABASE_URL: string;
  BOT_APIKEY: string;
  IMGBB_API_KEY: string;
  IMGBB_API_KEYS?: string;
  TMPFILE_BASE_URL: string;
  R2_UPLOAD_BASE_URL: string;
  R2_UPLOAD_API_KEY: string;
  TELEGRAM_ALLOWED_USER_ID: string;
  TELEGRAM_SESSIONS: KVNamespace;
};
