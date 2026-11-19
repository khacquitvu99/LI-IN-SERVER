import { NextResponse } from "next/server";
import { dbGetAll, dbInsert, checkUserDuplicate } from "@/service/baseService";

const getIdField = (table: string) => {
  const lowerTable = table.toLowerCase();
  if (lowerTable === "user") return "UserID";
  if (lowerTable === "product") return "ProductID";
  return "ID";
};

export async function GET(
  request: Request,
  context: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await context.params;
    const idField = getIdField(table);
    const data = await dbGetAll(table, idField);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Lỗi GET API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ table: string }> },
) {
  try {
    const { table } = await context.params;
    const body = await request.json();

    // Nếu bảng là User, tiến hành check trùng Email hoặc Name
    if (table.toLowerCase() === "user") {
      const isDuplicate = await checkUserDuplicate(
        table,
        body.Email,
        body.Name,
      );
      if (isDuplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tên tài khoản (Name) hoặc Email đã tồn tại trong hệ thống!",
          },
          { status: 400 },
        );
      }
    }

    await dbInsert(table, body);
    return NextResponse.json({ success: true, message: "Thêm thành công!" });
  } catch (error: any) {
    console.error("Lỗi POST API:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
