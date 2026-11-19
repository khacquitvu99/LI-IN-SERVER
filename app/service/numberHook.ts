import React from "react";

/**
 * Chặn phím -, +, e, E nhưng CHO PHÉP phím dấu chấm (.) và phím xóa (Backspace)
 */
export const preventNonNumericKeys = (
  e: React.KeyboardEvent<HTMLInputElement>
) => {
  // Cho phép phím số, Backspace, Delete, Tab, Arrow keys, và dấu chấm "."
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

interface SanitizeOptions {
  allowDecimal?: boolean;
  allowEmpty?: boolean;
}

//Chuẩn hóa chuỗi số mà không làm mất dấu chấm đang gõ dở//
export const sanitizeNumericInput = (
  rawVal: string,
  options: SanitizeOptions = {}
): string => {
  const { allowDecimal = true, allowEmpty = true } = options;

  if (rawVal === "") return allowEmpty ? "" : "0";

  // Nếu không cho phép số thập phân: Xóa sạch dấu chấm và các ký tự không phải số
  if (!allowDecimal) {
    const cleanInt = rawVal.replace(/\D/g, "");
    if (cleanInt === "") return allowEmpty ? "" : "0";
    return String(parseInt(cleanInt, 10));
  }

  // Nếu cho phép số thập phân:
  // 1. Chỉ giữ lại số và tối đa 1 dấu chấm
  let cleaned = rawVal.replace(/[^0-9.]/g, "");
  
  // Xử lý nếu người dùng gõ nhiều dấu chấm (chỉ lấy dấu chấm đầu tiên)
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  // 2. Nếu người dùng đang gõ dở dấu chấm ở cuối (VD: "12." hoặc "0.") -> Giữ nguyên để gõ tiếp
  if (cleaned.endsWith(".")) {
    return cleaned;
  }

  // 3. Xóa các số 0 thừa ở đầu (VD: "005" -> "5", "05.2" -> "5.2"), ngoại trừ "0" hoặc "0.x"
  if (cleaned.length > 1 && cleaned.startsWith("0") && !cleaned.startsWith("0.")) {
    cleaned = cleaned.replace(/^0+/, "");
    if (cleaned === "" || cleaned.startsWith(".")) {
      cleaned = "0" + cleaned;
    }
  }

  return cleaned;
};