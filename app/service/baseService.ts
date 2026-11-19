import { connectDB } from "@/lib/db";

// 1. Lấy tất cả dữ liệu
export async function dbGetAll(tableName: string, idField: string) {
  const pool = await connectDB();
  const [rows] = await pool.execute(`
    SELECT * FROM \`${tableName}\` ORDER BY \`${idField}\` DESC
  `);

  return camelizeKeys(rows);
}

// 2. Thêm mới (INSERT)
export async function dbInsert(tableName: string, data: Record<string, any>) {
  const pool = await connectDB();

  // Lọc bỏ trường 'id' ra khỏi dữ liệu chuẩn bị insert (nếu có)
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== "id"),
  );

  const keys = Object.keys(filteredData);
  const values = Object.values(filteredData);

  if (keys.length === 0) return;

  const columns = keys.map((k) => `\`${k}\``).join(", ");
  const placeholders = keys.map(() => "?").join(", ");

  const query = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`;
  await pool.execute(query, values);
}

// 3. Cập nhật (UPDATE) với tham số idField chính xác
export async function dbUpdate(
  tableName: string,
  idField: string,
  idValue: any,
  data: Record<string, any>,
) {
  const pool = await connectDB();
  const keys = Object.keys(data);
  const values = Object.values(data);

  if (keys.length === 0) return { success: true };

  const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
  const query = `UPDATE \`${tableName}\` SET ${setClause} WHERE \`${idField}\` = ?`;

  // Gộp giá trị các cột cần update và giá trị idValue ở cuối mảng params
  await pool.execute(query, [...values, idValue]);
  return { success: true };
}

// 4. Xóa (DELETE) với tham số idField chính xác
export async function dbDelete(
  tableName: string,
  idField: string,
  idValue: any,
) {
  const pool = await connectDB();
  const query = `DELETE FROM \`${tableName}\` WHERE \`${idField}\` = ?`;
  await pool.execute(query, [idValue]);
  return { success: true };
}

// 5. Kiểm tra tài khoản tồn tại
export async function checkUserDuplicate(
  tableName: string,
  email: string,
  name: string,
  excludeIdField?: string,
  excludeIdValue?: any,
) {
  const pool = await connectDB();
  let query = `SELECT * FROM \`${tableName}\` WHERE \`Email\` = ? OR \`Name\` = ?`;
  const params: any[] = [email, name];

  // Nếu là cập nhật (Update), loại trừ chính ID đang sửa ra khỏi điều kiện check trùng
  if (excludeIdField && excludeIdValue !== undefined) {
    query += ` AND \`${excludeIdField}\` <> ?`;
    params.push(excludeIdValue);
  }

  const [rows] = await pool.execute(query, params);
  return (rows as any[]).length > 0;
}

// 6. Lấy dữ liệu từ MySQL theo ID
export async function dbGetById(
  tableName: string,
  idField: string,
  idValue: any,
) {
  const pool = await connectDB();
  const query = `SELECT * FROM \`${tableName}\` WHERE \`${idField}\` = ?`;
  const [rows] = await pool.execute(query, [idValue]);

  const data = (rows as any[])[0] || null;

  return data ? camelizeKeys(data) : null;
}

// 7. Lấy dữ liệu theo một trường bất kỳ (vd: ProductID)
export async function dbGetByField(
  tableName: string,
  fieldName: string,
  value: any,
) {
  const pool = await connectDB();
  const query = `SELECT * FROM \`${tableName}\` WHERE \`${fieldName}\` = ?`;
  const [rows] = await pool.execute(query, [value]);

  return camelizeKeys(rows);
}

// 8. Hàm tìm kiếm linh hoạt dùng LIKE
export async function dbSearchByField(
  tableName: string,
  idField: string,
  fieldName: string,
  keyword: string,
) {
  const pool = await connectDB();
  const query = `SELECT * FROM \`${tableName}\` WHERE \`${fieldName}\` LIKE ? ORDER BY \`${idField}\` DESC`;
  const [rows] = await pool.execute(query, [`${keyword}%`]);

  return camelizeKeys(rows);
}

// 9. Hàm tự động đổi key từ PascalCase / snake_case sang camelCase (JS/TS)
function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelizeKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = camelizeKeys(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}
