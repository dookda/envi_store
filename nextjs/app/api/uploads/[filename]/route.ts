import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) return new NextResponse("Not found", { status: 404 });

  // Weak ETag based on mtime + size — lets browsers skip the download on repeat visits.
  const etag = `"${fileStat.mtimeMs.toString(16)}-${fileStat.size.toString(16)}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304 });
  }

  const nodeStream = createReadStream(filePath);
  const webStream  = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type":   MIME[ext] ?? "application/octet-stream",
      "Content-Length": fileStat.size.toString(),
      "Cache-Control":  "public, max-age=31536000, immutable",
      "ETag":           etag,
    },
  });
}
