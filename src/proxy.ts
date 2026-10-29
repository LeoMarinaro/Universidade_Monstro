import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open without logging in
const PUBLIC_PATHS = ["/entrar", "/cadastro"];

// Quick check that only looks for the session cookie, without hitting the
// database, to send logged-out visitors to the login page. Pages still validate
// the session for real (src/lib/session.ts).
export function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!isPublic && !getSessionCookie(request)) {
    const loginUrl = new URL("/entrar", request.url);
    // Come back here after logging in (e.g. an invite link)
    const { pathname, search } = request.nextUrl;
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the auth API, Next.js internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
