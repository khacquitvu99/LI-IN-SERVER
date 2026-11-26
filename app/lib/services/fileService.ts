import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Lấy thư mục gốc lưu media tách biệt khỏi source code.
 * Mặc định "../MEDIA" (ngang cấp thư mục project), cấu hình qua MEDIA_ROOT.
 */
export function getMediaRoot(): string {
  const configuredPath = process.env.MEDIA_ROOT?.trim() || "../MEDIA";
  return path.resolve(process.cwd(), configuredPath);
}

/**
 * Lưu file tải lên vào thư mục MEDIA tách biệt (chia theo subFolder/YYYY/MM).
 * Trả về đường dẫn tương đối (ví dụ: "products/2026/11/1732410000-a1b2c3d4.jpg")
 * để lưu vào database mà không phụ thuộc đường dẫn máy/server.
 */
export async function uploadFile(
  file: File,
  subFolder: string = "uploads",
  date: Date = new Date(),
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeSubFolder = subFolder
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "");
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const relativeDir = path.posix.join(safeSubFolder, year, month);
  const uploadDir = path.join(getMediaRoot(), safeSubFolder, year, month);

  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name).toLowerCase() || ".bin";
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const fileName = `${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return path.posix.join(relativeDir, fileName);
}

/**
 * Xóa file bên trong MEDIA_ROOT dựa theo đường dẫn tương đối lưu trong DB.
 * Có chặn path traversal để không xóa nhầm file ngoài thư mục MEDIA.
 */
export async function deleteFile(storedPath: string): Promise<void> {
  try {
    if (!storedPath) return;

    // Nếu lỡ lưu dạng "/api/images/..." thì cắt bỏ prefix để lấy đường dẫn tương đối
    const cleaned = storedPath
      .replace(/^\/?api\/images\//, "")
      .replace(/^\/+/, "");

    const mediaRoot = getMediaRoot();
    const resolvedPath = path.resolve(mediaRoot, cleaned);
    const rootWithSep = mediaRoot.endsWith(path.sep)
      ? mediaRoot
      : `${mediaRoot}${path.sep}`;

    if (!resolvedPath.startsWith(rootWithSep)) {
      console.warn("Blocked invalid file delete path:", storedPath);
      return;
    }

    await unlink(resolvedPath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.error("Error deleting the old file!!", error);
    }
  }
}
