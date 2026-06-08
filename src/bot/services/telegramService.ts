type TelegramGetFileResponse =
  | {
      ok: true;
      result: {
        file_id: string;
        file_path: string;
        file_size?: number;
      };
    }
  | {
      ok: false;
      description: string;
      error_code?: number;
    };

// -----------------------------
// Generic safe JSON helper
// -----------------------------
async function safeJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

// -----------------------------
// Type guard
// -----------------------------
function isTelegramFileSuccess(
  data: TelegramGetFileResponse,
): data is Extract<TelegramGetFileResponse, { ok: true }> {
  return data.ok === true;
}

// -----------------------------
// 1. get file path
// -----------------------------
export async function getTelegramFilePath(
  fileId: string,
  botToken: string,
): Promise<string> {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`,
  );

  const data = await safeJson<TelegramGetFileResponse>(res);

  if (!isTelegramFileSuccess(data)) {
    throw new Error(`Telegram getFile failed: ${data.description}`);
  }

  return data.result.file_path;
}

// -----------------------------
// 2. download file
// -----------------------------
export async function downloadTelegramFile(
  filePath: string,
  botToken: string,
): Promise<ReadableStream<Uint8Array>> {
  const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  const res = await fetch(url);

  if (!res.ok || !res.body) {
    throw new Error("Failed to download telegram file");
  }

  return res.body;
}
