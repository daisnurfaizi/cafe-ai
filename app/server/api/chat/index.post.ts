import { chats } from '~~/server/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: env.SESSION_SECRET });
  if (!session.data?.userId) throw createError({ statusCode: 401 });

  const body = await readBody(event);
  const title = body?.title || 'New Chat';

  const chatId = crypto.randomUUID();
  await db
    .insert(chats)
    .values({
      id: chatId,
      userId: session.data.userId as string,
      title,
    });

  // Fetch the inserted chat
  const [newChat] = await db.select().from(chats).where(eq(chats.id, chatId));

  return newChat;
});
