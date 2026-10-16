import { afterEach, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ APP_ENV: 'production', ADMIN_EMAILS: '', MANAGER_EMAILS: '' }));
vi.mock('cloudflare:workers', () => ({ env }));
vi.mock('../app/chatgpt-auth', () => ({ getChatGPTUser: vi.fn(), requireChatGPTUser: vi.fn() }));
vi.mock('../db', () => ({ getDb: vi.fn(() => { throw new Error('DB unavailable'); }) }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { resolveRole } from '../lib/authz';

afterEach(() => { env.APP_ENV = 'production'; env.ADMIN_EMAILS = ''; env.MANAGER_EMAILS = ''; });

it('does not grant scaffold admin privileges outside local when role lookup fails', async () => {
  await expect(resolveRole({ userId: 'nonprivileged', email: 'member@sites.test',
    displayName: 'Member', fullName: 'Member' })).resolves.toBe('customer');
});

it('does not match an admin email by suffix or substring', async () => {
  env.ADMIN_EMAILS = 'owner@example.com';
  await expect(resolveRole({ userId: 'nonprivileged', email: 'owner@example.com.attacker.test',
    displayName: 'Member', fullName: 'Member' })).resolves.toBe('customer');
});
