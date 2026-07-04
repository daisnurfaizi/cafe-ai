import { eq, desc } from 'drizzle-orm';
import { chats } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: env.SESSION_SECRET });
  if (!session.data?.userId) throw createError({ statusCode: 401 });

  const userChats = await db.query.chats.findMany({
    where: eq(chats.userId, session.data.userId as string),
    orderBy: [desc(chats.updatedAt)],
  });

  return userChats;
});
