import { describe, expect, it, vi } from 'vitest';

vi.mock('cloudflare:workers', () => ({ env: { APP_ENV: 'local' } }));
vi.mock('../app/chatgpt-auth', () => ({ getChatGPTUser: vi.fn(), requireChatGPTUser: vi.fn() }));
vi.mock('../db', () => ({ getDb: vi.fn(() => { throw new Error('database unavailable'); }) }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { hasPermission, resolveRole, type AppRole } from '../lib/authz';

describe('authorization policy', () => {
  it.each<[AppRole, string, boolean]>([
    ['guest', 'catalog:read', true],
    ['guest', 'order:create', false],
    ['customer', 'order:own:read', true],
    ['staff', 'inventory:operate', true],
    ['staff', 'promotion:write', false],
    ['manager', 'report:read', true],
    ['manager', 'customer:write', false],
    ['admin', 'anything', true],
  ])('%s permission %s is %s', (role, permission, allowed) => {
    expect(hasPermission(role, permission)).toBe(allowed);
  });

  it('characterizes the local scaffold fallback when DB is unavailable (production is tested separately)', async () => {
    await expect(resolveRole(null)).resolves.toBe('guest');
    await expect(resolveRole({ userId: '1', email: 'dev@sites.test', displayName: 'Dev', fullName: 'Dev' })).resolves.toBe('admin');
    await expect(resolveRole({ userId: '2', email: 'member@example.com', displayName: 'Member', fullName: 'Member' })).resolves.toBe('customer');
  });
});
