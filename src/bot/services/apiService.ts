const API_URL = "https://ilovesale-anons-bot.onrender.com/api";

function getHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };
}

export async function createAnnouncementApi(
  apiKey: string,
  data: {
    title: string;
    country: number;
  },
): Promise<number> {
  const response = await fetch(`${API_URL}/announcements`, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      title: data.title,
      country: data.country,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create announcement (${response.status}): ${errorText}`,
    );
  }

  const result = (await response.json()) as {
    id: number;
  };

  return result.id;
}

export async function createCollageApi(
  apiKey: string,
  announcementId: number,
  data: {
    mediaUrl: string;
    mediaType: number;
    caption1?: string;
  },
): Promise<number> {
  const response = await fetch(
    `${API_URL}/announcements/${announcementId}/collages`,
    {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        caption1: data.caption1 ?? null,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create collage (${response.status}): ${errorText}`,
    );
  }

  const result = (await response.json()) as {
    id: number;
  };

  return result.id;
}
