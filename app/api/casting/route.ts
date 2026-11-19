import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "Casting";
const ID_FIELD = "ProductID";

// ==================== GET: Lấy dữ liệu Casting theo ProductID ====================
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

    return NextResponse.json({
      success: true,
      casting: data ?? [],
    });
  } catch (error: any) {
    console.error("Error GET Casting API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==================== PUT: Upsert (Thêm hoặc Sửa tự động) ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      employName,
      time,
      receivedWeight,
      finishWeight,
      losstWeight,
      castingIMG
    } = body;

    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing productId!" },
        { status: 400 },
      );
    }

    const existing = await dbGetByField(
      TABLE_NAME,
      ID_FIELD,
      Number(productId),
    );

    const payload = {
      ProductID: Number(productId),
      EmployName: employName || "",
      Time: time ? new Date(time) : new Date(),
      ReceivedWeight:
        receivedWeight == null || receivedWeight === ""
          ? 0
          : Number(receivedWeight),
      FinishWeight:
        finishWeight == null || finishWeight === "" ? 0 : Number(finishWeight),
      LosstWeight:
        losstWeight == null || losstWeight === "" ? 0 : Number(losstWeight),
        castingIMG: castingIMG || null,
    };

    if (existing && existing.length > 0) {
      await dbUpdate(TABLE_NAME, ID_FIELD, Number(productId), payload);
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Casting saved successfully!",
    });
  } catch (error: any) {
    console.error("Error PUT Casting API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
