import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Route yang hanya untuk admin. */
const ADMIN_ONLY = ["/users"];

/** Daftar route yang harus selalu bisa diakses tanpa login. */
const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role ?? "staff";

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Sudah login tapi buka /login → ke dashboard
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Belum login & akses protected → ke /login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based: admin-only
  const isAdminRoute = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isLoggedIn && isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/profile", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)",
  ],
};
