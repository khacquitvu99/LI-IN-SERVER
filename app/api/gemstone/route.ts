import { NextRequest, NextResponse } from "next/server";
import { dbGetAll, dbInsert, dbUpdate, dbDelete } from "@/service/baseService";

const TABLE_NAME = "GemStones";
const ID_FIELD = "GemStoneID";

// ==================== GET: LẤY DANH SÁCH GEMSTONES ====================
export async function GET(request: NextRequest) {
  try {
    const productID = request.nextUrl.searchParams.get("productID");

    if (!productID || isNaN(Number(productID))) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid productID!" },
        { status: 400 },
      );
    }

    const allRecords = await dbGetAll(TABLE_NAME, ID_FIELD);
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];

    // Lọc chính xác theo productID
    const filtered = recordsArray.filter(
      (r: any) => Number(r.productID) === Number(productID),
    );

    // Map chuẩn 1 chiều, không rườm rà
    const gemstones = filtered.map((r: any) => ({
      gemStoneID: r.gemStoneID,
      productID: r.productID,
      gemType: r.gemType,
      shape: r.shape,
      size: r.size,
      weight: r.weight,
      quantity: r.quantity,
      color: r.color,
    }));

    return NextResponse.json({ success: true, gemstone: gemstones });
  } catch (error: any) {
    console.error("❌ Error GET GemStone API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==================== PUT: ĐỒNG BỘ (INSERT, UPDATE, DELETE) ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productID, gemstones } = body;

    if (!productID || !Array.isArray(gemstones)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload or missing productID!" },
        { status: 400 },
      );
    }

    const pID = Number(productID);

    // 1. Lấy danh sách hiện tại trong DB để đối chiếu xóa
    const allRecords = await dbGetAll(TABLE_NAME, ID_FIELD);
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];
    const existingRecords = recordsArray.filter(
      (r: any) => Number(r.productID) === pID,
    );

    // Danh sách ID thực từ client gửi lên
    const clientIds = gemstones
      .map((item: any) => Number(item.gemStoneID))
      .filter((id: number) => id > 0);

    // 2. DELETE: Xóa các bản ghi không còn tồn tại trên client
    for (const oldRec of existingRecords) {
      const oldId = Number(oldRec.gemStoneID);
      if (oldId > 0 && !clientIds.includes(oldId)) {
        await dbDelete(TABLE_NAME, ID_FIELD, oldId);
      }
    }

    // 3. INSERT & UPDATE: Xử lý danh sách gửi lên
    for (const item of gemstones) {
      const gemStoneID = Number(item.gemStoneID);

      const dataPayload = {
        ProductID: pID,
        GemType: item.gemType || "",
        Shape: item.shape || "",
        Size: item.size || "",
        Weight: Number(item.weight) || 0,
        Quantity: Number(item.quantity) || 1,
        Color: item.color || "White",
      };

      if (gemStoneID > 0) {
        // Cập nhật bản ghi cũ
        await dbUpdate(TABLE_NAME, ID_FIELD, gemStoneID, dataPayload);
      } else {
        // Thêm mới bản ghi
        await dbInsert(TABLE_NAME, dataPayload);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Gemstones synchronized successfully!",
    });
  } catch (error: any) {
    console.error("❌ Error syncing GemStones API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing ID for deletion!" },
        { status: 400 },
      );
    }

    const gemStoneID = Number(id);
    if (gemStoneID <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid GemStoneID!" },
        { status: 400 },
      );
    }

    // Thực hiện xóa bản ghi trong SQL Server bằng baseService
    await dbDelete(TABLE_NAME, ID_FIELD, gemStoneID);

    return NextResponse.json({
      success: true,
      message: `Gemstone with ID ${gemStoneID} deleted successfully!`,
    });
  } catch (error: any) {
    console.error("❌ Error DELETE Gemstone API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
