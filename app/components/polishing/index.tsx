"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { sanitizeNumericInput } from "@/service/numberHook";

interface PolishingProps {
  data: any;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}
//lay thoi gian hien tai
const getMinDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Polishing({ data, onChange }: PolishingProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  const [loading, setLoading] = useState(false);

  // ============== TỰ ĐỘNG LOAD DỮ LIỆU TỪ SQL QUA API ===========
  useEffect(() => {
    if (!productId) return;

    async function fetchPolishingData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/polishing?productId=${productId}`);
        const resData = await res.json();

        const listData = Array.isArray(resData)
          ? resData
          : resData.polishing || [];

        if (listData.length > 0) {
          const item = listData[0];
          onChange((prev: any) => ({
            ...prev,
            productId: String(item.productID || productId),
            employName: item.employName || "",
            time: item.time
              ? new Date(item.time).toISOString().slice(0, 16)
              : "",
            receivedWeight:
              item.receivedWeight != null ? Number(item.receivedWeight) : 0,
            finishWeight:
              item.finishWeight != null ? Number(item.finishWeight) : 0,
            lossWeight: item.lossWeight != null ? Number(item.lossWeight) : 0,
            filingDustWeight:
              item.filingDustWeight != null ? Number(item.filingDustWeight) : 0,
            polishingIMG: item.polishingIMG || "",
          }));
        } else {
          // Chưa có dữ liệu -> Reset form nhưng giữ lại productId để cho phép Insert mới
          onChange((prev: any) => ({
            ...prev,
            productId: String(productId),
            employName: "",
            time: "",
            receivedWeight: 0,
            finishWeight: 0,
            lossWeight: 0,
            filingDustWeight: 0,
            polishingIMG: "",
          }));
        }
      } catch (error) {
        console.error("Error fetching polishing data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPolishingData();
  }, [productId, onChange]);

  // Handlers thay đổi giá trị input
  const handleChangeField = (field: string, value: any) => {
    onChange((prev: any) => {
      const updated = { ...prev, [field]: value };

      // Luôn cập nhật và tính toán lại lossWeight dựa trên giá trị hiện tại của received và finish
      const rec = Number(updated.receivedWeight) || 0;
      const fin = Number(updated.finishWeight) || 0;

      const loss = rec - fin;
      updated.lossWeight = loss > 0 ? Number(loss.toFixed(3)) : 0;

      return updated;
    });
  };

  return (
    <>
      <div className="space-y-3 shadow-lg p-5 rounded-2xl">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-600">
            <tbody className="divide-y divide-gray-200">
              {/* DÒNG TR 1: EMPLOYEE NAME & TIME */}
              <tr className="bg-gray-50/70">
                {/* NAME */}
                <td className="px-3 py-2.5 w-1/2" colSpan={2}>
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Employee Name
                    </span>
                  </div>
                  <input
                    type="text"
                    value={data.employName || ""}
                    onChange={(e) =>
                      handleChangeField("employName", e.target.value)
                    }
                    placeholder="Enter employee name..."
                    className="w-full px-2.5 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium"
                  />
                </td>
                {/* TIME */}
                <td className="px-3 py-2.5 w-1/2" colSpan={2}>
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900">
                      Time
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={data.time || ""}
                    min={getMinDateTimeLocal()}
                    onChange={(e) => handleChangeField("time", e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono"
                  />
                </td>
              </tr>

              {/* DÒNG TR 2: CÁC TRƯỜNG CÂN NẶNG & GEM LOSS */}
              <tr className="bg-white hover:bg-amber-50/10 border-b-2 border-gray-200">
                {/* Received Weight */}
                <td className="px-2 py-2.5 w-[25%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-amber-900 truncate max-w-full">
                      Received Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data.receivedWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChangeField(
                        "receivedWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                  />
                </td>

                {/* Finished Weight */}
                <td className="px-2 py-2.5 w-[25%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-amber-900 truncate max-w-full">
                      Finished Weight (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data.finishWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChangeField(
                        "finishWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                  />
                </td>

                {/* Weight Loss (Tự động tính Received - Finished) */}
                <td className="px-2 py-2.5 w-[25%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-red-800 truncate max-w-full">
                      Weight Loss (gr)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      Number(data.receivedWeight || 0) -
                        Number(data.finishWeight || 0) >
                      0
                        ? Number(
                            (
                              Number(data.receivedWeight || 0) -
                              Number(data.finishWeight || 0)
                            ).toFixed(3),
                          )
                        : 0
                    }
                    readOnly
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-gray-50 border-r-2 rounded-sm border-gray-300 focus:outline-none text-red-600 font-medium font-mono text-right cursor-not-allowed"
                  />
                </td>

                {/* Gem Loss */}
                <td className="px-2 py-2.5 w-[25%]">
                  <div className="mb-1 bg-amber-50 rounded-sm">
                    <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-red-800 border-red-200 truncate max-w-full">
                      Gem Loss (pcs)
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={data.gemLoss ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleChangeField(
                        "gemLoss",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.0"
                    className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none text-red-600 font-medium font-mono text-right"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
