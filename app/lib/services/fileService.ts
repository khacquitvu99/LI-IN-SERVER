import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

/**
 * Lưu file tải lên vào thư mục chỉ định (mặc định là public/uploads)
 * @param file File object nhận từ FormData
 * @param subFolder Thư mục con nếu muốn phân loại (ví dụ: "avatars", "products")
 * @returns Đường dẫn công khai của file để lưu vào SQL Server
 */
export async function uploadFile(
  file: File,
  subFolder: string = "uploads",
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Thư mục lưu trữ thực tế trên ổ đĩa
  const uploadDir = path.join(process.cwd(), "public", subFolder);

  // Tự động tạo thư mục nếu chưa tồn tại
  await mkdir(uploadDir, { recursive: true });

  // Tạo tên file độc nhất để tránh bị ghi đè trùng lặp
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.name);
  const fileName = `${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  // Ghi file
  await writeFile(filePath, buffer);

  // Trả về đường dẫn truy cập công khai
  return `/${subFolder}/${fileName}`;
}

/**
 * Xóa file trên server khi không còn sử dụng hoặc khi xóa bản ghi
 * @param fileUrl Đường dẫn file lưu trong DB (ví dụ: /uploads/123.jpg)
 */
export async function deleteFile(fileUrl: string) {
  try {
    if (!fileUrl) return;
    // Lọc bỏ dấu / ở đầu để lấy đường dẫn tương đối từ gốc dự án
    const relativePath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const filePath = path.join(process.cwd(), "public", relativePath);
    await unlink(filePath);
  } catch (error) {
    console.error("Error deleting the old file!!", error);
  }
}
