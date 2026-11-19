import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const pool = await connectDB();

    // 1. Cập nhật trạng thái tự động vào bảng Orders (Chuẩn MySQL dùng IFNULL và pool.execute)
    await pool.execute(`
      UPDATE \`Orders\`
      SET \`OrderStatus\` = CASE 
          WHEN NOT EXISTS (
              SELECT 1 FROM \`Products\` p 
              WHERE p.\`OrderID\` = \`Orders\`.\`OrderID\` 
                AND IFNULL(p.\`ProductStatus\`, 0) <> 10
          ) 
          AND EXISTS (
              SELECT 1 FROM \`Products\` p 
              WHERE p.\`OrderID\` = \`Orders\`.\`OrderID\`
          )
          THEN 'Completed'
          ELSE 'In Progress'
      END
    `);

    // 2. SELECT và AS alias thành chữ 'status' để Frontend nhận diện chính xác tuyệt đối
    const [rows] = await pool.execute(`
      SELECT o.\`OrderID\`, o.\`OrderStatus\` AS status, p.\`ProductID\`, p.\`ProductCode\`, 
             p.\`ProductName\`, p.\`ProductStatus\`, p.\`Image\` 
      FROM \`Orders\` o
      LEFT JOIN \`Products\` p ON o.\`OrderID\` = p.\`OrderID\`
    `);

    return NextResponse.json({
      success: true,
      orders: rows, // Trả về mảng rows của mysql2
    });
  } catch (error: any) {
    console.error("Error syncing and fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
