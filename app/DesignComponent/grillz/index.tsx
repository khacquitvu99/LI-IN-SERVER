"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { GrillzStyleItem } from "@/types";

interface GrillzStyleProps {
  onDataChange?: (data: GrillzStyleItem[]) => void;
}

export default function GrillzStyle({ onDataChange }: GrillzStyleProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID");

  const [grillz, setGrillz] = useState<GrillzStyleItem[]>([
    {
      grillzID: 1,
      quantity: 0,
      styleName: "",
    },
  ]);

  // Tự động fetch dữ liệu từ API
  useEffect(() => {
    setGrillz([]);

    if (!productId) return;

    async function fetchGrillzData() {
      try {
        const res = await fetch(`/api/grillzdetail?productId=${productId}`);
        const data = await res.json();

        const listData = Array.isArray(data) ? data : data.grillz || [];

        // 2. Gán dữ liệu (nếu listData rỗng [] thì nó vẫn giữ nguyên state rỗng vừa reset)
        setGrillz(listData);
        if (onDataChange) onDataChange(listData);
      } catch (error) {
        console.error("Error fetching grillz style:", error);
        setGrillz([]);
        if (onDataChange) onDataChange([]);
      }
    }

    fetchGrillzData();
  }, [productId]); 
  
  /******************************/
  const handleGrillzChange = (
    grillzID: number,
    field: keyof GrillzStyleItem,
    value: any,
  ) => {
    const updatedList = grillz.map((item) =>
      item.grillzID === grillzID ? { ...item, [field]: value } : item,
    );

    setGrillz(updatedList);

    if (onDataChange) {
      onDataChange(updatedList);
    }
  };

  return (
    <>
      {grillz.map((item: GrillzStyleItem) => (
        <div
          key={item.grillzID}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/30 p-4 rounded-xl border border-amber-100"
        >
          {/* Quantity */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Quantity
            </label>
            <input
              type="number"
              value={item.quantity ?? ""}
              onChange={(e) =>
                handleGrillzChange(
                  item.grillzID ?? 0,
                  "quantity",
                  e.target.value === "" ? 0 : Number(e.target.value),
                )
              }
              placeholder="Enter Qty..."
              className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          {/* Style */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Style:
            </label>
            <input
              type="text"
              value={item.styleName ?? ""}
              onChange={(e) =>
                handleGrillzChange(
                  item.grillzID ?? 0,
                  "styleName",
                  e.target.value,
                )
              }
              placeholder="Enter style name..."
              className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>
        </div>
      ))}
    </>
  );
}
