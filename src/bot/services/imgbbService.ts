type ImgBBResponse =
  | {
      success: true;
      data: {
        url: string;
        display_url: string;
        id: string;
      };
    }
  | {
      success: false;
      error: {
        message: string;
        code?: number;
      };
    };

async function safeJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function bytesToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte === undefined) continue;
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export class ImgBBRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImgBBRateLimitError";
  }
}

export function isImgBBRateLimitError(error: unknown): boolean {
  if (error instanceof ImgBBRateLimitError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("rate limit") || msg.includes("rate_limit");
  }
  return false;
}

function isRateLimitMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes("rate limit") || msg.includes("rate_limit");
}

export async function uploadToImgBB(
  bytes: Uint8Array,
  apiKey: string,
): Promise<string> {
  const base64 = bytesToBase64(bytes);

  const form = new FormData();
  form.append("image", base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  if (res.status === 429) {
    throw new ImgBBRateLimitError("ImgBB rate limit reached");
  }

  const data = await safeJson<ImgBBResponse>(res);

  if (!data.success) {
    const message = data.error?.message ?? "unknown error";
    if (isRateLimitMessage(message)) {
      throw new ImgBBRateLimitError(`ImgBB upload failed: ${message}`);
    }
    throw new Error(`ImgBB upload failed: ${message}`);
  }

  return data.data.url;
}
