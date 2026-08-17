import {
  isImgBBRateLimitError,
  uploadToImgBB,
} from "./imgbbService";

type TmpfileResponse = {
  downloadLinkEncoded?: string;
  downloadLink?: string;
  url?: string;
};

type R2UploadResponse = {
  url?: string;
};

export type MediaUploadEnv = {
  IMGBB_API_KEY: string;
  IMGBB_API_KEYS?: string;
  TMPFILE_BASE_URL: string;
  R2_UPLOAD_BASE_URL: string;
  R2_UPLOAD_API_KEY: string;
};

const R2_MAX_BYTES = 25 * 1024 * 1024;
const TMPFILE_MAX_ATTEMPTS = 3;
const DEFAULT_TMPFILE_BASE_URL = "https://tmpfile.link";
const DEFAULT_R2_UPLOAD_BASE_URL =
  "https://ilovesale-storage.alla-kohanjuk.workers.dev";

function resolveMediaUploadEnv(env: MediaUploadEnv): MediaUploadEnv {
  return {
    IMGBB_API_KEY: env.IMGBB_API_KEY ?? "",
    IMGBB_API_KEYS: env.IMGBB_API_KEYS,
    TMPFILE_BASE_URL:
      env.TMPFILE_BASE_URL?.trim() || DEFAULT_TMPFILE_BASE_URL,
    R2_UPLOAD_BASE_URL:
      env.R2_UPLOAD_BASE_URL?.trim() || DEFAULT_R2_UPLOAD_BASE_URL,
    R2_UPLOAD_API_KEY: env.R2_UPLOAD_API_KEY ?? "",
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function streamToBytes(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
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

  return buffer;
}

function parseImgBBKeys(primary: string, additional?: string): string[] {
  const keys = [primary.trim()];
  if (additional) {
    keys.push(
      ...additional
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean),
    );
  }
  return [...new Set(keys)];
}

function extractTmpfileUrl(data: TmpfileResponse): string | undefined {
  return data.downloadLinkEncoded ?? data.downloadLink ?? data.url;
}

async function uploadToTmpfile(
  bytes: Uint8Array,
  baseUrl: string,
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/upload`;

  for (let attempt = 0; attempt < TMPFILE_MAX_ATTEMPTS; attempt++) {
    const form = new FormData();
    form.append("file", new Blob([bytes]), "image.jpg");

    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    if (res.status >= 500 && attempt < TMPFILE_MAX_ATTEMPTS - 1) {
      continue;
    }

    if (!res.ok) {
      throw new Error(`tmpfile upload failed: HTTP ${res.status}`);
    }

    const data = (await res.json()) as TmpfileResponse;
    const publicUrl = extractTmpfileUrl(data);

    if (!publicUrl) {
      throw new Error("tmpfile upload failed: no URL in response");
    }

    return publicUrl;
  }

  throw new Error("tmpfile upload failed after retries");
}

async function uploadToR2(
  bytes: Uint8Array,
  baseUrl: string,
  apiKey: string,
): Promise<string> {
  if (bytes.length > R2_MAX_BYTES) {
    throw new Error(
      `R2 upload failed: file exceeds 25MB limit (${bytes.length} bytes)`,
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/upload`;
  const form = new FormData();
  form.append("file", new Blob([bytes]), "image.jpg");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`R2 upload failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as R2UploadResponse;

  if (!data.url) {
    throw new Error("R2 upload failed: no URL in response");
  }

  return data.url;
}

async function uploadViaImgBB(
  bytes: Uint8Array,
  env: MediaUploadEnv,
  failures: string[],
): Promise<string | null> {
  const keys = parseImgBBKeys(env.IMGBB_API_KEY, env.IMGBB_API_KEYS).filter(
    Boolean,
  );

  if (keys.length === 0) {
    failures.push("ImgBB: no API keys configured");
    return null;
  }

  for (const key of keys) {
    try {
      console.log("media upload: trying ImgBB");
      const url = await uploadToImgBB(bytes, key);
      console.log("media upload: ImgBB succeeded");
      return url;
    } catch (error) {
      failures.push(`ImgBB: ${errorMessage(error)}`);
      if (isImgBBRateLimitError(error)) {
        console.warn("media upload: ImgBB rate limit, trying next key");
        continue;
      }
      console.warn("media upload: ImgBB failed, trying tmpfile");
      return null;
    }
  }

  console.warn("media upload: ImgBB keys exhausted, trying tmpfile");
  return null;
}

export async function uploadMedia(
  stream: ReadableStream<Uint8Array>,
  env: MediaUploadEnv,
): Promise<string> {
  const config = resolveMediaUploadEnv(env);
  const failures: string[] = [];
  const bytes = await streamToBytes(stream);

  const imgbbUrl = await uploadViaImgBB(bytes, config, failures);
  if (imgbbUrl) {
    return imgbbUrl;
  }

  try {
    console.log(`media upload: trying tmpfile (${config.TMPFILE_BASE_URL})`);
    const url = await uploadToTmpfile(bytes, config.TMPFILE_BASE_URL);
    console.log("media upload: tmpfile succeeded");
    return url;
  } catch (error) {
    failures.push(`tmpfile: ${errorMessage(error)}`);
    console.warn("media upload: tmpfile failed, trying R2:", error);
  }

  if (!config.R2_UPLOAD_API_KEY) {
    failures.push("R2: R2_UPLOAD_API_KEY is not configured");
    throw new Error(
      `All upload providers failed: ${failures.join(" | ")}`,
    );
  }

  try {
    console.log(`media upload: trying R2 (${config.R2_UPLOAD_BASE_URL})`);
    const url = await uploadToR2(
      bytes,
      config.R2_UPLOAD_BASE_URL,
      config.R2_UPLOAD_API_KEY,
    );
    console.log("media upload: R2 succeeded");
    return url;
  } catch (error) {
    failures.push(`R2: ${errorMessage(error)}`);
    throw new Error(
      `All upload providers failed: ${failures.join(" | ")}`,
    );
  }
}
