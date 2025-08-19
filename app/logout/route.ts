import { NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function GET(request: Request) {
  await logout();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL('/login?signedout=1', origin));
}

export async function POST(request: Request) {
  await logout();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL('/login?signedout=1', origin));
}


