import { NextResponse } from "next/server";
import { dbGetByField, dbInsert, dbUpdate } from "@/service/baseService"

// ==========================================
// 1. GET: Lấy thông tin chi phí theo ProductID
// ==========================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productID = searchParams.get("productID") || searchParams.get("productId");

    if (!productID || isNaN(Number(productID))) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid productID!" },
        { status: 400 }
      );
    }

    // Sử dụng base service dbGetByField để lấy dữ liệu (đã tự động camelizeKeys)
    const records = await dbGetByField("ProductCost", "ProductID", Number(productID));

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No cost data found for this product.",
      });
    }

    return NextResponse.json({
      success: true,
      data: records[0], // Trả về bản ghi đầu tiên của sản phẩm đó
    });
  } catch (error: any) {
    console.error("Error GET ProductCost API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST / UPSERT: Thêm mới hoặc Cập nhật chi phí
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      productId,
      productID,
      design3D,
      printing3D,
      casting,
      sanding,
      settingGem,
      polishing,
      plating,
      cpsxChung,
      cpsxSp,
      price,
    } = body;

    const pID = productId || productID;

    if (!pID || isNaN(Number(pID))) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid productID in request body!" },
        { status: 400 }
      );
    }

    // Kiểm tra xem ProductID đã có trong bảng ProductCost chưa bằng dbGetByField
    const existingRecords = await dbGetByField("ProductCost", "ProductID", Number(pID));

    // Chuẩn bị dữ liệu payload để insert hoặc update
    const costData = {
      ProductID: Number(pID),
      Design3D: design3D ?? 0,
      Printing3D: printing3D ?? 0,
      Casting: casting ?? 0,
      Sanding: sanding ?? 0,
      SettingGem: settingGem ?? 0,
      Polishing: polishing ?? 0,
      Plating: plating ?? 0,
      cpsxChung: cpsxChung ?? 0,
      cpsxSp: cpsxSp ?? 0,
      Price: price ?? 0,
    };

    if (existingRecords && existingRecords.length > 0) {
      // ĐÃ TỒN TẠI -> CẬP NHẬT (UPDATE) dựa vào ProductID
      // (Lưu ý: base service dbUpdate nhận vào idField là "ProductID" và idValue là pID)
      await dbUpdate("ProductCost", "ProductID", Number(pID), costData);
    } else {
      // CHƯA TỒN TẠI -> THÊM MỚI (INSERT)
      // (dbInsert tự động bỏ qua trường 'id' nếu có, nên rất an toàn)
      await dbInsert("ProductCost", costData);
    }

    return NextResponse.json({
      success: true,
      message: "Product cost saved successfully!",
    });
  } catch (error: any) {
    console.error("Error saving ProductCost API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}