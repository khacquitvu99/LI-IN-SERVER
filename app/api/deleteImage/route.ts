import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/Utilities/deleteFile";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Missing filename parameter!" },
        { status: 400 }, // 🌟 Đưa status vào trong object cấu hình chuẩn của NextResponse.json
      );
    }

    // 1. Lấy tên file gốc thuần túy (loại bỏ đường dẫn /api/images/ nếu dính vào)
    const cleanFileName = path.basename(filename);

    // 2. GỌI HÀM DELETE VẬT LÝ TRÊN Ổ D
    deleteFile(cleanFileName);

    return NextResponse.json({
      success: true,
      message: "Physical file deleted from D: drive successfully!",
    });
  } catch (error: any) {
    console.error("❌ Error in deleteImage route:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
