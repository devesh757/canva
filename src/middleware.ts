import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// Edge-safe route guard. Heavy work (DB) happens in route handlers / RSC.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession =
    req.cookies.has(SESSION_COOKIE) &&
    !!(await verifySessionToken(req.cookies.get(SESSION_COOKIE)!.value));

  const protectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/editor");
  const authPath = pathname.startsWith("/signin") || pathname.startsWith("/signup");

  if (protectedPath && !hasSession) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authPath && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/signin", "/signup"],
};
