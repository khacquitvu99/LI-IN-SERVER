import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

function getMediaRoot(): string {
  const rawPath = process.env.MEDIA_ROOT?.trim() || "../MEDIA";
  return path.resolve(process.cwd(), rawPath);
}

function sanitizeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const baseName = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const shortId = crypto.randomBytes(4).toString("hex");
  return `${Date.now()}-${shortId}-${baseName || "img"}${ext}`;
}

function sanitizeRelativeFolder(rawFolder?: FormDataEntryValue | null): string {
  const fallback = "raw";
  if (typeof rawFolder !== "string" || !rawFolder.trim()) {
    return fallback;
  }

  const cleaned = rawFolder
    .trim()
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");

  return cleaned || fallback;
}

function resolveSafeTargetPath(inputPath: string): string | null {
  const cleaned = inputPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/^api\/images\//, "")
    .split("?")[0]
    .replace(/\\/g, "/");

  if (!cleaned) return null;

  const mediaRoot = getMediaRoot();
  const segments = cleaned
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  const resolvedPath = path.resolve(mediaRoot, ...segments);
  const rootWithSep = mediaRoot.endsWith(path.sep)
    ? mediaRoot
    : `${mediaRoot}${path.sep}`;

  if (!resolvedPath.startsWith(rootWithSep)) {
    return null;
  }

  return resolvedPath;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    const folderInput = sanitizeRelativeFolder(formData.get("folder"));
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Nếu không truyền folder (hoặc folder là "raw") thì dùng raw/YYYY/MM,
    // còn khi truyền "dc.DsProcessing/RenderIMG", "dc.DsProcessing/GemPosition",
    // "db.DsProcessing/ProcessImage" thì lưu đúng thư mục đó.
    const relativeDir =
      folderInput === "raw" ? path.posix.join("raw", year, month) : folderInput;

    const safeDir = resolveSafeTargetPath(relativeDir);
    if (!safeDir) {
      return NextResponse.json(
        { success: false, error: "Invalid target folder" },
        { status: 400 },
      );
    }

    await fs.mkdir(safeDir, { recursive: true });

    const fileName = sanitizeFileName(file.name);
    const filePath = path.join(safeDir, fileName);
    const relativePath = path.posix.join(relativeDir, fileName);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/api/images?path=${encodeURIComponent(relativePath)}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      relativePath,
      fileName,
      folder: relativeDir,
    });
  } catch (error: any) {
    console.error("🔥 Lỗi chi tiết khi upload file:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let rawTarget = searchParams.get("path") || "";

    if (!rawTarget) {
      const body = await request.json().catch(() => ({}));
      rawTarget = body?.path || body?.relativePath || "";
    }

    if (!rawTarget) {
      return NextResponse.json(
        { success: false, error: "Missing file path" },
        { status: 400 },
      );
    }

    const resolvedPath = resolveSafeTargetPath(rawTarget);
    if (!resolvedPath) {
      return NextResponse.json(
        { success: false, error: "Invalid file path" },
        { status: 400 },
      );
    }

    try {
      await fs.unlink(resolvedPath);
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      deletedPath: rawTarget,
    });
  } catch (error: any) {
    console.error("🔥 Lỗi chi tiết khi xóa file:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Delete failed" },
      { status: 500 },
    );
  }
}
