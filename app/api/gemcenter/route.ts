import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "GemCenters"; // hoặc tên bảng tương ứng
const ID_FIELD = "ProductID";
const ITEM_ID_FIELD = "GemCenterID"; // Khóa chính của bảng

// ==================== GET: Trả về OBJECT thuần (Không bọc mảng) ====================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId =
      searchParams.get("productId") || searchParams.get("productID");

    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing productId!" },
        { status: 400 },
      );
    }

    const data = await dbGetByField(TABLE_NAME, ID_FIELD, Number(productId));

    // Nếu DB trả về mảng, lấy phần tử đầu tiên [0], nếu không có thì trả về object rỗng {}
    const record = Array.isArray(data) ? data[0] || {} : data || {};

    return NextResponse.json({
      success: true,
      data: record, // Trả về dạng object đơn thuần túy { ... }
    });
  } catch (error: any) {
    console.error("Error GET API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==================== PUT: Nhận Object thuần và Upsert vào DB ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const productId = body.productId || body.ProductID;

    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing productId!" },
        { status: 400 },
      );
    }

    // Payload chuẩn dữ liệu
    const payload = {
      ProductID: Number(productId),
      Shape: body.shape || "",
      Type: body.type || "",
      Size: body.size || "",
      Cost: body.cost === "" || body.cost == null ? 0 : Number(body.cost),
    };

    // 1. Tìm xem bảng GemCenter đã có dòng nào của ProductID này chưa
    const existingRecords = await dbGetByField(
      TABLE_NAME,
      "ProductID",
      Number(productId),
    );
    const existingRecord = Array.isArray(existingRecords)
      ? existingRecords[0]
      : existingRecords;

    if (existingRecord) {
      // Tự động tìm khóa chính bất kể database trả về chữ hoa hay chữ thường
      const keys = Object.keys(existingRecord);
      const pkKey = keys.find(
        (k) => k.toLowerCase() === "gemcenterid" || k.toLowerCase() === "id",
      );
      const existingId = pkKey
        ? existingRecord[pkKey]
        : existingRecord.id;
     
      if (!existingId) {
        throw new Error("Không tìm thấy ID bản ghi để update!");
      }

      // Thực hiện update với đúng tên cột khóa chính thực tế trong DB (ví dụ: pkKey || "GemCenterID")
      await dbUpdate(TABLE_NAME, pkKey || "GemCenterID", Number(existingId), {
        Shape: payload.Shape,
        Type: payload.Type,
        Size: payload.Size,
        Cost: payload.Cost,
      });
    } else {
      // Chưa có thì Insert mới
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Saved to SQL successfully!",
    });
  } catch (error: any) {
    console.error("❌ LỖI CHI TIẾT TẠI BACKEND PUT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
