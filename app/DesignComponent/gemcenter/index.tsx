"use client";

import { useEffect, useState, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { getGemPrice } from "@/lib/costGemType";
import { GEM_TYPE_OPTIONS, SHAPE_OPTIONS } from "@/components/attribute";
import {
  sanitizeNumericInput,
  preventNonNumericKeys,
} from "@/service/numberHook";

interface GemCenterProps {
  data?: any;
  onDataChange: (data: any) => void;
  readOnly?: boolean;
}

export default function GemCenterContent({
  data = {},
  onDataChange,
  readOnly = false,
}: GemCenterProps) {
  const searchParams = useSearchParams();
  const pID = searchParams.get("productId") || searchParams.get("productID");

  const [isFetching, setIsFetching] = useState<boolean>(false);

  // State nội bộ khởi tạo thuần Object
  const [internalData, setInternalData] = useState<any>({
    name: "Center Gem",
    shape: "",
    type: "",
    size: "",
    cost: "",
  });

  // ==================== TỰ FETCH DỮ LIỆU ĐỘC LẬP TỪ API ====================
  useEffect(() => {
    let isMounted = true;

    // 1. NGAY KHI ĐỔI pID: Reset state về mặc định ngay lập tức để tránh dính data cũ
    const emptyForm = {
      id: 1,
      name: "Center Gem",
      shape: "",
      type: "",
      size: "",
      cost: 0,
    };

    if (!pID) {
      setInternalData(emptyForm);
      onDataChange(emptyForm);
      return;
    }

    const fetchGemCenter = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(`/api/gemcenter?productID=${pID}`);
        const result = await response.json();
        const rawData = result.data;

        // Lấy phần tử đầu tiên nếu là mảng, hoặc object trực tiếp
        const item = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!isMounted) return;

        // 2. NẾU CÓ DỮ LIỆU: Map chuẩn theo các cột Backend trả về
        if (item && Object.keys(item).length > 0) {
          const shape = String(item.shape || "").trim();
          const type = String(item.type || "").trim();
          const size = String(item.size || "").trim();
          const qty = Number(item.quantity || 1);

          const unitPrice = getGemPrice(type, shape);
          const calculatedCost = unitPrice ? unitPrice * qty : 0;

          const formatted = {
            id: Number(item.ID || item.id) || 1,
            name: "Center Gem",
            shape: shape,
            type: type,
            size: size,
            cost:
              item.cost !== undefined && item.cost !== null
                ? Number(item.cost)
                : calculatedCost,
          };

          startTransition(() => {
            setInternalData(formatted);
            onDataChange(formatted);
          });
        } else {
          // 3. NẾU API TRẢ VỀ RỖNG (Sản phẩm không có dữ liệu) -> ÉP RESET VỀ FORM TRẮNG
          startTransition(() => {
            setInternalData(emptyForm);
            onDataChange(emptyForm);
          });
        }
      } catch (error) {
        console.error("❌ Lỗi khi fetch GemCenter:", error);
        // Lỗi cũng reset về form trắng
        setInternalData(emptyForm);
        onDataChange(emptyForm);
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchGemCenter();

    return () => {
      isMounted = false;
    };
  }, [pID]);

  const handleCenterGemChange = (field: string, value: string) => {
    const updated = { ...internalData, [field]: value };

    if (field === "type" || field === "shape") {
      const unitPrice = getGemPrice(updated.type || "", updated.shape || "");
      if (unitPrice !== undefined && unitPrice !== null) {
        updated.cost = unitPrice;
      }
    }
    setInternalData(updated);
    onDataChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-amber-700 font-semibold flex items-center justify-between">
        <span>GemCenter Details</span>
        {isFetching && (
          <span className="text-xs text-gray-400 font-normal">Loading...</span>
        )}
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-amber-50/50 text-amber-950 font-bold uppercase tracking-wider border-b border-gray-300">
                <th className="p-2.5 border-r border-gray-300 w-1/5">Name</th>
                <th className="p-2.5 w-1/5">Shape</th>
                <th className="p-2.5 w-1/5">Type</th>
                <th className="p-2.5 w-1/5">Size</th>
                <th className="p-2.5 w-1/5">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-amber-50/30 transition-colors">
                {/* NAME */}
                <td className="p-2.5 font-bold text-sm text-gray-800 bg-slate-50/50 border-r border-gray-200 align-middle">
                  <input
                    type="text"
                    readOnly
                    value={internalData.name || "Center Gem"}
                    className="w-full px-2 py-1.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs cursor-default"
                  />
                </td>

                {/* SHAPE */}
                <td className="p-1.5 align-middle">
                  <select
                    disabled={readOnly}
                    value={internalData.shape || ""}
                    onChange={(e) =>
                      handleCenterGemChange("shape", e.target.value)
                    }
                    className="w-full px-2 py-1.5 bg-white border-r-2 border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500/40 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="">-- Select shape --</option>
                    {Array.isArray(SHAPE_OPTIONS) &&
                      SHAPE_OPTIONS.map((opt, idx) => {
                        const val =
                          typeof opt === "object" && opt !== null
                            ? opt.value
                            : opt;
                        return (
                          <option key={idx} value={val}>
                            {val}
                          </option>
                        );
                      })}
                  </select>
                </td>

                {/* TYPE */}
                <td className="p-1.5 align-middle">
                  <select
                    disabled={readOnly}
                    value={internalData.type || ""}
                    onChange={(e) =>
                      handleCenterGemChange("type", e.target.value)
                    }
                    className="w-full px-2 py-1.5 bg-white border-r-2 border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500/40 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="">-- Select type --</option>
                    {Array.isArray(GEM_TYPE_OPTIONS) &&
                      GEM_TYPE_OPTIONS.map((opt, idx) => {
                        const val =
                          typeof opt === "object" && opt !== null
                            ? opt.value
                            : opt;
                        return (
                          <option key={idx} value={val}>
                            {val}
                          </option>
                        );
                      })}
                  </select>
                </td>

                {/* SIZE */}
                <td className="p-1.5 align-hidden">
                  <input
                    disabled={readOnly}
                    type="text"
                    value={internalData.size || ""}
                    onChange={(e) =>
                      handleCenterGemChange("size", e.target.value)
                    }
                    placeholder="5.0 x 7.0"
                    className="w-full px-2 py-1.5 bg-white border-r-2 border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                  />
                </td>

                {/* COST */}
                <td className="p-1.5 align-middle">
                  <input
                    disabled={readOnly}
                    type="text"
                    inputMode="decimal"
                    onKeyDown={preventNonNumericKeys}
                    value={internalData.cost ?? ""}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: true,
                        allowEmpty: true,
                      });
                      handleCenterGemChange("cost", sanitized);
                    }}
                    onBlur={() => {
                      if (
                        internalData.cost !== "" &&
                        internalData.cost !== undefined
                      ) {
                        handleCenterGemChange(
                          "cost",
                          String(Number(internalData.cost) || 0),
                        );
                      }
                    }}
                    placeholder="0"
                    className="w-full px-2 py-1.5 bg-white border-gray-300 rounded-lg focus:outline-none font-mono text-right text-red-800 focus:ring-2 focus:ring-amber-500/40 text-xs"
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
