import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const AUTH_SECRET = (process.env.AUTH_SECRET || 'change-me').padEnd(32, 'x');

const encoder = new TextEncoder();

export async function login(email: string, password: string): Promise<boolean> {
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) return false;
  const token = await new SignJWT({ sub: email, role: 'admin' })
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
    await jwtVerify(token, encoder.encode(AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function requireOwner(): Promise<boolean> {
  const email = await currentUserEmail();
  return !!email && email === ADMIN_EMAIL;
}
