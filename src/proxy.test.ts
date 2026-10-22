import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

describe('Next.js Proxy route protection', () => {
  const originalEnv = process.env.NEXT_PUBLIC_DEMO_MODE;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = originalEnv;
  });

  it('redirects unauthenticated requests targeting /orders to /?auth_required=true', () => {
    const request = new NextRequest('http://localhost:3000/orders');
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/?auth_required=true');
  });

  it('allows access to /orders when jocksport_session cookie is present', () => {
    const request = new NextRequest('http://localhost:3000/orders', {
      headers: {
        cookie: 'jocksport_session=1',
      },
    });
    const response = proxy(request);

    // NextResponse.next() returns a 200 or x-middleware-next header
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows access to /orders when demo mode cookie is present', () => {
    const request = new NextRequest('http://localhost:3000/orders', {
      headers: {
        cookie: 'jocksport_demo_mode=1',
      },
    });
    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows access to /orders when NEXT_PUBLIC_DEMO_MODE is true', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    const request = new NextRequest('http://localhost:3000/orders');
    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it('does not interfere with public routes', () => {
    const request = new NextRequest('http://localhost:3000/products');
    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
