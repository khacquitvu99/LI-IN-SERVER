import { NextResponse } from "next/server";
import {
  dbGetAll,
  dbInsert,
  dbUpdate,
  dbGetById,
  dbDelete,
} from "@/service/baseService";

// DELETE: Xóa FILE (document,img,..)
import { deleteFile } from "@/Utilities/deleteFile";

// Khai báo hằng số dùng chung cho toàn bộ API này
const TABLE_NAME = "User"; // Tên bảng trong SQL Server
const ID_FIELD = "UserId"; // Cột khóa chính
// 1. GET: Lấy danh sách
export async function GET() {
  try {
    const data = await dbGetAll(TABLE_NAME, ID_FIELD);
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch data!" },
      { status: 500 },
    );
  }
}

// 2. POST: Thêm mới (INSERT)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputEmail = body.email?.trim().toLowerCase() || "";

    // 1. Lấy toàn bộ danh sách user hiện tại từ CSDL
    const existingUsers = await dbGetAll(TABLE_NAME, ID_FIELD);

    // 2. Kiểm tra xem email đã tồn tại chưa (Hỗ trợ bắt mọi trường hợp tên cột: email, Email, EMAIL)
    const isEmailExist = existingUsers.some((user: any) => {
      // Tự động tìm key nào trong object chứa chữ 'email' (không phân biệt hoa thường)
      const emailKey = Object.keys(user).find(
        (key) => key.toLowerCase() === "email",
      );
      const dbEmail = emailKey ? user[emailKey]?.trim().toLowerCase() : "";

      return dbEmail === inputEmail;
    });

    if (isEmailExist) {
      console.log("⚠️ Phát hiện trùng email, từ chối thêm mới!");
      return NextResponse.json(
        {
          success: false,
          message: "Email này đã được sử dụng bởi tài khoản khác!",
        },
        { status: 400 },
      );
    }

    // 3. Nếu chưa tồn tại thì tiến hành thêm mới bình thường
    await dbInsert(TABLE_NAME, body);

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
    });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create account!" },
      { status: 500 },
    );
  }
}

// 3. PUT: Cập nhật (UPDATE)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, password, role, avatar } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Account ID is required!" },
        { status: 400 },
      );
    }

    // 1. Lấy thông tin bản ghi cũ TRƯỚC KHI CẬP NHẬT để tìm đường dẫn ảnh cũ
    const oldUser = await dbGetById(TABLE_NAME, ID_FIELD, id);

    // 2. Gom dữ liệu cần update vào object và lưu vào CSDL
    const updateData = { name, email, password, role, avatar };
    await dbUpdate(TABLE_NAME, ID_FIELD, id, updateData);

    // 3. Kiểm tra và xóa file ảnh cũ nếu có thay đổi ảnh mới
    if (oldUser) {
      // Tự động tìm cột chứa ảnh (không phân biệt hoa thường: avatar, image,...)
      const imageKey = Object.keys(oldUser).find(
        (key) =>
          key.toLowerCase().includes("avatar") ||
          key.toLowerCase().includes("image"),
      );
      const oldAvatarPath = imageKey ? oldUser[imageKey] : null;

      // Nếu tồn tại ảnh cũ và ảnh cũ khác với ảnh mới -> Xóa file ảnh cũ trong ổ D:
      if (oldAvatarPath && oldAvatarPath !== avatar) {
        deleteFile(oldAvatarPath);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account updated successfully!",
    });
  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update account!" },
      { status: 500 },
    );
  }
}

// 4. DELETE: xoa (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Lấy id từ param "id" (vì client thường gọi API dạng /api/users?id=123)
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID not empty!!" },
        { status: 400 },
      );
    }

    // 1. Lấy thông tin bản ghi trước để có đường dẫn ảnh
    const product = await dbGetById(TABLE_NAME, ID_FIELD, id);

    // 2. Xóa dữ liệu trong CSDL
    await dbDelete(TABLE_NAME, ID_FIELD, id);

    // 3. Xóa ảnh vật lý (Đảm bảo đúng tên cột avatar / image trong SQL của Qui)
    if (product) {
      deleteFile(product.Avatar);
    }

    return NextResponse.json({
      success: true,
      message: "Delete USER Successfully!!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Error delete USER!!" },
      { status: 500 },
    );
  }
}
