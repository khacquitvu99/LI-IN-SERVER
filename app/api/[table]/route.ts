import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { resolveSafeMediaPath } from "@/lib/media-storage";

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const queryPath = request.nextUrl.searchParams.get("path");
    if (!queryPath) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const decodedPath = safeDecode(queryPath);
    if (!decodedPath) {
      return new NextResponse("Invalid encoded path", { status: 400 });
    }

    const resolvedPath = resolveSafeMediaPath(decodedPath);
    if (!resolvedPath) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fileBuffer = await fs.readFile(resolvedPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": getContentType(resolvedPath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return new NextResponse("File not found", { status: 404 });
    }
    console.error("Lỗi đọc ảnh:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
