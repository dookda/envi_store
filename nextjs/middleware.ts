import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { BASE_PATH, LOGIN_PATH } from "@/lib/base-path";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.nextUrl.origin));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(BASE_PATH, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [`/((?!subscribe/api/auth|_next/static|_next/image|favicon.ico).*)`],
};
