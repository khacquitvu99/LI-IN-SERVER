import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "Sanding";
const ID_FIELD = "ProductID";

function normalizeSandingImg(rawImg: unknown): string | null {
  if (!rawImg) return null;

  const list = Array.isArray(rawImg) ? rawImg : String(rawImg).split(",");

  const cleaned = list.map((item) => String(item).trim()).filter(Boolean);

  return cleaned.length > 0 ? cleaned.join(",") : null;
}

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

    const numericProductId = Number(productId);
    const existing = await dbGetByField(TABLE_NAME, ID_FIELD, numericProductId);

    const payload = {
      ProductID: numericProductId,
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
      SandingIMG: normalizeSandingImg(sandingIMG),
    };

    if (existing && existing.length > 0) {
      await dbUpdate(TABLE_NAME, ID_FIELD, numericProductId, payload);
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Sanding saved successfully!",
      sandingIMG: payload.SandingIMG,
    });
  } catch (error: any) {
    console.error("Error PUT Sanding API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
