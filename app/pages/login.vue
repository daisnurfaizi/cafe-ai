<template>
  <div class="container">
    <div class="auth-page fade-in">
      <div class="auth-card card">
        <div class="card-header">LOGIN</div>

        <div v-if="error" class="alert alert-error" style="margin-bottom: var(--space-lg)">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              placeholder="user@tempo.co"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              placeholder="Password"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Masuk...' : 'Login' }}
          </button>
        </form>

        <p class="auth-footer text-muted">
          Belum punya akun?
          <NuxtLink to="/register">Daftar</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Login — CAFE-AI',
});

const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password,
      },
    });

    navigateTo('/dashboard');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Kredensial tidak valid.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: var(--space-2xl) 0;
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.auth-footer {
  margin-top: var(--space-xl);
  font-size: 0.8rem;
  text-align: center;
}
</style>
