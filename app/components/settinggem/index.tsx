"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sanitizeNumericInput } from "@/service/numberHook";

interface SettingProps {
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

export default function SetingStone({ data, onChange }: SettingProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  const [loading, setLoading] = useState(false);

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU TỪ SQL QUA API ====================
  useEffect(() => {
    if (!productId) return;

    async function fetchSettingData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/settingGem?productId=${productId}`);
        const resData = await res.json();

        const listData = Array.isArray(resData)
          ? resData
          : resData.settingGem || resData.setting || [];

        if (listData.length > 0) {
          // 🔥 TRƯỜNG HỢP 1: Đã có dữ liệu trong DB -> Đổ dữ liệu cũ lên form
          const item = listData[0];
          onChange((prev: any) => ({
            ...prev,
            productId: String(item.productID || productId),
            employName: item.employName || "",
            time: item.time
              ? new Date(item.time).toISOString().slice(0, 16)
              : "",
            gemWeight: item.gemWeight != null ? Number(item.gemWeight) : 0,
            receivedWeight:
              item.receivedWeight != null ? Number(item.receivedWeight) : 0,
            finishWeight:
              item.finishWeight != null ? Number(item.finishWeight) : 0,
            filingDustWeight:
              item.filingDustWeight != null ? Number(item.filingDustWeight) : 0,
            gemLossWeight: item.gemLoss != null ? Number(item.gemLoss) : 0,
            settingIMG: item.settingIMG || "",
          }));
        } else {
          // 🔥 TRƯỜNG HỢP 2: CHƯA có dữ liệu trong DB -> Reset form nhưng BẮT BUỘC phải gán productId vào để cho phép thêm mới!
          onChange((prev: any) => ({
            ...prev,
            productId: String(productId), // Gán ID hiện tại vào đây
            employName: "",
            time: "",
            gemWeight: 0,
            receivedWeight: 0,
            finishWeight: 0,
            lossWeight: 0,
            filingDustWeight: 0,
            gemLossWeight: 0,
            settingIMG: "",
          }));
        }
      } catch (error) {
        console.error("Error fetching settinggem data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettingData();
  }, [productId, onChange]);

  // Handler cập nhật field trực tiếp vào state của trang cha
  const handleChange = (field: string, value: any) => {
    onChange((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <div id="setting" className="space-y-3 shadow-lg rounded-2xl p-5">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-600 table-fixed">
            <tbody className="divide-y divide-gray-200">
              <React.Fragment>
                {/* DÒNG TR 1: EMPLOYEE NAME & TIME */}
                <tr className="bg-gray-50/70">
                  {/* NAME */}
                  <td className="px-3 py-2.5 w-1/3" colSpan={2}>
                    <div className="mb-1 bg-amber-50 rounded-sm">
                      <span className="inline-block px-2 py-0.5 text-sm font-bold text-amber-900 rounded">
                        Employee Name
                      </span>
                    </div>
                    <input
                      type="text"
                      value={data?.employName || ""}
                      onChange={(e) =>
                        handleChange("employName", e.target.value)
                      }
                      placeholder="enter employee name..."
                      className="w-full px-2.5 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium"
                    />
                  </td>

                  {/* TIME */}
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
                      className="w-full px-2.5 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono"
                    />
                  </td>
                </tr>

                {/* DÒNG TR 2: CÁC TRƯỜNG CÂN NẶNG & GEM (Chia đều 5 cột tuyệt đối w-[20%]) */}
                <tr className="bg-white hover:bg-amber-50/10 border-b-2 border-gray-200">
                  {/* GEM WEIGHT */}
                  <td className="px-2 py-2.5 w-[20%]">
                    <div className="mb-1 border-amber-200 rounded-sm bg-amber-50">
                      <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-amber-900">
                        Gem <br />
                        Weight (ct)
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={data?.gemWeight ?? 0}
                      onChange={(e) => {
                        const sanitized = sanitizeNumericInput(e.target.value, {
                          allowDecimal: true,
                          allowEmpty: true,
                        });
                        handleChange(
                          "gemWeight",
                          sanitized === "" ? 0 : Number(sanitized),
                        );
                      }}
                      placeholder="0.0"
                      className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                    />
                  </td>

                  {/* RECEIVED WEIGHT */}
                  <td className="px-2 py-2.5 w-[20%]">
                    <div className="mb-1  border-amber-200 rounded-sm bg-amber-50">
                      <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-amber-900">
                        Received <br />
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
                      className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                    />
                  </td>

                  {/* FINISHED WEIGHT */}
                  <td className="px-2 py-2.5 w-[20%]">
                    <div className="mb-1  border-amber-200 rounded-sm bg-amber-50">
                      <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-amber-900">
                        Finished
                        <br />
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
                      className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                    />
                  </td>

                  {/* FILING DUST WEIGHT */}
                  <td className="px-2 py-2.5 w-[20%]">
                    <div className="mb-1  border-amber-200 rounded-sm bg-amber-50">
                      <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-amber-900">
                        Filing Dust
                        <br />
                        Weight (gr)
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
                      className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono text-right"
                    />
                  </td>

                  {/* GEM LOSS */}
                  <td className="px-2 py-2.5 w-[20%]">
                    <div className="mb-1  border-amber-200 rounded-sm bg-amber-50">
                      <span className="inline-block px-1.5 py-0.5 text-sm font-bold text-red-800">
                        Gem Loss (pcs)
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={data?.gemLossWeight ?? 0}
                      onChange={(e) => {
                        const sanitized = sanitizeNumericInput(e.target.value, {
                          allowDecimal: true,
                          allowEmpty: true,
                        });
                        handleChange(
                          "gemLossWeight",
                          sanitized === "" ? 0 : Number(sanitized),
                        );
                      }}
                      placeholder="0.0"
                      className="w-full px-2 py-1.5 text-sm bg-white border-r-2 rounded-sm border-gray-300  focus:ring-1 focus:ring-amber-400 focus:outline-none text-red-600 font-medium font-mono text-right"
                    />
                  </td>
                </tr>
              </React.Fragment>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
