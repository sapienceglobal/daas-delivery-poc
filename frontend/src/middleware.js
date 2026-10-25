import { proxy } from './proxy';

export async function middleware(request) {
  return proxy(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public asset folders
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
