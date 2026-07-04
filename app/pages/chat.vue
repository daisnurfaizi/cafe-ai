<template>
  <div class="container-fluid chat-layout">
    <!-- ─── Sidebar Riwayat Chat ──────────────────── -->
    <aside class="chat-sidebar border-right">
      <div class="sidebar-header">
        <button class="btn btn-block btn-primary" @click="startNewChat">
          + Chat Baru
        </button>
      </div>
      <div class="chat-list">
        <div v-if="pendingChats" class="text-muted" style="padding: var(--space-md); text-align: center;">
          <span class="spinner"></span>
        </div>
        <div v-else-if="chats.length === 0" class="text-muted" style="padding: var(--space-md); text-align: center; font-size: 0.85rem;">
          Belum ada riwayat chat.
        </div>
        <button
          v-for="chat in chats"
          :key="chat.id"
          class="chat-item"
          :class="{ active: chat.id === activeChatId }"
          @click="loadChat(chat.id)"
        >
          <div class="chat-item-title">{{ chat.title }}</div>
          <div class="chat-item-date mono">{{ formatDate(chat.createdAt) }}</div>
        </button>
      </div>
    </aside>

    <!-- ─── Area Obrolan Utama ────────────────────── -->
    <main class="chat-main fade-in">
      <div class="chat-header border-bottom" style="display: flex; justify-content: space-between; width: 100%;">
        <h1 class="page-title mono">{{ activeChatTitle }}</h1>
        <div class="model-selector" v-if="allowedModels.length > 0">
          <select v-model="selectedModel" class="input input-sm mono" :disabled="isStreaming || pendingMessages">
            <option v-for="m in allowedModels" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>

      <!-- ─── Quota Exhausted Banner ──────────────────── -->
      <div v-if="quotaExhausted" class="alert alert-error" style="margin: var(--space-lg)">
        ⚠ Kuota token Anda telah habis ({{ userMaxTokens.toLocaleString('id-ID') }} token). Hubungi admin untuk perpanjangan.
      </div>

      <!-- ─── Chat Messages ──────────────────────────── -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state text-muted">
          <p class="mono">Mulai percakapan dengan AI.</p>
          <p style="font-size: 0.8rem">Model terpilih: <span class="badge badge-green">{{ selectedModel }}</span></p>
        </div>

        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="chat-bubble"
          :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'"
        >
          <div class="bubble-role mono text-muted">
            {{ msg.role === 'user' ? 'YOU' : 'AI' }}
          </div>
          <div class="bubble-content" :class="{ mono: msg.role === 'assistant', 'text-error': msg.isError }">
            {{ msg.content }}
            <span v-if="msg.role === 'assistant' && isStreaming && i === messages.length - 1" class="cursor pulse">▊</span>
            <div v-if="msg.isError" style="margin-top: 10px;">
              <button class="btn btn-sm btn-outline" style="border-color: var(--accent-red); color: var(--accent-red);" @click="retryMessage(i)">
                ⟳ Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Input Area ─────────────────────────────── -->
      <form class="chat-input-area" @submit.prevent="sendMessage">
        <textarea
          v-model="prompt"
          class="input chat-textarea"
          placeholder="Ketik prompt Anda..."
          rows="3"
          :disabled="isStreaming || quotaExhausted || pendingMessages"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button
          v-if="!isStreaming"
          type="submit"
          class="btn btn-primary"
          :disabled="!prompt.trim() || quotaExhausted || pendingMessages"
        >
          Kirim
        </button>
        <button
          v-else
          type="button"
          class="btn btn-primary"
          style="background: var(--accent-red); border-color: var(--accent-red);"
          @click="stopGeneration"
        >
          <span class="spinner"></span>
          Stop
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Chat AI — CAFE-AI',
});

definePageMeta({
  middleware: 'auth',
});

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const config = useRuntimeConfig();
const prompt = ref('');
const messages = ref<ChatMessage[]>([]);
const isStreaming = ref(false);
const pendingMessages = ref(false);
const quotaExhausted = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const apiKey = ref('');
const allowedModels = ref<string[]>([]);
const selectedModel = ref<string>('sumopod');
const userMaxTokens = ref(1000000);
const userRemainingTokens = ref(0);
const abortController = ref<AbortController | null>(null);

const activeChatId = ref<string | null>(null);
const chats = ref<ChatSession[]>([]);
const pendingChats = ref(true);

const stopGeneration = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
};

const activeChatTitle = computed(() => {
  if (!activeChatId.value) return 'CHAT BARU';
  const chat = chats.value.find(c => c.id === activeChatId.value);
  return chat ? chat.title.toUpperCase() : 'CHAT AI';
});

