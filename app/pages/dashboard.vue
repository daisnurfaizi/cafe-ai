<template>
  <div class="container">
    <div class="dashboard fade-in">
      <div class="dashboard-header">
        <h1 class="page-title mono">DASHBOARD</h1>
        <div class="user-greeting" v-if="data?.user">
          Halo, <span class="text-green">{{ data.user.fullName }}</span>
        </div>
      </div>

      <!-- ─── Loading State ─────────────────────────────── -->
      <div v-if="pending && !data" class="loading-state">
        <div class="spinner"></div>
        <span class="text-muted">Memuat data...</span>
      </div>

      <!-- ─── Error State ───────────────────────────────── -->
      <div v-else-if="fetchError && !data" class="alert alert-error">
        Gagal memuat data: {{ fetchError.statusMessage || 'Unknown error' }}
      </div>

      <template v-else-if="data">
        <!-- ─── Tab Navigation ──────────────────────────── -->
        <div class="tab-nav">
          <button class="tab-btn" :class="{ active: activeTab === 'quick-start' }" @click="setTab('quick-start')">Quick Start</button>
          <button class="tab-btn" :class="{ active: activeTab === 'chat' }" @click="setTab('chat')">Chat</button>
          <button class="tab-btn" :class="{ active: activeTab === 'usage' }" @click="setTab('usage')">Usage</button>
          <button class="tab-btn" :class="{ active: activeTab === 'models' }" @click="setTab('models')">Models</button>
          <button class="tab-btn" :class="{ active: activeTab === 'api-key' }" @click="setTab('api-key')">API Key</button>
        </div>

        <div class="tab-content">
          <!-- ================= TAB 1: QUICK START ================= -->
          <div v-if="activeTab === 'quick-start'" class="fade-in">
            <div class="card">
              <div class="card-header" style="margin-bottom: var(--space-md);">PANDUAN API (QUICK START)</div>
              <p class="text-muted" style="font-size: 0.85rem; margin-bottom: var(--space-md);">
                Gunakan API Key Anda untuk mengakses AI Gateway langsung dari kode Anda. Gateway kami bersifat 100% kompatibel dengan SDK OpenAI.
              </p>
              
              <div style="margin-bottom: var(--space-sm);">
                <span class="info-label text-muted">Base URL</span>
                <div class="mono bg-tertiary" style="padding: 8px; border-radius: 4px; font-size: 0.8rem; margin-top: 4px;">
                  {{ config.public.litellmUrl }}/v1
                </div>
              </div>

              <div style="margin-top: var(--space-lg);">
                <span class="info-label text-muted">cURL Example</span>
                <pre class="code-snippet"><code>curl {{ config.public.litellmUrl }}/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{ data.apiKeys[0]?.key || 'API_KEY_ANDA' }}" \
  -d '{
    "model": "sumopod",
    "messages": [
      {
        "role": "user",
        "content": "Halo, siapa Anda?"
      }
    ]
  }'</code></pre>
              </div>

              <div style="margin-top: var(--space-md);">
                <span class="info-label text-muted">Python (OpenAI SDK)</span>
                <pre class="code-snippet"><code>from openai import OpenAI

client = OpenAI(
    api_key="{{ data.apiKeys[0]?.key || 'API_KEY_ANDA' }}",
    base_url="{{ config.public.litellmUrl }}/v1"
)

response = client.chat.completions.create(
    model="sumopod",
    messages=[{"role": "user", "content": "Halo, siapa Anda?"}]
)
print(response.choices[0].message.content)</code></pre>
              </div>

              <div style="margin-top: var(--space-md);">
                <span class="info-label text-muted">Node.js (OpenAI SDK)</span>
                <pre class="code-snippet"><code>import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '{{ data.apiKeys[0]?.key || 'API_KEY_ANDA' }}',
  baseURL: '{{ config.public.litellmUrl }}/v1',
});

