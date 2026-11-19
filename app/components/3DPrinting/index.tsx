"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { PrintingProgress } from "@/types";

export default function PrintingCNC() {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  // State quản lý danh sách In 3D / CNC
  const [technicians, setTechnicians] = useState<PrintingProgress[]>([
    {
      printingid: 1,
      technician: "",
      completedAt: "",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU TỪ SQL QUA API ====================
  useEffect(() => {
    if (!productId) return;

    async function fetchPrintingData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/printing?productId=${productId}`);
        const data = await res.json();

        const listData = Array.isArray(data) ? data : data.printing || [];

        if (listData.length > 0) {
          const mappedRows = listData.map((item: any, index: number) => ({
            printingid: Number(item.printingID || index + 1),
            technician: item.technician || "",
            // Format datetime sang dạng "YYYY-MM-DDTHH:mm" để hiển thị chuẩn trong input datetime-local
            completedAt: item.completedAt
              ? new Date(item.completedAt).toISOString().slice(0, 16)
              : "",
          }));

          setTechnicians(mappedRows);
        }
      } catch (error) {
        console.error("Error fetching printing data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrintingData();
  }, [productId]);

  const handleTechnicianChange = (
    id: number,
    field: keyof PrintingProgress,
    value: string,
  ) => {
    setTechnicians(
      technicians.map((item) =>
        item.printingid === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <>
      {/* Bảng In 3D / CNC */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            3D Printing / CNC Progress
          </h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-amber-50/50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5">Technician</th>
                <th className="px-3 py-2.5">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {technicians.map((item) => (
                <tr key={item.printingid} className="hover:bg-amber-50/20">
                  {/* technician */}
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.technician}
                      onChange={(e) =>
                        handleTechnicianChange(
                          item.printingid,
                          "technician",
                          e.target.value,
                        )
                      }
                      placeholder="Enter technician name"
                      className="w-full px-3 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium"
                    />
                  </td>

                  {/* completedAt */}
                  <td className="px-2 py-2">
                    <input
                      type="datetime-local"
                      value={item.completedAt}
                      onChange={(e) =>
                        handleTechnicianChange(
                          item.printingid,
                          "completedAt",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-1 text-sm bg-white border-r-2 rounded-sm border-gray-300 focus:ring-1 focus:ring-amber-400 focus:outline-none font-medium"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
