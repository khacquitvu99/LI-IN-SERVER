"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface PlatingProps {
  data: any;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}
//Lay thoi g ian hjien tai
const getMinDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Plating({ data, onChange }: PlatingProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  const [loading, setLoading] = useState(false);

  // ==================== FETCH DỮ LIỆU TỪ SQL QUA API ====================
  useEffect(() => {
    if (!productId) return;

    async function fetchPlatingData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/plating?productId=${productId}`);
        const resData = await res.json();

        const listData = Array.isArray(resData)
          ? resData
          : resData.plating || [];

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
            platingIMG: item.platingIMG || "",
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
            platingIMG: "",
          }));
        }
      } catch (error) {
        console.error("Error fetching plating data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlatingData();
  }, [productId, onChange]);

  // Handler thay đổi giá trị input trực tiếp vào state cha
  const handleChangeField = (field: string, value: any) => {
    onChange((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <div id="plating" className="space-y-3 shadow-lg p-5 rounded-2xl">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-amber-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 w-1/2">Employee Name</th>
                <th className="px-3 py-2.5 w-1/2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-amber-50/20">
                {/* Employee Name */}
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={data.employName || ""}
                    onChange={(e) =>
                      handleChangeField("employName", e.target.value)
                    }
                    placeholder="Enter employee name..."
                    className="w-full px-2 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium"
                  />
                </td>
                {/* TIME */}
                <td className="px-2 py-2">
                  <input
                    type="datetime-local"
                    value={data.time || ""}
                    min={getMinDateTimeLocal()}
                    onChange={(e) => handleChangeField("time", e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white rounded-sm focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium font-mono"
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
