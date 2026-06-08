export async function createCollage(
  db: any,
  data: {
    announcementId: number;
    mediaUrl: string;
    caption1?: string;
    mediaType: number;
    telegramMessageId: number;
  },
): Promise<void> {
  await db.query(
    `
    INSERT INTO collages (
      announcement_id,
      media_url,
      caption1,
      sort_order,
      media_type,
      created_at_utc,
      updated_at_utc
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `,
    [
      data.announcementId,
      data.mediaUrl,
      data.caption1 ?? null,
      data.telegramMessageId,
      data.mediaType,
    ],
  );
}
