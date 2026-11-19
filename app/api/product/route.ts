import { NextResponse } from "next/server";
import { dbGetById, dbUpdate } from "@/service/baseService";
import { connectDB } from "@/lib/db";
import { deleteFile } from "@/Utilities/deleteFile";

// ==========================================
// HÀM GET: Lấy thông tin 1 sản phẩm theo productID
// ==========================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productID = searchParams.get("productID");

    if (!productID) {
      return NextResponse.json(
        { success: false, message: "Thiếu productID!" },
        { status: 400 },
      );
    }

    // Tận dụng dbGetById từ base service (đã tự động camelCase keys)
    const product = await dbGetById("Products", "ProductID", productID);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm!" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("Error fetching product GET:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// ==========================================
// HÀM POST: Thêm mới Order, Products và các bảng liên quan (Dùng MySQL Transaction)
// ==========================================
export async function POST(req: Request) {
  let connection;
  const insertedProductIds: number[] = [];

  try {
    const body = await req.json();
    const { orderID, products } = body;

    if (!orderID) {
      return NextResponse.json(
        { success: false, message: "Miss (OrderID)!" },
        { status: 400 },
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, message: "No data Product" },
        { status: 400 },
      );
    }

    // Lấy connection riêng từ pool để thực hiện Transaction trong MySQL
    const pool = await connectDB();
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Kiểm tra và Insert bảng Orders (Dùng INSERT IGNORE hoặc kiểm tra tồn tại)
    await connection.execute(
      `INSERT IGNORE INTO \`Orders\` (\`OrderID\`) VALUES (?)`,
      [orderID],
    );

    for (const p of products) {
      // 2. Insert vào bảng Products và lấy lại insertId vừa sinh
      const [productResult]: any = await connection.execute(
        `
          INSERT INTO \`Products\` 
          (\`OrderID\`, \`ProductCode\`, \`CustomerCode\`, \`ProductName\`, \`DateCreate\`, \`DateFinished\`, \`Feedback\`, \`Image\`, \`ProductStatus\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderID,
          p.productCode || "",
          p.customerCode || "",
          p.productName || "",
          p.dateCreate || null,
          p.dateFinished || null,
          p.feedback || "",
          p.image || "",
          p.ProductStatus ?? p.productStatus ?? 0,
        ],
      );

      const newProductID = productResult.insertId;

      // 🔥 Đưa ID vừa sinh vào mảng
      insertedProductIds.push(newProductID);

      // 3. Insert Materials
      await connection.execute(
        `INSERT INTO \`Materials\` (\`ProductID\`, \`MaterialType\`) VALUES (?, ?)`,
        [newProductID, p.materialType || ""],
      );

      // 4. Insert GemStones
      await connection.execute(
        `INSERT INTO \`GemStones\` (\`ProductID\`, \`GemType\`) VALUES (?, ?)`,
        [newProductID, p.gemType || ""],
      );
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      message: "Order, product, and all related tables created successfully!",
      productIds: insertedProductIds,
    });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error API Product/Order:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

// ==========================================
// HÀM PUT: Cập nhật thông tin sản phẩm (Dùng dbUpdate siêu gọn)
// ==========================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const productID = body.productID || body.productId;

    if (!productID) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu productID hoặc productId để cập nhật!",
        },
        { status: 400 },
      );
    }

    // Loại bỏ khóa chính ra khỏi data update
    const { productID: _id1, productId: _id2, ...updateData } = body;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "Không có dữ liệu cần cập nhật!" },
        { status: 400 },
      );
    }

    // Gọi trực tiếp dbUpdate từ base service
    await dbUpdate("Products", "ProductID", productID, updateData);

    return NextResponse.json({
      success: true,
      message: "Update product sucess!",
    });
  } catch (error: any) {
    console.error("Error PUT Product API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// ==========================================
// HÀM DELETE: Xóa sản phẩm, dọn order rỗng & Xóa ảnh vật lý (Dùng Transaction)
// ==========================================
export async function DELETE(req: Request) {
  let connection;

  try {
    const { searchParams } = new URL(req.url);
    const productID = searchParams.get("productID");

    if (!productID || isNaN(Number(productID))) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid format!" },
        { status: 400 },
      );
    }

    const pool = await connectDB();
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const idNum = Number(productID);

    // 1. Lấy thông tin OrderID và Image trước khi xóa
    const [rows]: any = await connection.execute(
      `SELECT \`OrderID\`, \`Image\` FROM \`Products\` WHERE \`ProductID\` = ?`,
      [idNum],
    );

    const productData = rows[0];

    if (!productData) {
      await connection.rollback();
      connection.release();
      return NextResponse.json(
        {
          success: false,
          message: "The product to be deleted could not be found!!",
        },
        { status: 404 },
      );
    }

    const orderID = productData.OrderID;
    const imagePath = productData.Image;

    // 2. Xóa các bảng con liên quan
    await connection.execute(
      `DELETE FROM \`Materials\` WHERE \`ProductID\` = ?`,
      [idNum],
    );
    await connection.execute(
      `DELETE FROM \`GemStones\` WHERE \`ProductID\` = ?`,
      [idNum],
    );
    await connection.execute(
      `DELETE FROM \`GemCenters\` WHERE \`ProductID\` = ?`,
      [idNum],
    );

    // 3. Xóa sản phẩm chính
    const [deleteResult]: any = await connection.execute(
      `DELETE FROM \`Products\` WHERE \`ProductID\` = ?`,
      [idNum],
    );

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json(
        {
          success: false,
          message: "The product to be deleted could not be found!!",
        },
        { status: 404 },
      );
    }

    // 4. Xóa Order nếu trống sản phẩm
    if (orderID) {
      await connection.execute(
        `
          DELETE FROM \`Orders\` 
          WHERE \`OrderID\` = ? 
          AND NOT EXISTS (
            SELECT 1 FROM \`Products\` WHERE \`OrderID\` = ?
          )
        `,
        [orderID, orderID],
      );
    }

    await connection.commit();
    connection.release();

    // 5. Xóa file ảnh vật lý trên ổ cứng
    if (imagePath) {
      deleteFile(imagePath);
    }

    return NextResponse.json({
      success: true,
      message: "Delete and clear successfully!",
    });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error DELETE Product API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
