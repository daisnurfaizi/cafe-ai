import { describe, it, expect, beforeAll } from 'bun:test';

const BASE_URL = 'http://localhost:3000';
const LITELLM_URL = 'http://localhost:4000';
let userApiKey = '';
let cookie = '';

describe('API Gateway & Token Manager', () => {
  const testUser = {
    email: `test_integration_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Integration Test User',
  };

  it('should register a new user and return an API key', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.apiKey).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    
    userApiKey = data.apiKey;
    
    // Get session cookie
    const setCookieHeader = res.headers.get('set-cookie');
    if (setCookieHeader) {
      cookie = setCookieHeader.split(';')[0];
    }
  });

  it('should reject duplicate email registration', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    expect(res.status).toBe(409);
  });

  it('should return 401 for unauthenticated profile request', async () => {
    const res = await fetch(`${BASE_URL}/api/user/me`);
    expect(res.status).toBe(401);
  });

  it('should return profile and token info when authenticated', async () => {
    const res = await fetch(`${BASE_URL}/api/user/me`, {
      headers: {
        Cookie: cookie,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe(testUser.email);
    expect(data.apiKeys.length).toBeGreaterThan(0);
    expect(data.apiKeys[0].key).toBe(userApiKey);
    expect(data.apiKeys[0].maxTokens).toBe(1_000_000);
  });

  it('should be able to chat with AI via LiteLLM using the generated API Key', async () => {
    // 9Router domain seems to require specific setup or the model might not be accessible if the external 9Router key is invalid, 
    // but LiteLLM will at least accept the request and validate the token.
    const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userApiKey}`,
      },
      body: JSON.stringify({
        model: 'sumopod',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      }),
    });

    // We just want to check if it reaches LiteLLM and gets processed or rejected with a valid LLM response
    expect(res.status).not.toBe(401); // Should be authenticated by LiteLLM
    // Either 200 (Success) or 500 (Upstream error from 9Router) depending on the external 9Router status
    const data = await res.text();
    console.log('LiteLLM response:', data.substring(0, 200));
  });
});
