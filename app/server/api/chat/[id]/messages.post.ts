import { eq, and } from 'drizzle-orm';
import { chats, messages } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: env.SESSION_SECRET });
  if (!session.data?.userId) throw createError({ statusCode: 401 });

  const chatId = getRouterParam(event, 'id');
  if (!chatId) throw createError({ statusCode: 400 });

  // Verify ownership
  const chat = await db.query.chats.findFirst({
    where: and(
      eq(chats.id, chatId),
      eq(chats.userId, session.data.userId as string)
    ),
  });

  if (!chat) throw createError({ statusCode: 404, statusMessage: 'Chat not found' });

  const body = await readBody(event);
  const role = body?.role;
  const content = body?.content;

  if (!role || !content) throw createError({ statusCode: 400, statusMessage: 'Missing role or content' });

  const messageId = crypto.randomUUID();
  await db
    .insert(messages)
    .values({
      id: messageId,
      chatId,
      role,
      content,
    });

  // Fetch the inserted message
  const [newMessage] = await db.select().from(messages).where(eq(messages.id, messageId));

  // Update chat updatedAt
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));

  return newMessage;
});
