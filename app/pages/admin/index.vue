<template>
  <div class="admin-wrapper">
    <!-- ─── SIDEBAR ───────────────────────────────────── -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h2 class="mono" style="color: var(--accent-green); margin: 0; font-size: 1.2rem;">ADMIN PANEL</h2>
      </div>
      <nav class="sidebar-nav">
        <button 
          class="nav-item" 
          :class="{ active: activeTab === 'users' }" 
          @click="activeTab = 'users'"
        >
          👥 User Management
        </button>
        <button 
          class="nav-item" 
          :class="{ active: activeTab === 'models' }" 
          @click="activeTab = 'models'"
        >
          🤖 Model Management
        </button>
        <button 
          class="nav-item" 
          :class="{ active: activeTab === 'settings' }" 
          @click="activeTab = 'settings'"
        >
          ⚙️ System Settings
        </button>
      </nav>
      <div class="sidebar-footer">
        <NuxtLink to="/dashboard" class="btn btn-outline btn-sm" style="width: 100%; justify-content: center;">
          ← Back to Dashboard
        </NuxtLink>
      </div>
    </aside>

    <!-- ─── MAIN CONTENT ──────────────────────────────── -->
    <main class="admin-main fade-in">
      
      <!-- ================= USERS TAB ================= -->
      <section v-if="activeTab === 'users'" class="admin-section">
        <div class="section-header">
          <h1 class="section-title">User Management</h1>
          <p class="text-muted text-sm">Kelola kuota token dan akses model untuk setiap pengguna.</p>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Max Tokens</th>
                  <th>Used Tokens</th>
                  <th>Allowed Models</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="pendingUsers">
                  <td colspan="6" class="text-center text-muted"><span class="spinner"></span> Loading...</td>
                </tr>
                <tr v-for="user in users" :key="user.id">
                  <td>
                    <div class="font-bold">{{ user.fullName }}</div>
                    <div class="text-muted text-sm">{{ user.email }}</div>
                  </td>
                  <td>
                    <span class="badge" :class="user.role === 'admin' ? 'badge-primary' : 'badge-green'">
                      {{ user.role }}
                    </span>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      v-model="editState[user.id].maxTokens" 
                      class="input input-sm" 
                      style="width: 100px"
                    />
                  </td>
                  <td class="mono">
                    {{ user.keys[0]?.usedTokens.toLocaleString() || 0 }}
                  </td>
                  <td>
                    <div class="checkbox-group">
                      <label v-for="model in availableModels" :key="model.name" class="checkbox-label">
                        <input 
                          type="checkbox" 
                          :value="model.name" 
                          v-model="editState[user.id].models"
                        />
                        {{ model.name }}
                      </label>
                    </div>
                  </td>
                  <td>
                    <button class="btn btn-primary btn-sm" @click="saveUser(user.id)" :disabled="isSavingUser === user.id">
                      {{ isSavingUser === user.id ? 'Saving...' : 'Save' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= MODELS TAB ================= -->
      <section v-if="activeTab === 'models'" class="admin-section">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 class="section-title">Model Management</h1>
            <p class="text-muted text-sm">Konfigurasi Gateway LiteLLM dan harga per token.</p>
          </div>
          <button class="btn btn-primary btn-sm" @click="addModel">+ Add New Model</button>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Model Name</th>
                  <th>Provider Model</th>
                  <th>API Base</th>
                  <th>API Key</th>
                  <th>Input Cost (USD)</th>
                  <th>Output Cost (USD)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="pendingModels">
                  <td colspan="7" class="text-center text-muted"><span class="spinner"></span> Loading...</td>
                </tr>
                <tr v-for="(model, index) in modelsEdit" :key="index">
                  <td><input type="text" v-model="model.name" class="input input-sm" placeholder="e.g. sumopod" /></td>
                  <td><input type="text" v-model="model.model" class="input input-sm" placeholder="openai/gpt-4" /></td>
                  <td><input type="text" v-model="model.api_base" class="input input-sm" placeholder="https://..." /></td>
                  <td><input type="password" v-model="model.api_key" class="input input-sm" placeholder="sk-..." /></td>
                  <td><input type="number" step="0.000001" v-model="model.input_cost_per_token" class="input input-sm" style="width: 80px;" /></td>
                  <td><input type="number" step="0.000001" v-model="model.output_cost_per_token" class="input input-sm" style="width: 80px;" /></td>
                  <td>
                    <button class="btn btn-outline btn-sm" @click="removeModel(index)" style="color: var(--accent-red); border-color: var(--accent-red)">
                      Remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: var(--space-xl); display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--bg-tertiary); padding-top: var(--space-md);">
            <button class="btn btn-outline" @click="fetchModels">Discard Changes</button>
            <button class="btn btn-primary" @click="saveModels" :disabled="isSavingModels">
              {{ isSavingModels ? 'Deploying Config & Restarting...' : 'Save & Restart LiteLLM' }}
            </button>
          </div>
        </div>
      </section>

      <!-- ================= SETTINGS TAB ================= -->
      <section v-if="activeTab === 'settings'" class="admin-section">
        <div class="section-header">
          <h1 class="section-title">System Settings</h1>
          <p class="text-muted text-sm">Konfigurasi batasan dan pengaturan global sistem.</p>
        </div>

        <div class="card" style="max-width: 500px;">
          <div style="margin-bottom: var(--space-lg);">
            <label class="font-bold" style="display: block; margin-bottom: 8px;">Batas Maksimal Pengguna Pendaftar</label>
            <p class="text-muted text-sm" style="margin-bottom: 12px;">Berapa jumlah user maksimum yang bisa melakukan registrasi ke dalam aplikasi. Jika dikosongkan/dihapus, pendaftaran tidak dibatasi.</p>
            <input 
              type="number" 
              v-model="systemSettings.MAX_USERS" 
              class="input" 
              placeholder="Contoh: 100"
            />
          </div>
          
          <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--bg-tertiary); padding-top: var(--space-md);">
            <button class="btn btn-primary" @click="saveSettings" :disabled="isSavingSettings">
              {{ isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan' }}
            </button>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Admin Panel — CAFE-AI' });
definePageMeta({ 
  middleware: 'auth',
  layout: false // Completely disable default layout to differentiate from user UI
});

const activeTab = ref('users');
const users = ref<any[]>([]);
const availableModels = ref<any[]>([]);
const modelsEdit = ref<any[]>([]);
const systemSettings = ref<Record<string, string>>({ MAX_USERS: '' });

const pendingUsers = ref(true);
const pendingModels = ref(true);
const isSavingModels = ref(false);
const isSavingSettings = ref(false);
const isSavingUser = ref<string | null>(null);

const editState = ref<Record<string, { maxTokens: number, models: string[] }>>({});

onMounted(async () => {
  await Promise.all([fetchModels(), fetchUsers(), fetchSettings()]);
});

const fetchSettings = async () => {
  try {
    const data = await $fetch<any>('/api/admin/settings', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) as any : undefined
    });
    if (data.settings) {
      systemSettings.value = { ...systemSettings.value, ...data.settings };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
};

const saveSettings = async () => {
  isSavingSettings.value = true;
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { settings: systemSettings.value }
    });
    alert('System settings updated successfully.');
  } catch (err: any) {
    alert('Failed to update settings: ' + err.message);
  } finally {
    isSavingSettings.value = false;
  }
};

