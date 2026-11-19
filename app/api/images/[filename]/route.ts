 import { NextResponse } from "next/server";
import path from "path";
import fsGet from "fs";
const EXTERNAL_UPLOAD_DIR = "D:/WEB DEVELOP/Web Cty LI-IN/PICTURE/IMAGE";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  try {
    const params = await context.params;
    // Giải mã URI để đảm bảo các ký tự đặc biệt như dấu gạch ngang/dưới không bị lỗi mã hóa
    const filename = decodeURIComponent(params.filename);
    const filePath = path.join(EXTERNAL_UPLOAD_DIR, filename);

    if (!fsGet.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fsGet.readFileSync(filePath);

    const ext = path.extname(filename).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Lỗi đọc ảnh:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
