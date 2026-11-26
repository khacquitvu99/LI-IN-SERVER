import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    const pool = await connectDB();
    const [rows]: any = await pool.execute(
      `SELECT * FROM \`Products\` ORDER BY \`ProductID\` DESC`,
    );

    return NextResponse.json({
      success: true,
      products: rows || [],
    });
  } catch (error: any) {
    console.error("Error fetching product list GET:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}