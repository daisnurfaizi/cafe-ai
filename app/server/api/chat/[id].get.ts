import { eq, and } from 'drizzle-orm';
import { chats } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: env.SESSION_SECRET });
  if (!session.data?.userId) throw createError({ statusCode: 401 });

  const chatId = getRouterParam(event, 'id');
  if (!chatId) throw createError({ statusCode: 400, statusMessage: 'Missing ID' });

  const chat = await db.query.chats.findFirst({
    where: and(
      eq(chats.id, chatId),
      eq(chats.userId, session.data.userId as string)
    ),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!chat) throw createError({ statusCode: 404, statusMessage: 'Chat not found' });

  return chat;
});
