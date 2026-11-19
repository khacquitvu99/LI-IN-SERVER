import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbUpdate, dbInsert } from "@/service/baseService";

const TABLE_NAME = "Plating";
const ID_FIELD = "ProductID";

// ============= GET: Lấy dữ liệu Plating theo ProductID =================
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
      plating: data ?? [],
    });
  } catch (error: any) {
    console.error("Error GET Plating API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ============= PUT: Upsert (Thêm hoặc Sửa tự động theo ProductID) ============
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, employName, time, platingIMG } = body;

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
      PlatingIMG: platingIMG || "",
    };

    if (existing && existing.length > 0) {
      await dbUpdate(TABLE_NAME, ID_FIELD, Number(productId), payload);
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Plating saved successfully!",
    });
  } catch (error: any) {
    console.error("Error PUT Plating API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
