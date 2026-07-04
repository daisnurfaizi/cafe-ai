/**
 * Server middleware: protects /api/user/* routes.
 * Routes under /api/auth/* are public (login, register, logout).
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  // Only protect /api/user/* routes
  if (!pathname.startsWith('/api/user')) {
    return; // Pass through
  }

  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });

  if (!session.data?.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Silakan login terlebih dahulu.',
    });
  }

  // Attach userId to event context for downstream handlers
  event.context.userId = session.data.userId;
});
