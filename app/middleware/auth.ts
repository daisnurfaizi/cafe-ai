/**
 * Client-side auth middleware.
 * Protects /dashboard and /chat from unauthenticated access.
 * Redirects logged-in users away from /login and /register.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const protectedRoutes = ['/dashboard', '/chat'];
  const authRoutes = ['/login', '/register'];

  // Check if user is authenticated
  let isAuthenticated = false;
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) as any : undefined;
    await $fetch('/api/user/me', { headers });
    isAuthenticated = true;
  } catch {
    isAuthenticated = false;
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.includes(to.path) && !isAuthenticated) {
    return navigateTo('/login');
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.includes(to.path) && isAuthenticated) {
    return navigateTo('/dashboard');
  }
});