const chatCompletion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Halo, siapa Anda?' }],
  model: 'sumopod',
});
console.log(chatCompletion.choices[0].message.content);</code></pre>
              </div>
            </div>
          </div>

          <!-- ================= TAB 2: CHAT ================= -->
          <div v-if="activeTab === 'chat'" class="fade-in">
            <div class="card" style="text-align: center; padding: 40px 20px;">
              <h2 style="margin-bottom: var(--space-sm);">Mulai Percakapan AI</h2>
              <p class="text-muted" style="margin-bottom: var(--space-xl); max-width: 400px; margin-inline: auto;">
                Cobalah model yang telah disediakan langsung melalui antarmuka Web Chat kami yang mudah digunakan.
              </p>
              <NuxtLink to="/chat" class="btn btn-primary" style="padding: 12px 30px; font-size: 1.1rem;">
                Buka Web Chat 💬
              </NuxtLink>
            </div>
          </div>

          <!-- ================= TAB 3: USAGE ================= -->
          <div v-if="activeTab === 'usage'" class="fade-in">
            <!-- Identity Info -->
            <div class="card" style="margin-bottom: var(--space-lg)">
              <div class="card-header">PROFIL PENGGUNA</div>
              <div class="info-row">
                <span class="info-label text-muted">Nama</span>
                <span>{{ data.user.fullName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label text-muted">Email</span>
                <span class="mono" style="font-size: 0.85rem">{{ data.user.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label text-muted">Bergabung Sejak</span>
                <span class="mono">{{ formatDate(data.user.createdAt) }}</span>
              </div>
            </div>

            <!-- Token Usage -->
            <div class="card" v-for="key in data.apiKeys" :key="key.id" style="margin-bottom: var(--space-lg)">
              <div class="card-header">
                PENGGUNAAN TOKEN
                <span
                  class="badge"
                  :class="key.isActive ? 'badge-green' : 'badge-red'"
                >
                  {{ key.isActive ? '● ACTIVE' : '● INACTIVE' }}
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="token-meter">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{
                      width: usagePercent(key) + '%',
                      background: progressColor(key),
                    }"
                  ></div>
                </div>

                <div class="token-stats">
                  <div class="token-stat">
                    <span class="token-stat-label text-muted">Terpakai</span>
                    <span class="token-stat-value mono">{{ formatNumber(key.usedTokens) }}</span>
                  </div>
                  <div class="token-stat">
                    <span class="token-stat-label text-muted">Sisa Kuota</span>
                    <span class="token-stat-value mono text-green">{{ formatNumber(key.remainingTokens) }}</span>
                  </div>
                  <div class="token-stat">
                    <span class="token-stat-label text-muted">Total Max</span>
                    <span class="token-stat-value mono">{{ formatNumber(key.maxTokens) }}</span>
                  </div>
                </div>

                <div class="token-percent mono" style="margin-top: 15px; text-align: center;">
                  {{ usagePercent(key).toFixed(1) }}% dari kuota telah digunakan
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 4: MODELS ================= -->
          <div v-if="activeTab === 'models'" class="fade-in">
            <div class="card">
              <div class="card-header" style="margin-bottom: var(--space-md);">DAFTAR MODEL & HARGA</div>
              <p class="text-muted" style="font-size: 0.85rem; margin-bottom: var(--space-lg);">
                Berikut adalah katalog model AI yang tersedia di ekosistem kami beserta biaya pemakaian per tokennya. (Nilai dalam USD)
              </p>
              
              <div v-if="pendingModels" class="text-center text-muted" style="padding: 20px;">
                <span class="spinner"></span> Memuat model...
              </div>
              <div v-else class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Model Name</th>
                      <th>Input Cost / Token</th>
                      <th>Output Cost / Token</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="model in availableModels" :key="model.name">
                      <td><span class="badge badge-green mono">{{ model.name }}</span></td>
                      <td class="mono">${{ model.input_cost_per_token }}</td>
                      <td class="mono">${{ model.output_cost_per_token }}</td>
                      <td>
                        <span class="badge badge-green">{{ model.status }}</span>
                      </td>
                    </tr>
                    <tr v-if="availableModels.length === 0">
                      <td colspan="4" class="text-center text-muted">Belum ada model tersedia.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ================= TAB 5: API KEY ================= -->
          <div v-if="activeTab === 'api-key'" class="fade-in">
            <div class="card" v-for="key in data.apiKeys" :key="key.id">
              <div class="card-header" style="margin-bottom: var(--space-sm)">KREDENSIAL API</div>
              <p class="text-muted" style="font-size: 0.85rem; margin-bottom: var(--space-md);">
                Gunakan API Key ini untuk autentikasi aplikasi eksternal Anda. JANGAN berikan API Key ini kepada siapa pun!
              </p>
              
              <div class="key-display" style="padding: 15px; font-size: 1.1rem; background: var(--bg-primary); border-radius: 6px; border: 1px dashed var(--accent-green); margin-bottom: var(--space-md);">
                <span class="mono">{{ showKey ? key.key : maskKey(key.key) }}</span>
              </div>
              <div style="display: flex; gap: var(--space-sm);">
                <button class="btn btn-outline" @click="copyKey(key.key)">
                  {{ copiedKey === key.key ? '✓ Berhasil Disalin' : '📋 Salin Key' }}
                </button>
                <button class="btn btn-outline" @click="showKey = !showKey">
                  {{ showKey ? '👁 Sembunyikan' : '👁 Tampilkan' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Dashboard — CAFE-AI',
});

definePageMeta({
  middleware: 'auth',
});

interface ApiKeyData {
  id: string;
  key: string;
  maxTokens: number;
  usedTokens: number;
  remainingTokens: number;
  isActive: boolean;
  createdAt: string;
}

interface UserData {
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
  };
  apiKeys: ApiKeyData[];
}

interface ModelData {
  name: string;
  input_cost_per_token: number;
  output_cost_per_token: number;
  status: string;
}

const validTabs = ['quick-start', 'chat', 'usage', 'models', 'api-key'];
const router = useRouter();

const activeTab = ref('quick-start');

const setTab = (tab: string) => {
  activeTab.value = tab;
  router.replace({ hash: `#${tab}` });
};
const config = useRuntimeConfig();
const showKey = ref(false);
const copiedKey = ref('');

// Fetch user data with auto-refresh
const headers = import.meta.server ? useRequestHeaders(['cookie']) as any : undefined;
const { data, pending, error: fetchError, refresh } = await useFetch<UserData>('/api/user/me', { headers });

// Fetch models for Tab 4
const availableModels = ref<ModelData[]>([]);
const pendingModels = ref(false);

const fetchModelsData = async () => {
  pendingModels.value = true;
  try {
    availableModels.value = await $fetch<ModelData[]>('/api/models');
  } catch (err) {
    console.error('Failed to fetch models:', err);
  } finally {
    pendingModels.value = false;
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'models' && availableModels.value.length === 0) {
    fetchModelsData();
  }
});

// Auto-refresh every 30 seconds + baca hash dari URL saat mount (client-side)
let refreshInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  // Baca hash dari browser (hanya tersedia di client, tidak di SSR)
  const hash = window.location.hash.replace('#', '');
  if (hash && validTabs.includes(hash)) {
    activeTab.value = hash;
  }
  refreshInterval = setInterval(() => refresh(), 30_000);
});
onUnmounted(() => {
  clearInterval(refreshInterval);
});

