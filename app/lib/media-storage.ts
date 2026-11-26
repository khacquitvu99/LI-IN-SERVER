import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

export type MediaBucket = "incoming" | "active" | "variants" | "archive" | "tmp";

/**
 * Lấy đường dẫn thư mục MEDIA tách biệt khỏi source code.
 * - Mặc định "../MEDIA" (ngang hàng dự án ở local/dev hoặc khi giữ cấu trúc ngang hàng).
 * - Trên VPS: có thể trỏ tới thư mục/volume riêng qua MEDIA_ROOT (VD: /var/data/li-in-media).
 */
export function getMediaRoot(): string {
  const configuredPath = process.env.MEDIA_ROOT?.trim() || "../MEDIA";
  return path.resolve(process.cwd(), configuredPath);
}

/**
 * Chuẩn hóa relativePath (VD: "incoming/2026/11/1732410000-a1b2c3d4-img.jpg")
 * Loại bỏ các prefix thừa nếu lỡ truyền vào.
 */
export function normalizeRelativePath(inputPath: string): string {
  return inputPath
    .trim()
    .replace(/^\/+/, "")
    .replace(/^api\/images\//, "")
    .split("?")[0]
    .replace(/\\/g, "/");
}

/**
 * Tạo tên file an toàn, tránh trùng lặp khi data ùn lên.
 */
export function buildSafeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const baseName = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const shortId = crypto.randomBytes(4).toString("hex");
  return `${Date.now()}-${shortId}-${baseName || "img"}${ext}`;
}

/**
 * Resolve đường dẫn tuyệt đối an toàn bên trong MEDIA_ROOT (chống path traversal).
 */
export function resolveSafeMediaPath(relativePath: string): string | null {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) return null;

  const mediaRoot = getMediaRoot();
  const segments = normalized.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
  const resolvedPath = path.resolve(mediaRoot, ...segments);

  const rootWithSep = mediaRoot.endsWith(path.sep)
    ? mediaRoot
    : `${mediaRoot}${path.sep}`;

  if (!resolvedPath.startsWith(rootWithSep)) {
    return null;
  }

  return resolvedPath;
}

/**
 * Tạo URL hiển thị ảnh thống nhất toàn hệ thống.
 * - Mặc định dùng route nội bộ: /api/images/<relativePath>
 * - Nếu trên VPS / CDN có cấu hình MEDIA_PUBLIC_BASE_URL (VD: https://media.domain.com/media),
 *   sẽ trả về URL trực tiếp từ base đó để giảm tải cho Next.js.
 */
export function buildMediaUrl(relativePath: string): string {
  const cleanPath = normalizeRelativePath(relativePath);
  const baseUrl = process.env.MEDIA_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");

  if (baseUrl) {
    return `${baseUrl}/${cleanPath}`;
  }

  return `/api/images/${cleanPath}`;
}

/**
 * Lưu File vào thư mục bucket/YYYY/MM bên trong MEDIA_ROOT.
 * Trả về relativePath để lưu vào DB và url để hiển thị ngay.
 */
export async function saveUploadedMedia(
  file: File,
  bucket: MediaBucket = "incoming",
  subFolder?: string,
  date: Date = new Date(),
): Promise<{
  relativePath: string;
  fileName: string;
  url: string;
}> {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const cleanSub = subFolder
    ? subFolder.replace(/^\/+|\/+$/g, "").replace(/\.\./g, "")
    : "";

  const relativeParts = cleanSub
    ? [bucket, cleanSub, year, month]
    : [bucket, year, month];

  const relativeDir = path.posix.join(...relativeParts);
  const targetDir = path.join(getMediaRoot(), ...relativeParts);

  await fs.mkdir(targetDir, { recursive: true });

  const fileName = buildSafeFileName(file.name);
  const relativePath = path.posix.join(relativeDir, fileName);
  const fullPath = path.join(targetDir, fileName);

  const bytes = await file.arrayBuffer();
  await fs.writeFile(fullPath, Buffer.from(bytes));

  return {
    relativePath,
    fileName,
    url: buildMediaUrl(relativePath),
  };
}

/**
 * Xóa file an toàn bên trong MEDIA_ROOT.
 */
export async function deleteStoredMedia(storedPath: string): Promise<void> {
  try {
    const resolvedPath = resolveSafeMediaPath(storedPath);
    if (!resolvedPath) return;
    await fs.unlink(resolvedPath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.error("Lỗi xóa file media:", error);
    }
  }
}