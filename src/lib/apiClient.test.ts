import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from './apiClient';

describe('apiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('performs successful GET request and unwraps JSON', async () => {
    const mockData = { message: 'hello', success: true };
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await apiClient.get<typeof mockData>('/test');
    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('serializes query parameters correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await apiClient.get('/products', {
      params: { category: 'shoes', limit: 10, featured: true, empty: null },
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('category=shoes');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('featured=true');
    expect(calledUrl).not.toContain('empty=');
  });

  it('retries GET requests once on 500 error', async () => {
    const errorResponse = new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

    const successResponse = new Response(JSON.stringify({ data: 'recovered' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await apiClient.get<{ data: string }>('/flaky');
    expect(result).toEqual({ data: 'recovered' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws ApiError on 404 without retrying client errors', async () => {
    const notFoundResponse = new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

    globalThis.fetch = vi.fn().mockResolvedValueOnce(notFoundResponse);

    await expect(apiClient.get('/missing')).rejects.toThrow(ApiError);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry POST mutations by default', async () => {
    const errorResponse = new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

    globalThis.fetch = vi.fn().mockResolvedValueOnce(errorResponse);

    await expect(apiClient.post('/items', { name: 'New Item' })).rejects.toThrow(ApiError);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('times out and throws 408 ApiError when request exceeds timeoutMs', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url, config: RequestInit) => {
      return new Promise((_resolve, reject) => {
        config.signal?.addEventListener('abort', () => {
          const abortErr = new Error('The operation was aborted');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });

    await expect(
      apiClient.get('/slow', { timeoutMs: 50, retries: 0 })
    ).rejects.toThrow(ApiError);

    try {
      await apiClient.get('/slow', { timeoutMs: 50, retries: 0 });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(408);
      expect((e as ApiError).message).toContain('timed out');
    }
  });
});
