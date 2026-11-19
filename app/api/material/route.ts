import { NextRequest, NextResponse } from "next/server";
import { dbGetAll, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "Materials";
const ID_FIELD = "ProductID";
const ITEM_ID_FIELD = "MaterialID";

// ==================== GET: Lấy thông tin Material theo ProductID ====================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId =
      searchParams.get("productId") || searchParams.get("productID");

    const allRecords = await dbGetAll(TABLE_NAME, ID_FIELD);
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];
    const record = recordsArray.find(
      (r: any) => Number(r.productID) === Number(productId),
    );

    const formattedMaterial = record
      ? {
          materialID: record.materialID || record.materialid || record.id || 0,
          type: record.materialType || record.materialtype || record.type || "",
          color: record.color || "",
          designWeight: record.designWeight ?? record.designweight ?? 0,
          finishedWeight: record.finishedWeight ?? record.finishedweight ?? 0,
        }
      : {
          materialID: 0,
          type: "",
          color: "",
          designWeight: 0,
          finishedWeight: 0,
        };

    return NextResponse.json({
      success: true,
      material: formattedMaterial,
    });
  } catch (error: any) {
    console.error("❌ [BACKEND] Lỗi GET API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
// ==================== PUT: Cập nhật hoặc Thêm mới ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = body.productId || body.productID;

    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing productId!" },
        { status: 400 },
      );
    }

    const payload = {
      ProductID: Number(productId),
      MaterialType: body.materialType || body.materialtype || body.type || "",
      Color: body.color || "",
      DesignWeight:
        body.designWeight === "" || body.designWeight == null
          ? 0
          : Number(body.designWeight),
      FinishedWeight:
        body.finishedWeight === "" || body.finishedWeight == null
          ? 0
          : Number(body.finishedWeight),
    };

    const allRecords = await dbGetAll(TABLE_NAME, ID_FIELD);
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];
    const existingRecord = recordsArray.find(
      (r: any) => Number(r.productID) === Number(productId),
    );

    if (existingRecord) {
      // Vì dbGetAll đã camelize, khóa chính MaterialID sẽ thành materialid hoặc ta lấy trực tiếp từ object gốc nếu có
      const existingId =
        existingRecord.materialID ||
        existingRecord.materialid ||
        existingRecord.id;

      await dbUpdate(TABLE_NAME, ITEM_ID_FIELD, Number(existingId), {
        MaterialType: payload.MaterialType,
        Color: payload.Color,
        DesignWeight: payload.DesignWeight,
        FinishedWeight: payload.FinishedWeight,
      });
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Material saved successfully!",
    });
  } catch (error: any) {
    console.error("Error PUT Materials API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