const formatNumber = (n: number) => n.toLocaleString('id-ID');

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const usagePercent = (key: ApiKeyData) => {
  return (key.usedTokens / key.maxTokens) * 100;
};

const progressColor = (key: ApiKeyData) => {
  const pct = 100 - usagePercent(key); // remaining percentage
  if (pct > 50) return 'var(--accent-green)';
  if (pct > 20) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
};

const maskKey = (key: string) => {
  if (key.length <= 10) return '•'.repeat(key.length);
  return key.slice(0, 6) + '•'.repeat(key.length - 10) + key.slice(-4);
};

const copyKey = async (key: string) => {
  await navigator.clipboard.writeText(key);
  copiedKey.value = key;
  setTimeout(() => (copiedKey.value = ''), 2000);
};
</script>

<style scoped>
.dashboard {
  padding: var(--space-lg) 0;
  max-width: 900px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0;
}

.user-greeting {
  font-size: 0.95rem;
  font-weight: 600;
}

.tab-nav {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--bg-tertiary);
  margin-bottom: var(--space-lg);
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-green);
  border-bottom-color: var(--accent-green);
}

.tab-content {
  min-height: 400px;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--bg-tertiary);
  font-size: 0.9rem;
}

.info-row:last-of-type {
  border-bottom: none;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.token-meter {
  margin-top: var(--space-md);
}

.token-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.token-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}

.token-stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.token-stat-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--bg-tertiary);
  font-size: 0.85rem;
}
.table th {
  font-weight: 600;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .token-stats {
    grid-template-columns: 1fr;
  }
}

.code-snippet {
  background: var(--bg-tertiary);
  padding: var(--space-md);
  border-radius: 6px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.5;
  margin-top: 4px;
  color: var(--text-primary);
  border: 1px solid #333;
}
</style>