// Load init data
onMounted(async () => {
  try {
    const data = await $fetch<{ apiKeys: { key: string, allowedModels: string[], remainingTokens: number, maxTokens: number }[] }>('/api/user/me');
    if (data.apiKeys.length > 0) {
      apiKey.value = data.apiKeys[0].key;
      userMaxTokens.value = data.apiKeys[0].maxTokens;
      userRemainingTokens.value = data.apiKeys[0].remainingTokens;
      allowedModels.value = data.apiKeys[0].allowedModels || ['sumopod'];
      if (data.apiKeys[0].remainingTokens <= 0) {
        quotaExhausted.value = true;
      }
      if (allowedModels.value.length > 0) {
        selectedModel.value = allowedModels.value[0];
      }
    }
  } catch {
    navigateTo('/login');
  }

  await fetchChats();
});

const fetchChats = async () => {
  pendingChats.value = true;
  try {
    chats.value = await $fetch<ChatSession[]>('/api/chat');
  } catch (err) {
    console.error('Gagal mengambil riwayat chat', err);
  } finally {
    pendingChats.value = false;
  }
};

const loadChat = async (chatId: string) => {
  if (isStreaming.value || activeChatId.value === chatId) return;
  
  activeChatId.value = chatId;
  pendingMessages.value = true;
  try {
    const chatData = await $fetch<{ messages: ChatMessage[] }>(`/api/chat/${chatId}`);
    messages.value = chatData.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    scrollToBottom();
  } catch (err) {
    console.error('Gagal memuat pesan', err);
  } finally {
    pendingMessages.value = false;
  }
};

const startNewChat = () => {
  if (isStreaming.value) return;
  activeChatId.value = null;
  messages.value = [];
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const sendMessage = async () => {
  if (!prompt.value.trim() || isStreaming.value || quotaExhausted.value || pendingMessages.value) return;

  const userMessage = prompt.value.trim();
  prompt.value = '';

  // 1. Create chat session if this is the first message
  if (!activeChatId.value) {
    try {
      const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
      const newChat = await $fetch<ChatSession>('/api/chat', {
        method: 'POST',
        body: { title }
      });
      activeChatId.value = newChat.id;
      chats.value.unshift(newChat); // Add to top of list
    } catch (err) {
      console.error('Gagal membuat chat baru', err);
      return;
    }
  }

  const chatId = activeChatId.value;

  // 2. Display and Save User Message
  messages.value.push({ role: 'user', content: userMessage });
  scrollToBottom();

  try {
    await $fetch(`/api/chat/${chatId}/messages`, {
      method: 'POST',
      body: { role: 'user', content: userMessage }
    });
  } catch (err) {
    console.error('Gagal menyimpan pesan user', err);
  }

  await triggerAIResponse(chatId);
};

const retryMessage = async (index: number) => {
  if (isStreaming.value) return;

  // Reset kuota exhausted agar bisa dicoba ulang (misal setelah admin perpanjang kuota)
  quotaExhausted.value = false;

  // Refresh data kuota dari server
  try {
    const freshData = await $fetch<{ apiKeys: { remainingTokens: number, maxTokens: number }[] }>('/api/user/me');
    if (freshData.apiKeys.length > 0) {
      userRemainingTokens.value = freshData.apiKeys[0].remainingTokens;
      userMaxTokens.value = freshData.apiKeys[0].maxTokens;
    }
  } catch {
    // lanjutkan dengan data terakhir
  }

  // Remove the error message
  messages.value.splice(index, 1);
  if (activeChatId.value) {
    await triggerAIResponse(activeChatId.value);
  }
};

const triggerAIResponse = async (chatId: string) => {
  // 3. Prepare AI Placeholder
  messages.value.push({ role: 'assistant', content: '' });
  isStreaming.value = true;

  try {
    abortController.value = new AbortController();

    // Ambil sisa kuota terbaru dari server sebelum setiap request
    try {
      const freshData = await $fetch<{ apiKeys: { remainingTokens: number, maxTokens: number }[] }>('/api/user/me');
      if (freshData.apiKeys.length > 0) {
        userRemainingTokens.value = freshData.apiKeys[0].remainingTokens;
        userMaxTokens.value = freshData.apiKeys[0].maxTokens;
      }
    } catch {
      // Jika gagal fetch, lanjutkan dengan data terakhir
    }

    if (userRemainingTokens.value <= 0) {
      quotaExhausted.value = true;
      const lastMsg = messages.value[messages.value.length - 1];
      lastMsg.content = `[Sistem: Permintaan dibatalkan karena sisa kuota token Anda telah habis (0/${userMaxTokens.value.toLocaleString('id-ID')})]`;
      lastMsg.isError = true;
      isStreaming.value = false;
      return;
    }

    // Estimasi token input (konservatif: 3 karakter = 1 token)
    const inputText = messages.value.filter(m => m.content && !m.isError).map(m => m.content).join(' ');
    const estimatedInputTokens = Math.ceil(inputText.length / 3);
    // Kurangi 10% sebagai safety margin agar tidak pernah melebihi kuota
    const rawOutputLimit = userRemainingTokens.value - estimatedInputTokens;
    const safeOutputLimit = Math.max(1, Math.floor(rawOutputLimit * 0.9));

    const payload: any = {
      model: selectedModel.value,
      messages: messages.value
        .filter((m) => m.content && !m.isError)
        .map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      // Selalu batasi output agar total (input + output) tidak melebihi sisa kuota
      max_tokens: safeOutputLimit,
    };

    // 4. Direct call to LiteLLM for SSE streaming
    const response = await fetch(`${config.public.litellmUrl}/v1/chat/completions`, {
      method: 'POST',
      signal: abortController.value.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.value}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      quotaExhausted.value = true;
      messages.value.pop();
      isStreaming.value = false;
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const lastMsg = messages.value[messages.value.length - 1];
      lastMsg.content = `[Error ${response.status}] ${errorText}`;
      lastMsg.isError = true;
      isStreaming.value = false;
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('Stream tidak tersedia.');

    let buffer = '';
    let outputTokenCount = 0; // Pelacak output token sebagai safety net
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; 

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          const finishReason = parsed.choices?.[0]?.finish_reason;

          if (delta) {
            messages.value[messages.value.length - 1].content += delta;
            scrollToBottom();

            // Safety net: hitung output token (konservatif: 3 karakter = 1 token)
            outputTokenCount += Math.ceil(delta.length / 3);
            if (outputTokenCount >= safeOutputLimit) {
              quotaExhausted.value = true;
              messages.value[messages.value.length - 1].content += `\n\n[Sistem: Auto-stop — sisa kuota token habis]`;
              messages.value[messages.value.length - 1].isError = true;
              stopGeneration();
              break;
            }
          }

          // Cek apakah AI berhenti karena mentok limit max_tokens
          if (finishReason === 'length' || finishReason === 'max_tokens') {
            quotaExhausted.value = true;
            messages.value[messages.value.length - 1].content += `\n\n[Sistem: Respons AI terpotong karena sisa kuota token Anda telah habis]`;
            messages.value[messages.value.length - 1].isError = true; // Munculkan tombol Retry
            break;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    // 5. Save AI Message when stream completes
    const finalContent = messages.value[messages.value.length - 1].content;
    if (finalContent && !messages.value[messages.value.length - 1].isError) {
      await $fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        body: { role: 'assistant', content: finalContent }
      });
    }

  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User cancelled, saving partial result to DB in finally block
      return; 
    }
    const lastMsg = messages.value[messages.value.length - 1];
    if (!lastMsg.content) {
      lastMsg.content = `[Error] ${err.message || 'Gagal terhubung ke AI Gateway.'}`;
    } else {
      lastMsg.content += `\n\n[Error: Stream terputus, kemungkinan kuota habis atau batas token maksimal model tercapai]`;
    }
    lastMsg.isError = true;
  } finally {
    isStreaming.value = false;
    scrollToBottom();
  }
};
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: calc(100vh - 48px - 64px - 64px);
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
  border: var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  overflow: hidden;
}

