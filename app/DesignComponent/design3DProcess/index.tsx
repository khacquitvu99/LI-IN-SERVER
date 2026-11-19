"use client";

import { useState, useEffect, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";
import type { DsProgressItem } from "@/types";

interface DsProcessingProps {
  onDataChange?: (data: any[]) => void;
}

export default function Design3D({ onDataChange }: DsProcessingProps) {
  // 1. Tự động đọc productID trực tiếp từ URL Search Params
  const searchParams = useSearchParams();
  const pID = searchParams.get("productId");

  // State quản lý danh sách tiến độ thiết kế (mảng nhiều dòng)
  const [designers, setDesigners] = useState<DsProgressItem[]>([
    {
      id: 1,
      designer: "",
      completedAt: "",
      processImage: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  // Lay thoi gian hiên tại
  const getMinDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 2. Tự động gọi API route lấy dữ liệu từ SQL khi pID trên URL thay đổi
  useEffect(() => {
    if (!pID) {
      setDesigners([
        {
          id: 1,
          designer: "",
          completedAt: "",
          processImage: "",
        },
      ]);
      return;
    }

    const fetchDsProcessing = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/DsProcess?productID=${pID}`);
        const result = await response.json();
        const rawData = result.DsProcessing || result.data || result.dsprocess;
        startTransition(() => {
          if (result.success && Array.isArray(rawData) && rawData.length > 0) {
            const formattedData = rawData.map((item: any, index: number) => ({
              id: item.processingID || item.ID || Date.now() + index,
              designer: item.designer || "",
              processImage: item.processImage || "",

              // Cắt chuỗi ngày tháng về định dạng YYYY-MM-DDTHH:mm để input datetime-local nhận diện được
              completedAt: item.completedAt
                ? item.completedAt.slice(0, 16)
                : "",
            }));
            setDesigners(formattedData);
          } else {
            setDesigners([
              {
                id: 1,
                designer: "",
                completedAt: "",
                processImage: "",
              },
            ]);
          }
        });
      } catch (error) {
        console.error("❌ Error fetching DsProcessing:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDsProcessing();
  }, [pID]);

  // Hàm cập nhật state local khi người dùng gõ hoặc chọn thay đổi trên form
  const handleDesignerChange = (
    id: number,
    field: keyof DsProgressItem,
    value: string,
  ) => {
    // 1. Tạo danh sách mới dựa trên state hiện tại
    const updatedList = designers.map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );

    // 2. Cập nhật state nội bộ của component con
    setDesigners(updatedList);

    // 3. Gọi onDataChange đẩy dữ liệu lên trang cha (DesignPage)
    if (onDataChange) {
      onDataChange(updatedList);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-amber-200/80 rounded-2xl shadow-xs p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
        <h2 className="text-base font-bold text-amber-950 uppercase tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          3D Design Progress
        </h2>
      </div>

      {/* TABLE DSPROCESSING */}
      <div className="w-full border border-gray-300 rounded-xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-amber-50/50 text-amber-950 font-bold uppercase tracking-wider border-b border-gray-300">
                <th className="p-2.5 w-1/2">Designer</th>
                <th className="p-2.5 w-1/2">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {designers.map((item: DsProgressItem) => (
                <tr
                  key={item.id}
                  className="hover:bg-amber-50/20 transition-colors"
                >
                  {/* DESIGNER NAME */}
                  <td className="p-1.5 align-middle">
                    <input
                      type="text"
                      value={item.designer || ""}
                      onChange={(e) =>
                        handleDesignerChange(
                          item.id,
                          "designer",
                          e.target.value,
                        )
                      }
                      placeholder="Enter designer name..."
                      className="w-full px-2 py-1.5 rounded-sm border-gray-300 outline-none text-left border-r-2 text-gray-700 bg-white text-sm font-medium focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* COMPLETED AT */}
                  <td className="p-1.5 align-middle">
                    <input
                      type="datetime-local"
                      min={getMinDateTimeLocal()} // <-- Thêm dòng này để khóa các mốc thời gian trong quá khứ
                      value={item.completedAt || ""}
                      onChange={(e) =>
                        handleDesignerChange(
                          item.id,
                          "completedAt",
                          e.target.value,
                        )
                      }
                      className="w-full px-2 py-1.5 rounded-lg outline-none text-gray-700 bg-white text-sm font-medium focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
