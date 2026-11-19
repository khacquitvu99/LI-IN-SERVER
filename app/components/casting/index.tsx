"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  sanitizeNumericInput,
  preventNonNumericKeys,
} from "@/service/numberHook";

interface CastingProps {
  data: any;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}

const getMinDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Casting({ data, onChange }: CastingProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  const [loading, setLoading] = useState(false);

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU HOẶC RESET KHI ĐỔI PRODUCT ====================
  useEffect(() => {
    if (!productId) return;

    async function fetchCastingData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/casting?productId=${productId}`);
        const result = await res.json();

        const listData = Array.isArray(result) ? result : result.casting || [];

        if (listData.length > 0) {
          const item = listData[0]; // Lấy bản ghi đầu tiên của sản phẩm

          // Cập nhật state với dữ liệu tìm thấy từ SQL
          onChange({
            productId: productId,
            employName: item.employName || "",
            time: item.time
              ? new Date(item.time).toISOString().slice(0, 16)
              : "",
            receivedWeight:
              item.receivedWeight != null ? Number(item.receivedWeight) : 0,
            finishWeight:
              item.finishWeight != null ? Number(item.finishWeight) : 0,
            losstWeight:
              item.losstWeight != null ? Number(item.losstWeight) : 0,
            castingIMG: item.castingIMG || "",
          });
        } else {
          // 🔥 NẾU SẢN PHẨM KHÔNG CÓ DỮ LIỆU (RỖNG) -> RESET SẠCH VỀ MẶC ĐỊNH
          onChange({
            productId: productId,
            employName: "",
            time: "",
            receivedWeight: 0,
            finishWeight: 0,
            losstWeight: 0,
            castingIMG: "", // Xóa sạch ảnh cũ của sản phẩm trước
          });
        }
      } catch (error) {
        console.error("Error fetching casting data:", error);
        // Khi lỗi kết nối, cũng đồng thời reset form về trắng
        onChange({
          productId: productId,
          employName: "",
          time: "",
          receivedWeight: 0,
          finishWeight: 0,
          losstWeight: 0,
          castingIMG: "",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCastingData();
  }, [productId]);
  //==================================//
  const handleInputChange = (field: string, value: any) => {
    onChange((prev: any) => ({
      ...prev,
      productId: productId || prev.productId,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-3 shadow-lg rounded-2xl p-5">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-amber-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2.5">Employee Name</th>
              <th className="px-3 py-2.5">Time</th>
              <th className="px-3 py-2.5">Received Weight (gr)</th>
              <th className="px-3 py-2.5">Finished Weight (gr)</th>
              <th className="px-3 py-2.5 text-red-800">Loss Weight (gr)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-amber-50/20">
              {/* NAME */}
              <td className="px-2 py-2 w-2/6">
                <input
                  type="text"
                  value={data.employName || ""}
                  onChange={(e) =>
                    handleInputChange("employName", e.target.value)
                  }
                  placeholder="Enter name..."
                  className="w-full px-2 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </td>
              {/* TIME */}
              <td className="px-2 py-2 ">
                <input
                  type="datetime-local"
                  min={getMinDateTimeLocal()}
                  value={data.time || ""}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </td>
              {/* RECEIVED WEIGHT */}
              <td className="px-2 py-2">
                <input
                  type="text"
                  inputMode="decimal"
                  onKeyDown={preventNonNumericKeys}
                  value={data.receivedWeight ?? 0}
                  onChange={(e) => {
                    const sanitized = sanitizeNumericInput(e.target.value, {
                      allowDecimal: true,
                      allowEmpty: true,
                    });
                    handleInputChange(
                      "receivedWeight",
                      sanitized === "" ? 0 : Number(sanitized),
                    );
                  }}
                  placeholder="0.0"
                  className="w-full px-2 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-mono text-right"
                />
              </td>

              {/* FINISHED WEIGHT */}
              <td className="px-2 py-2">
                <input
                  type="text"
                  inputMode="decimal"
                  onKeyDown={preventNonNumericKeys}
                  value={data.finishWeight ?? 0}
                  onChange={(e) => {
                    const sanitized = sanitizeNumericInput(e.target.value, {
                      allowDecimal: true,
                      allowEmpty: true,
                    });
                    handleInputChange(
                      "finishWeight",
                      sanitized === "" ? 0 : Number(sanitized),
                    );
                  }}
                  placeholder="0.0"
                  className="w-full px-2 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-mono text-right"
                />
              </td>

              {/* LOSS WEIGHT */}
              <td className="px-2 py-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={(() => {
                    const received = Number(data.receivedWeight) || 0;
                    const finished = Number(data.finishWeight) || 0;
                    const loss = received - finished;
                    return Number(loss.toFixed(3));
                  })()}
                  readOnly
                  placeholder="0.0"
                  className="w-full px-2 py-1.5 text-sm bg-gray-50 focus:outline-none text-red-600 font-medium font-mono text-right cursor-not-allowed"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
