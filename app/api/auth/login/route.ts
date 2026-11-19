import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const pool = await connectDB();

    // Truy vấn kiểm tra Email hoặc Name kết hợp với Password dùng chuẩn MySQL (?)
    const [rows] = await pool.execute(
      `
        SELECT UserID, Name, Email, Role, Avatar, Password 
        FROM \`User\` 
        WHERE (\`Email\` = ? OR \`Name\` = ?) AND \`Password\` = ?
      `,
      [username.trim(), username.trim(), password],
    );

    const users = rows as any[];

    if (users.length > 0) {
      const user = users[0];
      return NextResponse.json({
        success: true,
        user: {
          id: user.UserID,
          name: user.Name,
          email: user.Email,
          role: user.Role,
          avatar: user.Avatar,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "The username or password is incorrect!!" },
        { status: 401 },
      );
    }
  } catch (error: any) {
    console.error("API Login Error!!", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
