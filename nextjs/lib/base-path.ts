// basePath "/store" is added automatically by Next.js for:
//   <Link href>, router.push, redirect() from next/navigation, signOut/signIn redirectTo
//   → use plain paths like "/login", "/"
//
// basePath is NOT added by:
//   NextResponse.redirect() in proxy.ts, Auth.js pages.signIn
//   → use full paths like "/store/login"
export const BASE_PATH = "";
// Only for proxy.ts (NextResponse.redirect) and auth.config.ts (pages.signIn).
// Do NOT pass LOGIN_PATH to redirect() / signOut / signIn — those already add basePath.
export const LOGIN_PATH = "/store/login";
export const AUTH_BASE_PATH = "/api/auth";
