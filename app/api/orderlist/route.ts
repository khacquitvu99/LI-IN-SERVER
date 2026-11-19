import { NextResponse } from "next/server";
import { dbGetAll, dbSearchByField } from "@/service/baseService";
import { connectDB } from "@/lib/db"; // Thêm kết nối DB để chạy lệnh UPDATE đồng bộ

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParam =
      searchParams.get("customerCode") || searchParams.get("orderID");
    const code = rawParam ? rawParam.trim().toUpperCase() : "ALL";

    const pool = await connectDB();

    // 🌟 0. Bổ sung bước tự động đồng bộ Orders dựa trên ProductStatus (Chuẩn MySQL)
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

    // 1. Lấy toàn bộ danh sách Orders sau khi đã được cập nhật trạng thái mới nhất
    const orders = await dbGetAll("Orders", "OrderID");

    // 2. Lấy danh sách Products (Lọc theo CustomerCode nếu khác ALL)
    let products;
    if (code !== "" && code !== "ALL") {
      products = await dbSearchByField(
        "Products",
        "ProductID",
        "CustomerCode",
        code,
      );
    } else {
      products = await dbGetAll("Products", "ProductID");
    }

    // 3. Lọc ra những Order thực sự có chứa sản phẩm sau khi đã filter
    const validOrderIds = new Set(
      products.map((p: any) => String(p.orderID || p.OrderID).trim()),
    );

    const filteredOrders = orders.filter((order: any) => {
      const currentOrderId = String(order.orderID || order.OrderID).trim();
      return code === "ALL" || validOrderIds.has(currentOrderId);
    });

    // 4. Gộp nhóm sản phẩm vào từng đơn hàng tương ứng
    const formattedOrders = filteredOrders.map((order: any) => {
      const currentOrderId = order.orderID || order.OrderID;

      const childProducts = products.filter(
        (p: any) =>
          String(p.orderID || p.OrderID).trim() ===
          String(currentOrderId).trim(),
      );

      return {
        orderID: currentOrderId,
        status: order.orderStatus || order.OrderStatus || "In Progress",
        products: childProducts,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error: any) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch data!" },
      { status: 500 },
    );
  }
}
