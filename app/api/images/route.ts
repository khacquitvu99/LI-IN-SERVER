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

/**
 * Chuẩn hóa giá trị truyền vào ?path=...
 * Xử lý các trường hợp:
 * - "raw/2026/11/abc.jpg"
 * - "/api/images?path=raw%2F2026%2F11%2Fabc.jpg" hoặc "/api/images/images?path=..."
 * - "/api/images/raw/2026/11/abc.jpg"
 * - Chuỗi bị encode 1 hoặc nhiều lần (%2F, %252F...)
 */
function normalizeMediaPath(rawInput: string): string | null {
  let current = rawInput.trim();
  if (!current) return null;

  // Nếu lỡ truyền nguyên URL/path có chứa ?path= bên trong
  const queryIdx = current.indexOf("?path=");
  if (queryIdx !== -1) {
    current = current.slice(queryIdx + 6);
  }

  // Decode tối đa 3 lần để xử lý chuỗi bị double/triple encode an toàn
  for (let i = 0; i < 3; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(current)) break;
    const decoded = safeDecode(current);
    if (!decoded || decoded === current) break;
    current = decoded;
  }

  current = current.trim().replace(/^\/+/, "");

  // Bỏ tiền tố "api/images/images/" hoặc "api/images/" nếu lỡ dính vào path
  current = current.replace(/^(api\/images\/)+/i, "");

  // Chuyển dấu backslash của Windows về slash chuẩn
  current = current.replace(/\\/g, "/");

  return current || null;
}

export async function GET(request: NextRequest) {
  try {
    const rawPath = request.nextUrl.searchParams.get("path");
    if (!rawPath) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const normalizedPath = normalizeMediaPath(rawPath);
    if (!normalizedPath) {
      return new NextResponse("Invalid encoded path", { status: 400 });
    }

    const resolvedPath = resolveSafeMediaPath(normalizedPath);
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
