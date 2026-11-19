import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { dbGetAll, dbInsert } from "@/service/baseService";

// 1. Hàm GET: Xóa log cũ hơn 7 ngày (Chuẩn MySQL) và lấy danh sách log mới nhất
export async function GET() {
  try {
    const pool = await connectDB();

    // MySQL dùng NOW() và INTERVAL 7 DAY để trừ ngày tháng
    await pool.execute(`
      DELETE FROM \`WorkflowLogs\` 
      WHERE \`CreatedAt\` < NOW() - INTERVAL 7 DAY
    `);

    const logs = await dbGetAll("WorkflowLogs", "LogID");

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error("Error fetching workflow logs:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// 2. Hàm POST: Đọc trực tiếp ProductStatus từ bảng Products để ghi log
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, timestamp } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Thiếu productId!" },
        { status: 400 },
      );
    }

    const pool = await connectDB();

    // Dùng pool.execute và dấu ? cho chuẩn MySQL
    const [rows]: any = await pool.execute(
      `
        SELECT \`ProductID\`, \`ProductName\`, \`ProductStatus\` 
        FROM \`Products\` 
        WHERE \`ProductID\` = ?
      `,
      [productId],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm!" },
        { status: 404 },
      );
    }

    const { ProductID, ProductName, ProductStatus } = rows[0];

    // 🌟 Ép kiểu ProductStatus về String trước khi dùng .trim() để tránh lỗi crash kiểu số (INT)
    const statusText =
      ProductStatus !== null && ProductStatus !== undefined
        ? String(ProductStatus).trim()
        : "In Progress";

    const logTime = timestamp ? new Date(timestamp) : new Date();

    console.log(`trang thai ProductStatus: ${ProductStatus}`);

    await dbInsert("WorkflowLogs", {
      ProductID: ProductID,
      ProductName: ProductName,
      StatusText: statusText,
      CreatedAt: logTime,
    });

    return NextResponse.json({
      success: true,
      message: "Đã ghi nhận log real-time thành công!",
    });
  } catch (error: any) {
    console.error("Error saving workflow log:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
