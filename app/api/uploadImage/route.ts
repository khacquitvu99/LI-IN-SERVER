import { NextResponse } from "next/server";
import path from "path";
import fsPost from "fs/promises";

// Định nghĩa thư mục lưu trữ bên ngoài dự án
const EXTERNAL_UPLOAD_DIR = "D:/WEB DEVELOP/Web Cty LI-IN/PICTURE/IMAGE";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Đảm bảo thư mục bên ngoài tồn tại, nếu chưa có thì tự tạo
    await fsPost.mkdir(EXTERNAL_UPLOAD_DIR, { recursive: true });

    // Tạo tên file duy nhất
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(EXTERNAL_UPLOAD_DIR, fileName);

    // Ghi file ra ổ đĩa
    await fsPost.writeFile(filePath, buffer);

    // Trả về URL dạng endpoint API để hiển thị ảnh trên giao diện
    const fileUrl = `/api/images/${fileName}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error("🔥 Lỗi chi tiết khi upload file:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );

  }
}
