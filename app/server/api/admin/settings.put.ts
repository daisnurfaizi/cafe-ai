import { eq } from 'drizzle-orm';
import { settings } from '~~/server/database/schema';
import db from '~~/server/database/db';
import { env } from '~~/server/utils/env';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });

  if (!session.data?.userId || session.data.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak. Hanya admin yang diizinkan.',
    });
  }

  const body = await readBody(event);
  const updates = body.settings; // expects { MAX_USERS: "10" }

  if (!updates || typeof updates !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format data tidak valid.',
    });
  }

  for (const [key, value] of Object.entries(updates)) {
    const stringValue = String(value);

    // Check if setting exists
    const existing = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (existing) {
      await db.update(settings)
        .set({ value: stringValue, updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        key,
        value: stringValue,
      });
    }
  }

  return { success: true, message: 'Settings updated successfully' };
});
