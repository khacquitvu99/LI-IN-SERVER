import { NextRequest, NextResponse } from "next/server";
import { dbGetByField, dbInsert, dbUpdate } from "@/service/baseService";

const TABLE_NAME = "GrillzStyle";
const ID_FIELD = "ProductID";

// ==================== 1. PHƯƠNG THỨC GET ====================
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
      grillz: data ?? [],
    });
  } catch (error: any) {
    console.error("Error GET Grillz API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==================== 2. PHƯƠNG THỨC POST ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, styleName, grillzImage, image } = body;

    const pID = productId || body.productID;

    if (!pID || isNaN(Number(pID))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing productId!" },
        { status: 400 },
      );
    }

    // Xử lý gom mảng ảnh thành chuỗi phân tách bằng dấu phẩy
    const rawImages = grillzImage || image;
    let imageValue = "";
    if (Array.isArray(rawImages)) {
      imageValue = rawImages.join(",");
    } else if (typeof rawImages === "string") {
      imageValue = rawImages;
    }

    const payload = {
      ProductID: Number(pID),
      Quantity: quantity === "" || quantity == null ? 0 : Number(quantity),
      StyleName: styleName || "",
      GrillzImage: imageValue, // Khớp chính xác với cột GrillzImage trong SQL Server
    };

    await dbInsert(TABLE_NAME, payload);

    return NextResponse.json({
      success: true,
      message: "Grillz created successfully!",
    });
  } catch (error: any) {
    console.error("Error POST Grills API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==================== 3. PHƯƠNG THỨC PUT (Xử lý Upsert) ====================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Body nhận được ở API:", body);
    const { productId, quantity, styleName, grillzImage, image } = body;

    const pID = productId || body.productID;

    if (!pID || isNaN(Number(pID))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing productId!" },
        { status: 400 },
      );
    }

    // Xử lý gom mảng ảnh thành chuỗi phân tách bằng dấu phẩy
    const rawImages = grillzImage || image;
    let imageValue = "";
    if (Array.isArray(rawImages)) {
      imageValue = rawImages.join(",");
    } else if (typeof rawImages === "string") {
      imageValue = rawImages;
    }

    const existing = await dbGetByField(TABLE_NAME, ID_FIELD, Number(pID));

    const payload = {
      ProductID: Number(pID),
      Quantity: quantity === "" || quantity == null ? 0 : Number(quantity),
      StyleName: styleName || "",
      GrillzImage: imageValue, // Khớp chính xác với cột GrillzImage trong SQL Server
    };

    if (
      existing &&
      (Array.isArray(existing) ? existing.length > 0 : existing)
    ) {
      await dbUpdate(TABLE_NAME, ID_FIELD, Number(pID), payload);
    } else {
      await dbInsert(TABLE_NAME, payload);
    }

    return NextResponse.json({
      success: true,
      message: "Grillz updated successfully!",
    });
  } catch (error: any) {
    console.error("Error PUT Grillz API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
