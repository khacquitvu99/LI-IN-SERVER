import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

// GET: Lấy danh sách khách hàng
export async function GET() {
  try {
    const pool = await connectDB();
    const [rows] = await pool.execute(
      "SELECT * FROM `Customer` ORDER BY `CustomerID` DESC",
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST: Thêm khách hàng mới
export async function POST(request: Request) {
  try {
    const { customName } = await request.json();
    const pool = await connectDB();

    // MySQL dùng phương thức execute với dấu ? và lấy insertId từ kết quả trả về
    const [result] = await pool.execute(
      "INSERT INTO `Customer` (`CustomName`) VALUES (?)",
      [customName],
    );

    const insertResult = result as any;

    return NextResponse.json({
      success: true,
      customerId: insertResult.insertId, // Trả về ID tự tăng vừa được tạo trong MySQL
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
