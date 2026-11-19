import mysql from "mysql2/promise";

// Tạo pool kết nối tới Aiven MySQL Cloud
const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql-e47ea6f-khacquitvu99.a.aivencloud.com",
  port: Number(process.env.DB_PORT) || 23590,
  user: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || "defaultdb",
  ssl: {
    rejectUnauthorized: false, // Cho phép kết nối SSL bảo mật lên Aiven Cloud
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,
});

export async function connectDB() {
  try {
    const connection = await pool.getConnection();
    // console.log("Successfully connected to Aiven MySQL Cloud!");
    connection.release(); // Trả kết nối về pool
    return pool;
  } catch (error) {
    console.error("MySQL Server Connection Failed!", error);
    throw error;
  }
}

// Hàm hỗ trợ query nhanh cho Next.js API/Server Actions
export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}
