"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { GemItem } from "@/types";
import { GEM_TYPE_OPTIONS, SHAPE_OPTIONS } from "@/components/attribute";
import {
  sanitizeNumericInput,
  preventNonNumericKeys,
} from "@/service/numberHook";

interface GemstoneProps {
  onDataChange?: (data: any[]) => void;
  initialData?: any[];
}

function GemStoneFormContent({ onDataChange, initialData }: GemstoneProps) {
  const searchParams = useSearchParams();
  const pID = searchParams.get("productId") || searchParams.get("productID");

  const [stones, setStones] = useState<GemItem[]>(() => {
    const validStones = initialData?.filter(
      (item: any) => item.gemType || item.shape || item.weight,
    );

    if (validStones && validStones.length > 0) {
      return validStones.map((item: any) => ({
        gemStoneID: Number(item.gemStoneID || item.ID || 0),
        gemType: item.gemType || "",
        shape: item.shape || "",
        size: item.size || "",
        weight: Number(item.weight) || 0,
        quantity: Number(item.quantity) || 0,
        color: item.color || "White",
      }));
    }
    // Dòng trống mặc định chuẩn hóa dùng gemStoneID = 0
    return [
      {
        gemStoneID: 0,
        gemType: "",
        shape: "",
        size: "",
        weight: 0,
        quantity: 0,
        color: "White",
      },
    ];
  });

  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    if (!pID) return;

    const fetchGemstone = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(`/api/gemstone?productID=${pID}`);
        const result = await response.json();
        const rawData = result.gemstone || result.data;

        if (result.success && Array.isArray(rawData) && rawData.length > 0) {
          const formattedStones = rawData.map((item: any) => ({
            gemStoneID: Number(item.gemStoneID || 0),
            gemType: item.gemType || "",
            shape: item.shape || "",
            size: item.size || "",
            weight: Number(item.weight) || 0,
            quantity: Number(item.quantity) || 1,
            color: item.color || "White",
          }));
          setStones(formattedStones);
          if (onDataChange) onDataChange(formattedStones);
        } else {
          // 🔥 SỬA Ở ĐÂY: Nếu API không có dữ liệu, hãy để mảng rỗng hoặc giữ nguyên dòng khởi tạo ban đầu,
          // không nhồi thêm dòng defaultEmpty nữa để tránh bị dư dòng.
          const emptyArray: any[] = [];
          // Hoặc nếu Qui muốn giữ lại đúng 1 dòng trắng mặc định sẵn có của state ban đầu thì không cần gọi setStones ở đây nữa.
        }
      } catch (error) {
        console.error("❌ Error fetching gemstone:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchGemstone();
  }, [pID]);

  //****Add data vao table GemStone***********//
  const handleAddStone = () => {
    const lastItem = stones.length > 0 ? stones[stones.length - 1] : null;

    const updatedList = [
      ...stones,
      {
        gemStoneID: 0, // Dòng mới luôn có ID = 0 để Backend nhận diện là INSERT
        gemType: lastItem ? lastItem.gemType : "",
        shape: lastItem ? lastItem.shape : "",
        size: lastItem ? lastItem.size : "",
        weight: lastItem ? lastItem.weight : 0,
        quantity: lastItem ? lastItem.quantity : 1,
        color: lastItem ? lastItem.color : "White",
      },
    ];
    setStones(updatedList);
    if (onDataChange) onDataChange(updatedList);
  };
  //****Xóa dòng trong table GemStone***********//
  const handleRemoveStone = async (indexToRemove: number) => {
    const itemToRemove = stones[indexToRemove];

    // Nếu dòng này đã tồn tại trong Database (gemStoneID > 0) -> Gọi API DELETE trực tiếp xuống SQL Server
    if (itemToRemove && Number(itemToRemove.gemStoneID) > 0) {
      try {
        const res = await fetch(
          `/api/gemstone?id=${Number(itemToRemove.gemStoneID)}`,
          {
            method: "DELETE",
          },
        );
        const data = await res.json();
        if (!data.success) {
          console.error("Lỗi khi xóa trong DB:", data.error);
          return; // Dừng lại nếu xóa DB lỗi để bảo vệ đồng bộ state
        }
      } catch (error) {
        console.error("Lỗi kết nối khi xóa:", error);
        return;
      }
    }

    // Lọc bỏ dòng khỏi mảng state để re-render lại riêng bảng ngay lập tức
    const updatedList = stones.filter((_, index) => index !== indexToRemove);

    // Đảm bảo luôn giữ lại ít nhất 1 dòng trống nếu xóa hết sạch
    const finalList =
      updatedList.length > 0
        ? updatedList
        : [
            {
              gemStoneID: 0,
              gemType: "",
              shape: "",
              size: "",
              weight: 0,
              quantity: 1,
              color: "White",
            },
          ];

    setStones(finalList);
    if (onDataChange) onDataChange(finalList);
  };
  //*********BẮt thay đổi của form************//
  const handleGemstoneChange = (index: number, field: string, value: any) => {
    const updatedList = stones.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item,
    );

    setStones(updatedList);
    if (onDataChange) {
      onDataChange(updatedList);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Gemstone Information
        </h3>
        <button
          type="button"
          onClick={handleAddStone}
          className="p-1 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-full transition-colors flex items-center justify-center w-7 h-7 font-bold shadow-sm cursor-pointer"
          title="Add rows"
        >
          +
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-amber-50/50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Shape</th>
              <th className="px-3 py-2.5">Size</th>
              <th className="px-3 py-2.5">Weight (CT)</th>
              <th className="px-3 py-2.5">Quantity (Pcs)</th>
              <th className="px-3 py-2.5">Color</th>
              <th className="px-2 py-2.5 w-10 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stones.map((item, index) => (
              <tr
                key={
                  item.gemStoneID ? `db-${item.gemStoneID}` : `local-${index}`
                }
              >
                {/* TYPE */}
                <td className="w-35 px-2 py-2">
                  <select
                    value={item.gemType || ""}
                    onChange={(e) =>
                      handleGemstoneChange(index, "gemType", e.target.value)
                    }
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-400 p-1 border-gray-300 border-r-2 rounded-sm cursor-pointer"
                  >
                    <option value="">-- Select Gem --</option>
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

                {/* SHAPE */}
                <td className="px-2 py-2 w-35">
                  <select
                    value={item.shape || ""}
                    onChange={(e) =>
                      handleGemstoneChange(index, "shape", e.target.value)
                    }
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-400 p-1 border-gray-300 border-r-2 rounded-sm cursor-pointer"
                  >
                    <option value="">--Select shape--</option>
                    {Array.isArray(SHAPE_OPTIONS) &&
                      SHAPE_OPTIONS.map((opt, idx) => {
                        const lbl =
                          typeof opt === "object" && opt !== null
                            ? opt.label
                            : opt;
                        return (
                          <option key={idx} value={lbl}>
                            {lbl}
                          </option>
                        );
                      })}
                  </select>
                </td>

                {/* SIZE */}
                <td className="px-2 py-2 w-30">
                  <input
                    type="text"
                    value={item.size || ""}
                    onChange={(e) =>
                      handleGemstoneChange(index, "size", e.target.value)
                    }
                    placeholder="2.0 x 2.0"
                    className="w-full bg-transparent focus:outline-none border-gray-300 border-r-2 rounded-sm focus:ring-1 focus:ring-amber-400 p-1"
                  />
                </td>

                {/* WEIGHT */}
                <td className="px-2 py-2 w-25">
                  <input
                    type="text"
                    value={item.weight ?? ""}
                    onChange={(e) => {
                      // Gọi hàm sanitizeNumericInput có sẵn để làm sạch chuỗi mà không làm mất dấu chấm thập phân đang gõ
                      const sanitizedVal = sanitizeNumericInput(
                        e.target.value,
                        { allowDecimal: true },
                      );

                      const updatedStones = [...stones];
                      // Lưu tạm dưới dạng string trong state để người dùng gõ được dấu chấm động mượt mà
                      updatedStones[index].weight = sanitizedVal as any;
                      setStones(updatedStones);
                    }}
                    onBlur={(e) => {
                      // Khi người dùng bấm click ra ngoài (blur), ép kiểu sang số thực (parseFloat) để gửi lên DB chuẩn xác
                      const updatedStones = [...stones];
                      const val = e.target.value;
                      updatedStones[index].weight =
                        val === "" || val === "." ? 0 : parseFloat(val);
                      setStones(updatedStones);
                      if (onDataChange) onDataChange(updatedStones);
                    }}
                    className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-amber-400 px-1 border-gray-300 border-r-2 rounded-sm"
                  />
                </td>

                {/* QUANTITY */}
                <td className="px-2 py-2 w-20">
                  <input
                    type="text"
                    inputMode="decimal"
                    onKeyDown={preventNonNumericKeys}
                    value={item.quantity ?? 1}
                    onChange={(e) => {
                      const sanitized = sanitizeNumericInput(e.target.value, {
                        allowDecimal: false,
                        allowEmpty: true,
                      });
                      handleGemstoneChange(index, "quantity", sanitized);
                    }}
                    onBlur={() => {
                      handleGemstoneChange(
                        index,
                        "quantity",
                        Number(item.quantity) || 1,
                      );
                    }}
                    placeholder="1"
                    className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-amber-400 px-1 border-gray-300 border-r-2 rounded-sm"
                  />
                </td>

                {/* COLOR */}
                <td className="px-2 py-2 w-25">
                  <input
                    type="text"
                    value={item.color || ""}
                    onChange={(e) =>
                      handleGemstoneChange(index, "color", e.target.value)
                    }
                    placeholder="Color..."
                    className="w-full p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-400 px-1"
                  />
                </td>

                {/* ACTION DELETE */}
                <td className="px-2 py-2 text-center">
                  {stones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStone(index)}
                      className="text-red-500 hover:text-red-700 font-bold"
                      title="Delete row"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GemStone({ onDataChange }: GemstoneProps) {
  return (
    <Suspense
      fallback={
        <div className="p-1 text-xs text-gray-400">
          Initializing the Gems table...
        </div>
      }
    >
      <GemStoneFormContent onDataChange={onDataChange} />
    </Suspense>
  );
}
