export async function createAnnouncement(db: any, data: {
  title: string;
  country: number;
  creatorId: string;
}) {
  const result = await db.prepare(`
    INSERT INTO announcements (title, country, creator_id, created_at_utc, updated_at_utc)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
    RETURNING id
  `).bind(
    data.title,
    data.country,
    data.creatorId
  ).first();

  return result?.id;
}