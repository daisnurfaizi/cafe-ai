<template>
  <div class="app-layout">
    <!-- ─── Navbar ──────────────────────────────────────── -->
    <header class="navbar">
      <div class="container navbar-inner">
        <NuxtLink to="/" class="navbar-brand mono">
          <span class="brand-symbol">▲</span> CAFE-AI
        </NuxtLink>

        <nav class="navbar-nav" v-if="isLoggedIn">
          <NuxtLink to="/dashboard" class="nav-link">Dashboard</NuxtLink>
          <NuxtLink to="/chat" class="nav-link">Chat AI</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin" class="nav-link" style="color: var(--accent-green); font-weight: 600;">Panel Admin</NuxtLink>
          <button class="btn btn-sm" @click="handleLogout">Logout</button>
        </nav>

        <nav class="navbar-nav" v-else>
          <NuxtLink to="/login" class="nav-link">Login</NuxtLink>
          <NuxtLink to="/register" class="btn btn-sm btn-primary">Daftar</NuxtLink>
        </nav>
      </div>
    </header>

    <!-- ─── Main Content ────────────────────────────────── -->
    <main class="main-content">
      <slot />
    </main>

    <!-- ─── Footer ──────────────────────────────────────── -->
    <footer class="footer">
      <div class="container footer-inner">
        <span class="mono text-muted">daisailabs © 2026</span>
        <span class="text-muted">v2.0.0</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isLoggedIn = ref(false);
const isAdmin = ref(false);

const checkAuth = async () => {
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) as any : undefined;
    const data = await $fetch<{ user: { role: string } }>('/api/user/me', { headers });
    isLoggedIn.value = true;
    isAdmin.value = data.user.role === 'admin';
  } catch {
    isLoggedIn.value = false;
    isAdmin.value = false;
  }
};

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
    isLoggedIn.value = false;
    isAdmin.value = false;
    navigateTo('/login');
  } catch {
    // ignore
  }
};

onMounted(checkAuth);

// Re-check auth on navigation
const route = useRoute();
watch(() => route.fullPath, checkAuth);
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  border-bottom: var(--border);
  background: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
}

.navbar-brand {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.navbar-brand:hover {
  color: var(--text-primary);
}

.brand-symbol {
  color: var(--accent-green);
  font-size: 1rem;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.nav-link {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 0.15s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  padding: var(--space-2xl) 0;
}

.footer {
  border-top: var(--border);
  padding: var(--space-lg) 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.7rem;
}
</style>
