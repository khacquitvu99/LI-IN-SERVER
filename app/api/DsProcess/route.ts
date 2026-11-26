import { NextRequest, NextResponse } from "next/server";
import { dbGetAll, dbInsert, dbUpdate } from "@/service/baseService";

const TABLE_NAME = "DsProcessing"; // Tên bảng trong cơ sở dữ liệu SQL Server
const ID_FIELD = "ProcessingID"; // Khóa chính của bảng

function normalizeFieldList(raw: any): string {
  if (!raw) return "";
  if (Array.isArray(raw)) {
    return raw
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .join(",");
  }
  return String(raw).trim();
}

// ==================== GET: Lấy danh sách tiến độ theo productID ====================
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

    const allRecords = await dbGetAll(TABLE_NAME, ID_FIELD);
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];

    // Lọc các bản ghi thuộc về productID này (chấp nhận cả productid, ProductID,...)
    const filteredRecords = recordsArray.filter(
      (r: any) =>
        Number(r.productID || r.ProductID || r.productId) === Number(productId),
    );

    // Chuẩn hóa dữ liệu trả về cho frontend
    const formattedData = filteredRecords.map((record: any) => {
      const renderImg =
        record.RenderIMG || record.renderIMG || record.renderImg || "";
      const gemPosition =
        record.GemPosition ||
        record.gemPosition ||
        record.GemPositon ||
        record.gemPositon ||
        "";
      const processImage =
        record.ProcessImage ||
        record.processImage ||
        record.DesignIMG ||
        record.designIMG ||
        record.image ||
        record.productImage ||
        "";

      return {
        processingID:
          record.processingID || record.ProcessingID || record.id || 0,
        productID: Number(productId),
        designer: record.designer || record.Designer || "",
        completedAt: record.completedAt || record.CompletedAt || "",
        image: processImage,
        processImage,
        renderIMG: renderImg,
        gemPosition,
      };
    });

    return NextResponse.json({
      success: true,
      DsProcessing: formattedData,
    });
  } catch (error: any) {
    console.error("❌ Error GET DsProcess API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ===== PUT/POST: Thêm hoặc Cập nhật tiến độ 3D (Hỗ trợ lưu Image)
async function handleSaveProcessing(request: NextRequest) {
  try {
    const body = await request.json();
    const { productID, productId, items, dsprogress } = body;
    const pID = productID || productId;

    if (!pID) {
      return NextResponse.json(
        { success: false, error: "Missing productID for update!" },
        { status: 400 },
      );
    }

    const listToProcess =
      items || dsprogress || (Array.isArray(body) ? body : [body]);

    // 🌟 Nếu không có dữ liệu hoặc danh sách rỗng thì trả về thành công luôn, không báo lỗi
    if (!listToProcess || listToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes to save.",
      });
    }

    const allRecords = await dbGetAll(TABLE_NAME, ID_FIELD);
    const recordsArray = Array.isArray(allRecords) ? allRecords : [allRecords];

    for (const item of listToProcess) {
      if (!item) continue;

      const rawImage =
        item.processImage !== undefined
          ? item.processImage
          : item.image !== undefined
            ? item.image
            : item.designIMG !== undefined
              ? item.designIMG
              : item.DesignIMG;

      const rawRender =
        item.renderIMG !== undefined ? item.renderIMG : item.RenderIMG;

      const rawGemPos =
        item.gemPosition !== undefined
          ? item.gemPosition
          : item.GemPosition !== undefined
            ? item.GemPosition
            : item.GemPositon;

      // 🌟 Nếu item hoàn toàn trống thì bỏ qua không xử lý
      if (
        !item.designer &&
        !item.completedAt &&
        !rawImage &&
        !rawRender &&
        !rawGemPos
      ) {
        continue;
      }

      const procID = item.processingID || item.ProcessingID || item.id;

      const imageValue = normalizeFieldList(rawImage);
      const renderValue = normalizeFieldList(rawRender);
      const gemPositionValue = normalizeFieldList(rawGemPos);

      const dataPayload: any = {
        ProductID: Number(pID),
        Designer: item.designer ?? item.Designer ?? "",
        CompletedAt:
          item.completedAt || item.CompletedAt
            ? new Date(item.completedAt || item.CompletedAt)
            : null,
        ProcessImage: imageValue,
        RenderIMG: renderValue,
        GemPosition: gemPositionValue,
      };

      let targetProcID = procID;
      if (!targetProcID || Number(targetProcID) <= 0) {
        const existingRecord = recordsArray.find(
          (r: any) => Number(r.productID || r.ProductID) === Number(pID),
        );
        if (existingRecord) {
          targetProcID =
            existingRecord.processingID ||
            existingRecord.ProcessingID ||
            existingRecord.id;
        }
      }

      if (
        targetProcID &&
        Number(targetProcID) > 0 &&
        Number(targetProcID) < 1000000000
      ) {
        await dbUpdate(TABLE_NAME, ID_FIELD, Number(targetProcID), dataPayload);
      } else {
        await dbInsert(TABLE_NAME, dataPayload);
      }
    }

    return NextResponse.json({
      success: true,
      message: "DsProcessing and Images saved successfully!",
    });
  } catch (error: any) {
    console.error("❌ Error saving DsProcess API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  return handleSaveProcessing(request);
}

export async function POST(request: NextRequest) {
  return handleSaveProcessing(request);
}
