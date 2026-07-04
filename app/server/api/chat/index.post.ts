import { chats } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: env.SESSION_SECRET });
  if (!session.data?.userId) throw createError({ statusCode: 401 });

  const body = await readBody(event);
  const title = body?.title || 'New Chat';

  const [newChat] = await db
    .insert(chats)
    .values({
      userId: session.data.userId as string,
      title,
    })
    .returning();

  return newChat;
});
