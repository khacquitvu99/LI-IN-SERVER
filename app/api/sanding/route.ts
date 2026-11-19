import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "Sanding";
const ID_FIELD = "ProductID";

// ==================== GET: Lấy dữ liệu Sanding theo ProductID ====================
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
      sanding: data ?? [],
    });
  } catch (error: any) {
    console.error("Error GET Sanding API:", error);
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
      solderWeight,
      filingDustWeight,
      finishWeight,
      lossWeight,
      sandingIMG,
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
      SolderWeight:
        solderWeight == null || solderWeight === "" ? 0 : Number(solderWeight),
      FilingDustWeight:
        filingDustWeight == null || filingDustWeight === ""
          ? 0
          : Number(filingDustWeight),
      FinishWeight:
        finishWeight == null || finishWeight === "" ? 0 : Number(finishWeight),
      LossWeight:
        lossWeight == null || lossWeight === "" ? 0 : Number(lossWeight),
      SandingIMG: sandingIMG ? sandingIMG : null,
    };

    if (existing && existing.length > 0) {
      await dbUpdate(TABLE_NAME, ID_FIELD, Number(productId), payload);
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Sanding saved successfully!",
    });
  } catch (error: any) {
    console.error("Error PUT Sanding API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
