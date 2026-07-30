import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Proteksi semua route di bawah /(dashboard) — kecuali /login, /api/auth. */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Rute yang harus selalu bisa diakses
  const publicPaths = ["/login", "/api/auth"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Sudah login tapi buka /login → redirect ke dashboard
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/employees", req.nextUrl));
  }

  // Belum login & akses dashboard/protected → ke /login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Tangkap semua route kecuali _next, asset, favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)"],
};
