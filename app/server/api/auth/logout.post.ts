/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });

  await session.clear();

  return { success: true, message: 'Berhasil logout.' };
});
