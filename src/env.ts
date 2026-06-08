import { KVNamespace } from "@cloudflare/workers-types";
export type Env = {
  TELEGRAM_BOT_TOKEN: string;
  DATABASE_URL: string;
  IMGBB_API_KEY: string;
  TELEGRAM_ALLOWED_USER_ID: string;
  TELEGRAM_SESSIONS: KVNamespace;
};
