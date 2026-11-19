import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "Polishing";
const ID_FIELD = "ProductID";

// ==================== GET: Lấy dữ liệu Polishing theo ProductID ====================
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
      polishing: data ?? [],
    });
  } catch (error: any) {
    console.error("Error GET Polishing API:", error);
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
      lossWeight,
      gemLoss,
      polishingIMG,
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

    const received = Number(receivedWeight) || 0;
    const finish = Number(finishWeight) || 0;
    const calculatedLoss =
      received - finish > 0 ? Number((received - finish).toFixed(3)) : 0;

    const payload = {
      ProductID: Number(productId),
      EmployName: employName || "",
      Time: time ? new Date(time) : new Date(),
      ReceivedWeight: received,
      FinishWeight: finish,
      LossWeight:
        lossWeight != null && lossWeight !== ""
          ? Number(lossWeight)
          : calculatedLoss,
      GemLoss: gemLoss != null && gemLoss !== "" ? Number(gemLoss) : 0,
      PolishingIMG: polishingIMG ? polishingIMG : null,
    };

    if (existing && existing.length > 0) {
      await dbUpdate(TABLE_NAME, ID_FIELD, Number(productId), payload);
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Polishing saved successfully!",
    });
  } catch (error: any) {
    console.error("Error PUT Polishing API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
