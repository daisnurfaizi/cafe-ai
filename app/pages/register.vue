<template>
  <div class="container">
    <div class="auth-page fade-in">
      <div class="auth-card card">
        <div class="card-header">DAFTAR AKUN BARU</div>

        <!-- ─── Error Alert ───────────────────────────── -->
        <div v-if="error" class="alert alert-error" style="margin-bottom: var(--space-lg)">
          {{ error }}
        </div>

        <!-- ─── Success: Show Key ─────────────────────── -->
        <div v-if="generatedKey" class="success-state">
          <div class="alert alert-success" style="margin-bottom: var(--space-lg)">
            Registrasi berhasil! Simpan API Key Anda:
          </div>

          <div class="key-display">
            <span>{{ showKey ? generatedKey : maskKey(generatedKey) }}</span>
          </div>

          <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md)">
            <button class="btn btn-sm" @click="copyKey">
              {{ copied ? '✓ Disalin' : 'Copy' }}
            </button>
            <button class="btn btn-sm" @click="showKey = !showKey">
              {{ showKey ? 'Sembunyikan' : 'Tampilkan' }}
            </button>
          </div>

          <p class="text-muted" style="margin-top: var(--space-lg); font-size: 0.8rem">
            Redirect ke dashboard dalam <span class="mono text-green">{{ countdown }}</span> detik...
          </p>
        </div>

        <!-- ─── Registration Form ─────────────────────── -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="fullName">Nama Lengkap</label>
            <input
              id="fullName"
              v-model="form.fullName"
              type="text"
              class="input"
              placeholder="Yourname"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              placeholder="user@example.com"
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
              placeholder="Minimal 8 karakter"
              required
              minlength="8"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Konfirmasi Password</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              class="input"
              placeholder="Ulangi password"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Mendaftar...' : 'Daftar' }}
          </button>
        </form>

        <p class="auth-footer text-muted">
          Sudah punya akun?
          <NuxtLink to="/login">Login</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Daftar — CAFE-AI',
});

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const loading = ref(false);
const error = ref('');
const generatedKey = ref('');
const showKey = ref(false);
const copied = ref(false);
const countdown = ref(5);

const maskKey = (key: string) => {
  if (key.length <= 10) return '•'.repeat(key.length);
  return key.slice(0, 6) + '•'.repeat(key.length - 10) + key.slice(-4);
};

const copyKey = async () => {
  await navigator.clipboard.writeText(generatedKey.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const handleRegister = async () => {
  error.value = '';

  if (form.password !== form.confirmPassword) {
    error.value = 'Password dan konfirmasi tidak cocok.';
    return;
  }

  if (form.password.length < 8) {
    error.value = 'Password minimal 8 karakter.';
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch<{ apiKey: string }>('/api/auth/register', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      },
    });

    generatedKey.value = response.apiKey;

    // Countdown redirect
    const interval = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(interval);
        navigateTo('/dashboard');
      }
    }, 1000);
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Terjadi kesalahan. Coba lagi.';
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

.success-state {
  animation: fadeIn 0.4s ease-out;
}
</style>
