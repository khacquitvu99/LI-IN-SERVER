import { NextResponse } from "next/server";
import {
  dbUpdate,
  dbDelete,
  checkUserDuplicate,
  dbGetById,
} from "@/service/baseService";
import { deleteFile } from "@/Utilities/deleteFile";

// Hàm ánh xạ tên cột khóa chính chuẩn theo từng bảng trong SQL
const getIdField = (table: string) => {
  const lowerTable = table.toLowerCase();
  if (lowerTable === "user") return "UserID";
  if (lowerTable === "product") return "ProductID";
  return "ID"; // Mặc định cho các bảng khác
};

// PUT: Cập nhật bản ghi
export async function PUT(
  request: Request,
  context: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table, id } = await context.params;
    const body = await request.json();
    const idField = getIdField(table);

    // Nếu bảng là User, kiểm tra trùng lặp nhưng loại trừ ID hiện tại ra
    if (table.toLowerCase() === "user") {
      const isDuplicate = await checkUserDuplicate(
        table,
        body.Email,
        body.Name,
        idField,
        id,
      );
      if (isDuplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This username or email is already in use by another user!",
          },
          { status: 400 },
        );
      }
    }

    await dbUpdate(table, idField, id, body);
    return NextResponse.json({
      success: true,
      message: "Update Successfully!!",
    });
  } catch (error: any) {
    console.error("Error PUT API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE: Xóa bản ghi
export async function DELETE(
  request: Request,
  context: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table, id } = await context.params;
    const idField = getIdField(table); // Lấy chính xác tên cột (VD: UserID)

    // 1. Lấy thông tin bản ghi trước khi xóa để lấy đường dẫn ảnh (Avatar / Image)
    const record = await dbGetById(table, idField, id);

    // 2. Thực hiện xóa dữ liệu trong CSDL
    await dbDelete(table, idField, id);

    // 3. Nếu tìm thấy bản ghi và có chứa cột ảnh, tiến hành xóa file vật lý trên server
    if (record) {
      const imageKey = Object.keys(record).find(
        (key) =>
          key.toLowerCase().includes("avatar") ||
          key.toLowerCase().includes("image"),
      );
      const imagePath = imageKey ? record[imageKey] : null;

      if (imagePath) {
        deleteFile(imagePath);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Xóa thành công và đã xóa file ảnh!",
    });
  } catch (error: any) {
    console.error("Lỗi DELETE API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