.chat-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: var(--border);
  flex-shrink: 0;
}

.sidebar-header {
  padding: var(--space-md);
  border-bottom: var(--border);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chat-item {
  text-align: left;
  padding: var(--space-md);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-item:hover {
  background: var(--bg-tertiary);
}

.chat-item.active {
  background: var(--bg-tertiary);
  border-left: 2px solid var(--accent-green);
}

.chat-item-title {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-date {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  min-width: 0;
}

.chat-header {
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border);
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--space-sm);
}

.chat-bubble {
  max-width: 85%;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius);
  border: var(--border);
}

.bubble-user {
  align-self: flex-end;
  background: var(--bg-tertiary);
}

.bubble-ai {
  align-self: flex-start;
  background: var(--bg-secondary);
}

.bubble-role {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-xs);
}

.bubble-content {
  font-size: 0.85rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.cursor {
  display: inline;
  color: var(--accent-green);
}

.chat-input-area {
  flex-shrink: 0;
  display: flex;
  gap: var(--space-md);
  align-items: flex-end;
  padding: var(--space-lg);
  border-top: var(--border);
  background: var(--bg-secondary);
}

.chat-textarea {
  flex: 1;
  resize: none;
  font-family: var(--font-sans);
  line-height: 1.5;
  background: var(--bg-primary);
}

@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
    border: none;
    border-radius: 0;
  }
  .chat-sidebar {
    width: 100%;
    height: 150px;
    border-right: none;
    border-bottom: var(--border);
  }
  .chat-header {
    display: none;
  }
}
</style>
