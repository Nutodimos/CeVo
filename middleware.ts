import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "FATAL: SESSION_SECRET is not set or shorter than 32 characters. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}
const key = new TextEncoder().encode(rawSecret);

// Security headers applied to every response
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=()",
  "X-DNS-Prefetch-Control": "off",
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -----------------------------------------------------------------------
  // Protect /admin routes (except /admin/login)
  // -----------------------------------------------------------------------
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("admin_session")?.value;

    if (!adminToken) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url))
      );
    }

    try {
      await jwtVerify(adminToken, key, { algorithms: ["HS256"] });
    } catch {
      // Invalid or expired token
      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      response.cookies.delete("admin_session");
      return withSecurityHeaders(response);
    }
  }

  // -----------------------------------------------------------------------
  // Protect /superadmin routes — JWT role check (DB re-check is in the
  // server action layer via verifySuperAdminSession)
  // -----------------------------------------------------------------------
  if (pathname.startsWith("/superadmin")) {
    const adminToken = request.cookies.get("admin_session")?.value;

    if (!adminToken) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url))
      );
    }

    try {
      const { payload } = await jwtVerify(adminToken, key, { algorithms: ["HS256"] });
      if (payload.role !== "super_admin") {
        return withSecurityHeaders(new NextResponse("403 Forbidden", { status: 403 }));
      }
    } catch {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("admin_session");
      return withSecurityHeaders(response);
    }
  }

  // -----------------------------------------------------------------------
  // Protect /org/[orgSlug]/admin routes
  // -----------------------------------------------------------------------
  if (pathname.match(/^\/org\/[^/]+\/admin/)) {
    const adminToken = request.cookies.get("admin_session")?.value;

    if (!adminToken) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/admin/login", request.url))
      );
    }

    try {
      await jwtVerify(adminToken, key, { algorithms: ["HS256"] });
    } catch {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("admin_session");
      return withSecurityHeaders(response);
    }
  }

  // -----------------------------------------------------------------------
  // Protect voter flow routes: /e/[slug]/capture, /ballot, /receipt
  // These require a valid voter session in the correct phase.
  // -----------------------------------------------------------------------
  const captureMatch = pathname.match(/^\/e\/([^/]+)\/capture$/);
  const ballotMatch = pathname.match(/^\/e\/([^/]+)\/ballot$/);
  const receiptMatch = pathname.match(/^\/e\/([^/]+)\/receipt$/);

  if (captureMatch || ballotMatch || receiptMatch) {
    const voterToken = request.cookies.get("voter_session")?.value;
    const slug = (captureMatch || ballotMatch || receiptMatch)![1];
    const homeUrl = new URL(`/e/${slug}`, request.url);

    if (!voterToken) {
      return withSecurityHeaders(NextResponse.redirect(homeUrl));
    }

    try {
      const { payload } = await jwtVerify(voterToken, key, {
        algorithms: ["HS256"],
      });

      const requiredPhase = captureMatch ? "capture" : ballotMatch ? "ballot" : "receipt";
      if (payload.phase !== requiredPhase) {
        return withSecurityHeaders(NextResponse.redirect(homeUrl));
      }
    } catch {
      return withSecurityHeaders(NextResponse.redirect(homeUrl));
    }
  }

  // Apply security headers to all other passing responses
  const response = NextResponse.next();
  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/org/:orgSlug/admin/:path*",
    "/e/:slug/capture",
    "/e/:slug/ballot",
    "/e/:slug/receipt",
    // Also apply security headers broadly (exclude static assets & _next internals)
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)).*)",
  ],
};
