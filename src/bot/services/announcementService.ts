export async function createAnnouncement(
  db: any,
  data: {
    title: string;
    country: number;
    creatorId: string;
  },
): Promise<number> {
  const result = await db.query(
    `
    INSERT INTO announcements (title, country, creator_id, created_at_utc, updated_at_utc)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id
    `,
    [data.title, data.country, data.creatorId],
  );

  return result.rows[0]?.id;
}
