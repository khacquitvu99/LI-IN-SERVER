import { Gem_PRICE_MATRIX } from "@/lib/costGemType";
import { GemItem } from "@/types";

/**
 * Hàm xử lý gọi API, lọc và gom nhóm dữ liệu theo Shape và GemType,
 * đồng thời tính tổng quantity và tra cứu cost từ Gem_PRICE_MATRIX.
 */
export async function fetchAndAggregateGemstones(pID: number | string) {
  if (!pID) return [];

  try {
    const response = await fetch(`/api/gemstone?productID=${pID}`);
    const result = await response.json();
    const rawData = result.gemstone || result.data;

    if (!result.success || !Array.isArray(rawData)) {
      return [];
    }

    // 1. Các shape cố định theo UI thiết kế: Round, Baguette, Fancy, Color
    const defaultShapes = ["Round", "Baguette", "Fancy", "Color"];

    // Khởi tạo sẵn cấu trúc map cho các shape mặc định để bảng luôn hiển thị đầy đủ các dòng
    const aggregatedMap: {
      [key: string]: {
        shape: string;
        type: string;
        totalQty: number;
        cost: number;
      };
    } = {};

    defaultShapes.forEach((shapeName) => {
      aggregatedMap[shapeName] = {
        shape: shapeName,
        type: "",
        totalQty: 0,
        cost: 0,
      };
    });

    // 2. Duyệt qua dữ liệu thô từ SQL trả về để cộng dồn quantity và lấy type tương ứng
    rawData.forEach((item: GemItem) => {
      const shape = item.shape || "";
      const qty = Number(item.quantity) || 0;
      const type = item.gemType || "";

      // Nếu shape phát sinh ngoài danh sách mặc định, tự động thêm mới vào map
      if (!aggregatedMap[shape]) {
        aggregatedMap[shape] = {
          shape: shape,
          type: type,
          totalQty: 0,
          cost: 0,
        };
      }

      // Cộng dồn số lượng Quantity theo Shape
      aggregatedMap[shape].totalQty += qty;
      if (type) {
        aggregatedMap[shape].type = type; // Cập nhật lại gemType mới nhất hoặc tương ứng
      }
    });

    // 3. Tính toán cost dựa trên cấu trúc 2 tầng của Gem_PRICE_MATRIX[GemType][GemShape]
    const finalResult = Object.values(aggregatedMap).map((row) => {
      const typeKey = row.type as keyof typeof Gem_PRICE_MATRIX;
      const shapeKey =
        row.shape as keyof (typeof Gem_PRICE_MATRIX)[keyof typeof Gem_PRICE_MATRIX];

      let unitCost = 0;
      // Kiểm tra an toàn trước khi truy xuất ma trận giá 2 tầng
      if (
        typeKey &&
        Gem_PRICE_MATRIX[typeKey] &&
        Gem_PRICE_MATRIX[typeKey][shapeKey] !== undefined
      ) {
        unitCost = Gem_PRICE_MATRIX[typeKey][shapeKey];
      }

      return {
        ...row,
        cost: unitCost * row.totalQty, // Tổng cost = đơn giá * tổng số lượng
      };
    });

    return finalResult;
  } catch (error) {
    console.error("❌ Error processing gemstone counting:", error);
    return [];
  }
}