const fetchModels = async () => {
  pendingModels.value = true;
  try {
    const data = await $fetch('/api/admin/models', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) as any : undefined
    });
    availableModels.value = JSON.parse(JSON.stringify(data));
    modelsEdit.value = JSON.parse(JSON.stringify(data));
  } catch (err) {
    alert('Failed to load models. Are you an admin?');
    navigateTo('/dashboard');
  } finally {
    pendingModels.value = false;
  }
};

const fetchUsers = async () => {
  pendingUsers.value = true;
  try {
    const data = await $fetch<any[]>('/api/admin/users', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) as any : undefined
    });
    users.value = data;
    
    // Initialize edit state
    data.forEach(u => {
      const key = u.keys[0];
      if (key) {
        editState.value[u.id] = {
          maxTokens: key.maxTokens,
          models: key.allowedModels,
        };
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    pendingUsers.value = false;
  }
};

const saveUser = async (userId: string) => {
  const state = editState.value[userId];
  if (!state) return;

  isSavingUser.value = userId;
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: {
        maxTokens: state.maxTokens,
        models: state.models
      }
    });
    alert('User updated successfully');
  } catch (err: any) {
    alert('Failed to update user: ' + err.message);
  } finally {
    isSavingUser.value = null;
  }
};

const addModel = () => {
  modelsEdit.value.push({
    name: 'new-model',
    model: 'openai/new-model',
    api_base: '',
    api_key: '',
    input_cost_per_token: 0,
    output_cost_per_token: 0
  });
};

const removeModel = (index: number) => {
  modelsEdit.value.splice(index, 1);
};

const saveModels = async () => {
  isSavingModels.value = true;
  try {
    await $fetch('/api/admin/models', {
      method: 'PUT',
      body: { models: modelsEdit.value }
    });
    alert('Models updated and LiteLLM restarted successfully.');
    await fetchModels();
  } catch (err: any) {
    alert('Failed to update models: ' + err.message);
  } finally {
    isSavingModels.value = false;
  }
};
</script>

<style scoped>
/* Admin Reset & Layout */
.admin-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-primary, #000);
  color: var(--text-primary, #eee);
  font-family: var(--font-sans, system-ui, sans-serif);
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background-color: var(--bg-secondary, #111);
  border-right: 1px solid var(--bg-tertiary, #222);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.sidebar-header {
  margin-bottom: 40px;
  padding: 0 10px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted, #888);
  padding: 12px 16px;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: left;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-primary, #fff);
}

.nav-item.active {
  background-color: rgba(0, 255, 128, 0.1);
  color: var(--accent-green, #00ff80);
}

.sidebar-footer {
  padding-top: 20px;
  border-top: 1px solid var(--bg-tertiary, #222);
}

/* Main Content */
.admin-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background-color: var(--bg-primary, #000);
}

.section-header {
  margin-bottom: 30px;
}
.section-title {
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* UI Elements inside admin */
.card {
  background: var(--bg-secondary, #111);
  border: 1px solid var(--bg-tertiary, #222);
  border-radius: 12px;
  padding: 24px;
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
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid var(--bg-tertiary, #222);
  font-size: 0.9rem;
}

.table th {
  color: var(--text-muted, #888);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.input {
  background: var(--bg-primary, #000);
  border: 1px solid var(--bg-tertiary, #222);
  color: var(--text-primary, #fff);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: inherit;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--accent-green, #00ff80);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
</style>
