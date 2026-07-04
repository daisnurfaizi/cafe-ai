import { eq } from 'drizzle-orm';
import { users } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/api/admin')) {
    const session = await useSession(event, { password: env.SESSION_SECRET });
    if (!session.data?.userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.data.userId as string),
    });

    if (user?.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin only' });
    }
  }
});
