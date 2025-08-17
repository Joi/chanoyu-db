import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const accept = req.headers.get('accept') || '';
  const url = req.nextUrl.clone();

  // If path ends with .jsonld, rewrite to /id/:token/jsonld
  if (url.pathname.endsWith('.jsonld')) {
    const m = url.pathname.match(/^\/id\/([^/]+)\.jsonld$/);
    if (m) {
      url.pathname = `/id/${m[1]}/jsonld`;
      return NextResponse.rewrite(url);
    }
  }

  // If Accept requests JSON-LD and path matches /id/:token, rewrite
  if (accept.includes('application/ld+json')) {
    const m = url.pathname.match(/^\/id\/([^/]+)$/);
    if (m) {
      url.pathname = `/id/${m[1]}/jsonld`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/id/:path*'],
};
