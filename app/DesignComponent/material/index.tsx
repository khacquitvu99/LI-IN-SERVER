"use client";

import { useEffect, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  sanitizeNumericInput,
  preventNonNumericKeys,
} from "@/service/numberHook";
import { Layers } from "lucide-react";
import { MATERIAL_COLOR_OPTIONS } from "@/components/attribute";
import { MaterialItem } from "@/types";

export interface MaterialProps {
  data?: any;
  onDataChange?: (data: any) => void;
  disabled?: boolean;
  isCountingView?: boolean;
}

export default function MaterialForm({
  onDataChange,
  disabled = false, // 🔥 Bổ sung thêm vào đây
  isCountingView = false, // 🔥 Bổ sung thêm vào đây
}: MaterialProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  const [materials, setMaterials] = useState<any>({
    materialID: 1,
    type: "",
    color: "",
    designWeight: 0,
    finishedWeight: 0,
  });
  const [loading, setLoading] = useState(false);

  const isLocked = disabled || isCountingView;

  // ==================== TỰ ĐỘNG LOAD DỮ LIỆU TỪ SQL QUA API ====================
  useEffect(() => {
    if (!productId) return;

    async function fetchMaterialsData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/material?productID=${productId}`);
        const result = await res.json();

        // Lấy object từ API, nếu chưa có thì dùng object mặc định
        const materialObj = result.material ||
          result.data || {
            materialID: 1,
            type: "",
            color: "",
            designWeight: 0,
            finishedWeight: 0,
          };

        startTransition(() => {
          // Set trực tiếp vào state `materials` hiện tại
          setMaterials(materialObj);
          if (onDataChange) {
            onDataChange(materialObj);
          }
        });
      } catch (error) {
        console.error("Error fetching materials data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterialsData();
  }, [productId]);

  // ==================== HÀM HANDLE ONCHANGE CHO TỪNG DÒNG ====================
  const handleMaterialChange = (field: keyof MaterialItem, value: any) => {
    // Cập nhật trực tiếp vào object đơn hiện tại
    const updatedMaterial = {
      ...materials,
      [field]: value,
    };

    setMaterials(updatedMaterial);

    if (onDataChange) {
      onDataChange(updatedMaterial);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-amber-200/80 rounded-2xl shadow-xs p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
        <h2 className="text-base font-bold text-amber-950 uppercase tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          Material Details
        </h2>
      </div>

      {/* TABLE MATERIAL */}
      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-amber-50/50 text-amber-950 font-bold uppercase tracking-wider border-b border-gray-300">
                <th className="p-2.5 w-1/4">Type</th>
                <th className="p-2.5 w-1/4">Color</th>
                <th className="p-2.5 w-1/4">Design Weight</th>
                <th className="p-2.5 w-1/4">Finished Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-amber-50/30 transition-colors">
                {/* TYPE */}
                <td className="p-1.5 align-middle">
                  <input
                    type="text"
                    value={materials.type || ""}
                    readOnly
                    placeholder="Material type..."
                    className="w-full px-2 py-1.5 rounded-sm border-r-2 border-gray-300 outline-none text-left text-gray-500 bg-gray-50 text-sm font-medium cursor-not-allowed"
                  />
                </td>

                {/* COLOR */}
                <td className="p-1.5 align-middle">
                  <select
                    disabled={isLocked}
                    value={materials.color || ""}
                    onChange={(e) =>
                      handleMaterialChange("color", e.target.value)
                    }
                    className="`... ${isLocked ? 'bg-gray-100 opacity-75' : ''}` w-full px-2 py-1.5 rounded-sm border-r-2 border-gray-300 outline-none text-left text-gray-700 bg-white text-sm font-medium focus:ring-1 focus:ring-amber-500 hover:border-amber-200 cursor-pointer"
                  >
                    <option value="" disabled>
                      Select color...
                    </option>
                    {MATERIAL_COLOR_OPTIONS.map((colorItem, index) => {
                      const colorValue =
                        typeof colorItem === "string"
                          ? colorItem
                          : colorItem.value;
                      const colorLabel =
                        typeof colorItem === "string"
                          ? colorItem
                          : colorItem.label;
                      return (
                        <option key={index} value={colorValue}>
                          {colorLabel}
                        </option>
                      );
                    })}
                  </select>
                </td>

                {/* DESIGN WEIGHT */}
                <td className="p-1.5 align-middle">
                  <input
                    disabled={isLocked}
                    type="text"
                    inputMode="decimal"
                    onKeyDown={preventNonNumericKeys}
                    value={materials.designWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleMaterialChange(
                        "designWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.00"
                    className="`... ${isLocked ? 'bg-gray-100 opacity-75' : ''}` w-full px-2 py-1.5 rounded-sm border-r-2 border-gray-300 outline-none text-right font-mono text-gray-700 bg-white text-sm font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </td>

                {/* FINISHED WEIGHT */}
                <td className="p-1.5 align-middle">
                  <input
                    disabled={isLocked}
                    type="text"
                    inputMode="decimal"
                    onKeyDown={preventNonNumericKeys}
                    value={materials.finishedWeight ?? 0}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleMaterialChange(
                        "finishedWeight",
                        sanitized === "" ? 0 : Number(sanitized),
                      );
                    }}
                    placeholder="0.00"
                    className="`... ${isLocked ? 'bg-gray-100 opacity-75' : ''}` w-full px-2 py-1.5 rounded-sm outline-none text-right font-mono text-gray-700 bg-white text-sm font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
