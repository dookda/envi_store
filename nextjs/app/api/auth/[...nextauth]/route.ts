import { handlers } from "@/auth";
import { NextRequest } from "next/server";

// Next.js strips basePath (/store) before routing. Auth.js never sees /store,
// so it can't include /store in generated callback URLs.
// We restore /store in the pathname so Auth.js sees the full path.
function restoreBasePath(req: NextRequest): NextRequest {
  const url = new URL(req.url);
  url.pathname = `/store${url.pathname}`;
  return new NextRequest(url.toString(), req);
}

export async function GET(req: NextRequest) {
  return handlers.GET(restoreBasePath(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(restoreBasePath(req));
}
