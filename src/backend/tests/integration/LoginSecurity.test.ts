import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { once } from 'node:events';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import app from '../../app.js';
import bcrypt from 'bcrypt';
import { testPrisma, useTestDatabase } from './setup.js';

useTestDatabase();

let server: Server;
let base: string;
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
afterAll(() => new Promise<void>((resolve, reject) => {
  server.close(error => error ? reject(error) : resolve());
}));

it('rejects cross-origin mutations before authentication', async () => {
  const response = await fetch(base + '/admin/post/1/publish', {
    method: 'POST', headers: { Origin: 'https://other.example' }, redirect: 'manual',
  });
  expect(response.status).toBe(403);
});

it('limits sign-ins across equivalent account identifiers', async () => {
  const email = 'login-' + crypto.randomUUID() + '@example.test';
  for (let attempt = 0; attempt < 7; attempt++) {
    const response = await fetch(base + '/login', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
      body: new URLSearchParams({ email: attempt % 2 ? email.toUpperCase() : email, password: 'incorrect' }),
    });
    expect(response.status).toBe(attempt < 6 ? 200 : 429);
  }
});

it('changes publication only through same-origin writes with an explicit target state', async () => {
  const password = 'a unique test passphrase';
  await testPrisma.user.create({ data: {
    name: 'Test admin', email: 'admin@test.com', password: await bcrypt.hash(password, 4),
  } });
  const post = await testPrisma.post.create({ data: { title: 'Private draft', slug: 'private-draft', body: 'Draft' } });
  const login = await fetch(base + '/login', {
    method: 'POST', headers: { Origin: 'http://localhost:3000' }, redirect: 'manual',
    body: new URLSearchParams({ email: 'admin@test.com', password }),
  });
  expect(login.status).toBe(302);
  const cookie = login.headers.getSetCookie()[0]!.split(';')[0]!;
  const url = base + '/admin/post/' + post.id + '/publish';
  const read = await fetch(url, { headers: { Cookie: cookie }, redirect: 'manual' });
  expect(read.status).toBe(404);
  const headers = { Origin: 'http://localhost:3000', Cookie: cookie };
  for (const publication of ['publish', 'publish', 'unpublish']) {
    const response = await fetch(url, {
      method: 'POST', headers, redirect: 'manual', body: new URLSearchParams({ publication }),
    });
    expect(response.status).toBe(302);
    const stored = await testPrisma.post.findUnique({ where: { id: post.id } });
    expect(Boolean(stored?.publishedAt)).toBe(publication === 'publish');
  }
});

it.skipIf(!process.env['REDIS_HOST'])('shares login and logout across app instances', async () => {
  const password = 'a synthetic test password';
  const email = 'admin@test.com';
  await testPrisma.user.create({ data: {
    name: 'Replica test', email, password: await bcrypt.hash(password, 4),
  } });

  vi.resetModules();
  const { default: secondApp } = await import('../../app.js');
  expect(secondApp).not.toBe(app);
  const secondServer = secondApp.listen(0, '127.0.0.1');
  try {
    await once(secondServer, 'listening');
    const secondBase = 'http://127.0.0.1:' + (secondServer.address() as AddressInfo).port;
    const login = await fetch(base + '/login', {
      method: 'POST', headers: { Origin: 'http://localhost:3000' }, redirect: 'manual',
      body: new URLSearchParams({ email, password }),
    });
    expect(login.headers.get('location')).toBe('/admin/dashboard');
    const cookie = login.headers.getSetCookie()[0]!.split(';')[0]!;
    const headers = { Cookie: cookie, Origin: 'http://localhost:3000' };
    const dashboard = await fetch(secondBase + '/admin/dashboard', { headers, redirect: 'manual' });
    expect(dashboard.status).toBe(200);
    const logout = await fetch(secondBase + '/logout', { method: 'POST', headers, redirect: 'manual' });
    expect(logout.status).toBe(302);
    const afterLogout = await fetch(base + '/admin/dashboard', { headers, redirect: 'manual' });
    expect(afterLogout.headers.get('location')).toBe('/login');
  } finally {
    await new Promise<void>((resolve, reject) => {
      secondServer.close(error => error ? reject(error) : resolve());
    });
  }
});
