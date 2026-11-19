"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sanitizeNumericInput } from "@/service/numberHook";

interface SandingProps {
  data: any;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}
// Lay thoi gian hien tai
const getMinDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Sanding({ data, onChange }: SandingProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");
  const [loading, setLoading] = useState(false);

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU HOẶC RESET KHI ĐỔI PRODUCT ====================
  useEffect(() => {
    if (!productId) return;

    async function fetchSandingData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sanding?productId=${productId}`);
        const resData = await res.json();

        const listData = Array.isArray(resData)
          ? resData
          : resData.sanding || [];

        if (listData.length > 0) {
          const item = listData[0];
          // Cập nhật state với dữ liệu tìm thấy từ SQL
          onChange((prev: any) => ({
            ...prev,
            productId: String(item.productID || productId),
            employName: item.employName || "",
            time: item.time
              ? new Date(item.time).toISOString().slice(0, 16)
              : "",
            receivedWeight:
              item.receivedWeight != null ? Number(item.receivedWeight) : 0,
            solderWeight:
              item.solderWeight != null ? Number(item.solderWeight) : 0,
            filingDustWeight:
              item.filingDustWeight != null ? Number(item.filingDustWeight) : 0,
            finishWeight:
              item.finishWeight != null ? Number(item.finishWeight) : 0,
            lossWeight: item.lossWeight != null ? Number(item.lossWeight) : 0,
            sandingIMG: item.sandingIMG || "",
          }));
        } else {
          // 🔥 NẾU SẢN PHẨM KHÔNG CÓ DỮ LIỆU (RỖNG) -> RESET SẠCH VỀ MẶC ĐỊNH
          onChange((prev: any) => ({
            ...prev,
            productId: productId,
            employName: "",
            time: "",
            receivedWeight: 0,
            solderWeight: 0,
            filingDustWeight: 0,
            finishWeight: 0,
            lossWeight: 0,
            sandingIMG: "", // Xóa sạch ảnh cũ của sản phẩm trước
          }));
        }
      } catch (error) {
        console.error("Error fetching sanding data:", error);
        // Khi lỗi kết nối, cũng đồng thời reset form về trắng
        onChange((prev: any) => ({
          ...prev,
          productId: productId,
          employName: "",
          time: "",
          receivedWeight: 0,
          solderWeight: 0,
          filingDustWeight: 0,
          finishWeight: 0,
          lossWeight: 0,
          sandingIMG: "",
        }));
      } finally {
        setLoading(false);
      }
    }

    fetchSandingData();
  }, [productId, onChange]);

  // Handler cập nhật field trực tiếp vào state của trang cha
  const handleChange = (field: string, value: any) => {
    onChange((prev: any) => {
      const updated = { ...prev, [field]: value };

      // Tự động tính toán lại Loss Weight: (Received + Solder) - (FilingDust + Finished)
      if (
        field === "receivedWeight" ||
        field === "solderWeight" ||
        field === "filingDustWeight" ||
        field === "finishWeight"
      ) {
        const rec =
          field === "receivedWeight"
            ? Number(value) || 0
            : Number(updated.receivedWeight) || 0;
        const sol =
          field === "solderWeight"
            ? Number(value) || 0
            : Number(updated.solderWeight) || 0;
        const dust =
          field === "filingDustWeight"
            ? Number(value) || 0
            : Number(updated.filingDustWeight) || 0;
        const fin =
          field === "finishWeight"
            ? Number(value) || 0
            : Number(updated.finishWeight) || 0;

        const calculatedLoss = rec + sol - (dust + fin);
        updated.lossWeight = Number(calculatedLoss.toFixed(3));
      }

      return updated;
    });
  };

  return (
    <div className="space-y-3 shadow-lg rounded-2xl p-5">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <tbody className="divide-y divide-gray-100">
            <React.Fragment>
              {/* DÒNG TR 1: EMPLOYEE NAME & TIME */}
              <tr className="bg-gray-50/70">
                <td className="px-3 py-2.5 w-1/2" colSpan={2}>
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Employee Name
                    </span>
                  </div>
                  <input
                    type="text"
                    value={data?.employName || ""}
                    onChange={(e) => handleChange("employName", e.target.value)}
                    placeholder="enter employee name..."
                    className="w-full px-2.5 py-1.5 text-sm bg-white border-r-2 border-gray-300 rounded-sm focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium"
                  />
                </td>

                <td className="px-3 py-2.5 w-1/2" colSpan={3}>
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Time
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={data?.time || ""}
                    min={getMinDateTimeLocal()}
                    onChange={(e) => handleChange("time", e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm bg-white border-r-2 border-gray-300 rounded focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono"
                  />
                </td>
              </tr>

              {/* DÒNG TR 2: CÁC TRƯỜNG CÂN NẶNG */}
              <tr className="bg-white hover:bg-amber-50/10 border-b-2 border-gray-200">
                {/* Received Weight */}
                <td className="px-2 py-2.5 w-[20%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Received
                      <br />
                      Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data?.receivedWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChange(
                        "receivedWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 border-gray-300 rounded focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                  />
                </td>

                {/* Solder Weight */}
                <td className="px-2 py-2.5 w-[20%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Solder <br />
                      Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data?.solderWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChange(
                        "solderWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 border-gray-300 rounded focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                  />
                </td>

                {/* Filing Dust Weight */}
                <td className="px-2 py-2.5 w-[20%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Filing Dust
                      <br /> Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data?.filingDustWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChange(
                        "filingDustWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 border-gray-300 rounded focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                  />
                </td>

                {/* Finished Weight */}
                <td className="px-2 py-2.5 w-[20%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Finished <br />
                      Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data?.finishWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChange(
                        "finishWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 border-gray-300 rounded focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                  />
                </td>

                {/* Loss Weight */}
                <td className="px-2 py-2.5 w-[20%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-red-800 rounded">
                      Loss <br />
                      Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={data?.lossWeight ?? 0}
                    readOnly
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-gray-50 border-r-2 border-gray-300 rounded-sm focus:outline-none text-red-600 font-medium font-mono text-right cursor-not-allowed"
                  />
                </td>
              </tr>
            </React.Fragment>
          </tbody>
        </table>
      </div>
    </div>
  );
}
