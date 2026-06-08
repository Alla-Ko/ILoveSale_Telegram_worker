export async function createCollage(
  db: any,
  data: {
    announcementId: number;
    mediaUrl: string;
    caption1?: string;
    mediaType: number;
    telegramMessageId: number;
  },
) {
  await db
    .prepare(
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
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .bind(
      data.announcementId,
      data.mediaUrl,
      data.caption1 ?? null,
      data.telegramMessageId, // 👈 HERE
      data.mediaType,
    )
    .run();
}
