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

  const allSettings = await db.query.settings.findMany();
  
  // Convert to object mapping
  const settingsMap: Record<string, string> = {};
  allSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return { settings: settingsMap };
});
