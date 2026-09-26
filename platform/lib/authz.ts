import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import {
  getChatGPTUser,
  requireChatGPTUser,
  type ChatGPTUser,
} from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { roles, userRoles, users } from '@/db/schema';

export type AppRole = 'guest' | 'customer' | 'staff' | 'manager' | 'admin';

export type Actor = {
  user: ChatGPTUser | null;
  role: AppRole;
};

function emailList(value?: string) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function databaseRole(externalAuthId: string): Promise<AppRole | null> {
  try {
    const db = getDb();
    const rows = await db
      .select({ code: roles.code })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.externalAuthId, externalAuthId));

    const priority: AppRole[] = ['admin', 'manager', 'staff', 'customer'];
    return (
      priority.find((role) => rows.some((row) => row.code === role)) ?? null
    );
  } catch {
    return null;
  }
}

export async function resolveRole(user: ChatGPTUser | null): Promise<AppRole> {
  if (!user) return 'guest';

  const email = user.email.toLowerCase();
  if (emailList(env.ADMIN_EMAILS).has(email)) return 'admin';
  if (emailList(env.MANAGER_EMAILS).has(email)) return 'manager';

  const assignedRole = await databaseRole(user.userId);
  if (assignedRole) return assignedRole;

  // The Sites scaffold uses this account only in the local emulator.
  if (email.endsWith('@sites.test')) return 'admin';
  return 'customer';
}

export async function getActor(): Promise<Actor> {
  const user = await getChatGPTUser();
  return { user, role: await resolveRole(user) };
}

export async function requireBackoffice(
  returnTo: string,
  accepted: AppRole[] = ['admin', 'manager', 'staff'],
) {
  const user = await requireChatGPTUser(returnTo);
  const role = await resolveRole(user);
  if (!accepted.includes(role)) {
    redirect('/tai-khoan?loi=khong-co-quyen');
  }
  return { user, role };
}

export function hasPermission(role: AppRole, permission: string) {
  const matrix: Record<AppRole, string[]> = {
    guest: ['catalog:read'],
    customer: [
      'catalog:read',
      'profile:write',
      'order:own:read',
      'order:create',
    ],
    staff: [
      'catalog:read',
      'order:read',
      'order:fulfill',
      'inventory:read',
      'inventory:operate',
      'customer:read',
    ],
    manager: [
      'catalog:read',
      'catalog:write',
      'order:read',
      'order:fulfill',
      'inventory:read',
      'inventory:operate',
      'inventory:write',
      'customer:read',
      'promotion:write',
      'report:read',
    ],
    admin: ['*'],
  };

  return matrix[role].includes('*') || matrix[role].includes(permission);
}
