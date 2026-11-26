import fs from "fs";
import path from "path";

/**
 * Hàm dùng chung để xóa một hoặc nhiều file ảnh vật lý khỏi thư mục public/uploads
 * @param imagePaths Đường dẫn tương đối của ảnh (ví dụ: "/uploads/products/img1.jpg" hoặc danh sách mảng ảnh)
 */ const EXTERNAL_UPLOAD_DIR = "D:/WEB DEVELOP/Web Cty LI-IN/PICTURE/IMAGE";

export function deleteFile(imagePath: string | null | undefined): void {
  if (!imagePath) return;

  try {
    // imagePath có dạng: "/api/images/1710000000-avatar.jpg"
    // Lấy tên file gốc ra từ URL
    const fileName = path.basename(imagePath);
    const absolutePath = path.join(EXTERNAL_UPLOAD_DIR, fileName);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`[File Deleted]: ${absolutePath}`);
    } else {
      console.log(`[Warning]: File does not exist!! ${absolutePath}`);
    }
  } catch (error) {
    console.error("[Delete File Error]:", error);
  }
}