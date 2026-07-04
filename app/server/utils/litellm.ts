/**
 * LiteLLM Admin API Client.
 * Wraps key management operations (generate, info, delete).
 * Auto-imported in Nitro server routes via server/utils/ convention.
 */

// ─── Types ──────────────────────────────────────────────────
export interface LiteLLMKeyResponse {
  key: string;
  key_name: string;
  token: string;
  expires: string | null;
  user_id: string | null;
  max_budget: number | null;
  info: {
    spend: number;
    max_budget: number | null;
    tpm_limit: number;
    rpm_limit: number;
    models: string[];
    metadata: Record<string, unknown>;
  };
}

export interface LiteLLMKeyInfo {
  key: string;
  key_name: string;
  spend: number;
  max_budget: number | null;
  tpm_limit: number;
  rpm_limit: number;
  models: string[];
  metadata: Record<string, unknown>;
}

// ─── Generate Key ───────────────────────────────────────────
export async function generateLiteLLMKey(
  userId: string,
  email: string
): Promise<LiteLLMKeyResponse> {
  const response = await fetch(`${env.LITELLM_BASE_URL}/key/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify({
      key_name: `user_${email}`,
      max_budget: 1000, // 1_000_000 tokens / 1000
      max_parallel_requests: 5,
      metadata: { user_id: userId, email },
      tpm_limit: 1_000_000,
      rpm_limit: 60,
      models: ['sumopod'],
      duration: null,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw createError({
      statusCode: 502,
      statusMessage: `LiteLLM key generation failed: ${response.status} — ${errorBody}`,
    });
  }

  return response.json() as Promise<LiteLLMKeyResponse>;
}

// ─── Get Key Info ───────────────────────────────────────────
export async function getKeyInfo(apiKey: string): Promise<LiteLLMKeyResponse> {
  const response = await fetch(
    `${env.LITELLM_BASE_URL}/key/info?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.LITELLM_MASTER_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw createError({
      statusCode: 502,
      statusMessage: `LiteLLM key info failed: ${response.status} — ${errorBody}`,
    });
  }

  return response.json() as Promise<LiteLLMKeyResponse>;
}

// ─── Update Key ──────────────────────────────────────────────
export async function updateLiteLLMKey(
  keyId: string, // the token or key
  models: string[],
  maxTokens: number
): Promise<void> {
  const response = await fetch(`${env.LITELLM_BASE_URL}/key/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify({
      key: keyId,
      models,
      max_budget: maxTokens / 1000
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw createError({
      statusCode: 502,
      statusMessage: `LiteLLM key update failed: ${response.status} — ${errorBody}`,
    });
  }
}

// ─── Delete Key ─────────────────────────────────────────────
export async function deleteLiteLLMKey(keyId: string): Promise<void> {
  const response = await fetch(`${env.LITELLM_BASE_URL}/key/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify({ keys: [keyId] }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw createError({
      statusCode: 502,
      statusMessage: `LiteLLM key deletion failed: ${response.status} — ${errorBody}`,
    });
  }
}
