"use client";

import { useState, useEffect, useRef } from "react";
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

  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!productId) {
      setGrillz((prev) => (prev.length === 0 ? prev : []));
      onDataChangeRef.current?.([]);
      return;
    }

    let isCancelled = false;

    async function fetchGrillzData() {
      try {
        const res = await fetch(
          `/api/grillzdetail?productId=${encodeURIComponent(productId!)}`,
        );
        const data = await res.json();

        const listData: GrillzStyleItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.grillz)
            ? data.grillz
            : [];

        if (!isCancelled) {
          setGrillz(listData);
          onDataChangeRef.current?.(listData);
        }
      } catch (error) {
        console.error("Error fetching grillz style:", error);
        if (!isCancelled) {
          setGrillz([]);
          onDataChangeRef.current?.([]);
        }
      }
    }

    void fetchGrillzData();

    return () => {
      isCancelled = true;
    };
  }, [productId]);

  const handleGrillzChange = (
    grillzID: number,
    field: keyof GrillzStyleItem,
    value: number | string,
  ) => {
    const updatedList = grillz.map((item) =>
      item.grillzID === grillzID ? { ...item, [field]: value } : item,
    );

    setGrillz(updatedList);
    onDataChangeRef.current?.(updatedList);
  };

  return (
    <>
      {grillz.map((item: GrillzStyleItem, index: number) => {
        const currentId = item.grillzID ?? index;
        return (
          <div
            key={currentId}
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
                    currentId,
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
                  handleGrillzChange(currentId, "styleName", e.target.value)
                }
                placeholder="Enter style name..."
                className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
          </div>
        );
      })}
    </>
  );
}
