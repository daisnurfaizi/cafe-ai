<template>
  <div class="container">
    <div class="landing">
      <!-- ─── Hero ──────────────────────────────────────── -->
      <section class="hero">
        <p class="hero-badge mono">
          <span class="badge badge-green">ACTIVE</span>
          &nbsp;AI Gateway v2.0
        </p>
        <h1 class="hero-title mono">CAFE-AI</h1>
        <p class="hero-subtitle">
          AI Gateway dengan Kuota <span class="mono text-green">1,000,000</span> Token per Akun.
          <br />Ditenagai oleh LiteLLM + 9Router untuk efisiensi biaya maksimal.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/register" class="btn btn-primary">Daftar Sekarang</NuxtLink>
          <NuxtLink to="/login" class="btn">Login</NuxtLink>
        </div>
      </section>

      <!-- ─── Features ──────────────────────────────────── -->
      <section class="features">
        <div class="feature-card card">
          <div class="feature-icon mono text-green">01</div>
          <h3 class="feature-title">1M Token</h3>
          <p class="feature-desc text-secondary">
            Setiap akun mendapat kuota 1 juta token. Manajemen budget otomatis via LiteLLM.
          </p>
        </div>

        <div class="feature-card card">
          <div class="feature-icon mono text-green">02</div>
          <h3 class="feature-title">Streaming SSE</h3>
          <p class="feature-desc text-secondary">
            Respons AI real-time via Server-Sent Events. Koneksi langsung ke gateway tanpa bottleneck.
          </p>
        </div>

        <div class="feature-card card">
          <div class="feature-icon mono text-green">03</div>
          <h3 class="feature-title">Type-Safe</h3>
          <p class="feature-desc text-secondary">
            End-to-end TypeScript. Dari Vue UI hingga Drizzle ORM schema, semuanya strongly-typed.
          </p>
        </div>
      </section>

      <!-- ─── Tech Stack ────────────────────────────────── -->
      <section class="stack-section">
        <p class="card-header">TECH STACK</p>
        <div class="stack-grid mono">
          <span>Nuxt 4</span>
          <span>Bun</span>
          <span>Drizzle ORM</span>
          <span>MySQL</span>
          <span>LiteLLM</span>
          <span>9Router</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'CAFE-AI — AI Gateway & Token Manager',
  meta: [
    { name: 'description', content: 'AI API Gateway dengan kuota 1 juta token per akun. Dibangun dengan Nuxt 4, Bun, dan Drizzle ORM.' },
  ],
});
</script>

<style scoped>
.landing {
  padding: var(--space-3xl) 0;
}

.hero {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.hero-badge {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  margin-bottom: var(--space-lg);
  color: var(--text-primary);
}

.hero-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  max-width: 520px;
  margin: 0 auto var(--space-xl);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-3xl);
}

.feature-card {
  padding: var(--space-xl);
}

.feature-icon {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--space-md);
}

.feature-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.feature-desc {
  font-size: 0.85rem;
  line-height: 1.6;
}

.stack-section {
  text-align: center;
}

.stack-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-md);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stack-grid span {
  padding: var(--space-xs) var(--space-md);
  border: var(--border);
  border-radius: var(--radius);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.2rem;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
