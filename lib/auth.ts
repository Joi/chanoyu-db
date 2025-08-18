import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

const AUTH_SECRET = (process.env.AUTH_SECRET || 'change-me').padEnd(32, 'x');

const encoder = new TextEncoder();

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hex] = (stored || '').split(':');
  if (!salt || !hex) return false;
  const calc = crypto.pbkdf2Sync(plain, salt, 200_000, 32, 'sha256');
  try {
    return crypto.timingSafeEqual(Buffer.from(hex, 'hex'), calc);
  } catch {
    return false;
  }
}

export async function login(email: string, password: string): Promise<boolean> {
  const db = supabaseAdmin();

  // Try normal account login first
  const { data: acct } = await db
    .from('accounts')
    .select('id, email, role, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (acct && verifyPassword(password, String(acct.password_hash || ''))) {
    const token = await new SignJWT({ sub: acct.email, role: acct.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .setIssuedAt()
      .sign(encoder.encode(AUTH_SECRET));
    cookies().set('ito_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return true;
  }

  return false;
}

export async function logout() {
  cookies().delete('ito_admin');
}

export async function currentUserEmail(): Promise<string | null> {
  const token = cookies().get('ito_admin')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(AUTH_SECRET));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<boolean> {
  const token = cookies().get('ito_admin')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(AUTH_SECRET));
    const email = typeof payload.sub === 'string' ? payload.sub : '';
    if (!email) return false;
    const db = supabaseAdmin();
    const { data } = await db.from('accounts').select('role').eq('email', email).maybeSingle();
    return data?.role === 'admin' || data?.role === 'owner';
  } catch {
    return false;
  }
}

export async function requireOwner(): Promise<boolean> {
  const token = cookies().get('ito_admin')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(AUTH_SECRET));
    const email = typeof payload.sub === 'string' ? payload.sub : '';
    if (!email) return false;
    const db = supabaseAdmin();
    const { data } = await db.from('accounts').select('role').eq('email', email).maybeSingle();
    return data?.role === 'owner';
  } catch {
    return false;
  }
}

export async function requireMember(): Promise<boolean> {
  const token = cookies().get('ito_admin')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(AUTH_SECRET));
    const email = typeof payload.sub === 'string' ? payload.sub : '';
    if (!email) return false;
    const db = supabaseAdmin();
    const { data } = await db.from('accounts').select('role').eq('email', email).maybeSingle();
    return data?.role === 'guest' || data?.role === 'admin' || data?.role === 'owner';
  } catch {
    return false;
  }
}
