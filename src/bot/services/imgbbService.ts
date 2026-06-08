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

// -----------------------------
// safe JSON helper
// -----------------------------
async function safeJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

// -----------------------------
// stream → base64 (Worker-safe)
// -----------------------------
async function streamToBase64(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const buffer = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0),
  );

  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  // Worker-safe base64
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte === undefined) continue;

    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

// -----------------------------
// upload to ImgBB
// -----------------------------
export async function uploadToImgBB(
  stream: ReadableStream<Uint8Array>,
  apiKey: string,
): Promise<string> {
  const base64 = await streamToBase64(stream);

  const form = new FormData();
  form.append("image", base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  const data = await safeJson<ImgBBResponse>(res);

  if (!data.success) {
    throw new Error(
      `ImgBB upload failed: ${data.error?.message ?? "unknown error"}`,
    );
  }

  return data.data.url;
}
