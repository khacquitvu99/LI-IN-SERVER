"use client";

import React, { useState, useEffect, Suspense, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Gem } from "lucide-react";
import { SideStoneItem, GemItem } from "@/types";
import { getGemPrice } from "@/lib/costGemType";

function StoneFormContent() {
  // 1. Lấy productId trực tiếp từ URL Search Params (?productId=...)
  const searchParams = useSearchParams();
  const pID = searchParams.get("productId");

  // State quản lý 4 dòng Side Stones cố định theo yêu cầu phân loại
  const [sideStones, setSideStones] = useState<SideStoneItem[]>([
    { shape: "Round", type: "", qty: 0, cost: "" },
    { shape: "Baguette", type: "", qty: 0, cost: "" },
    { shape: "Fancy", type: "", qty: 0, cost: "" },
    { shape: "Color", type: "", qty: 0, cost: "" },
  ]);

  // State lưu dữ liệu từ API gemstone
  const [sqlGemstoneData, setSqlGemstoneData] = useState<GemItem[]>([]);

  // 2. Fetch dữ liệu từ API theo pID
  useEffect(() => {
    if (!pID) {
      setSqlGemstoneData([]);
      return;
    }

    const fetchGemstone = async () => {
      try {
        const response = await fetch(`/api/gemstone?productID=${pID}`);
        const result = await response.json();
        const rawData = result.gemstone || result.data;

        startTransition(() => {
          if (result.success && Array.isArray(rawData) && rawData.length > 0) {
            const formattedStones = rawData.map((item: any, index: number) => ({
              ...item,
              ID: item.ID || item.gemStoneID || Date.now() + index,
              type: item.GemType || item.gemType || item.type || "",
              shape: item.Shape || item.shape || "",
              weight: item.Weight ?? item.weight ?? "",
              size: item.Size ?? item.size ?? "",
              quantity: item.Quantity ?? item.quantity ?? "",
              color: item.Color || item.color || "White",
            }));
            setSqlGemstoneData(formattedStones);
          } else {
            setSqlGemstoneData([]);
          }
        });
      } catch (error) {
        console.error("❌ Error fetch Gemstone:", error);
      }
    };

    fetchGemstone();
  }, [pID]);

  // 3. Map và phân loại dữ liệu vào 4 dòng Side Stones (Gom nhóm các shape lạ vào Fancy)
  useEffect(() => {
    if (sqlGemstoneData.length === 0) {
      setSideStones([
        { shape: "Round", type: "", qty: 0, cost: "" },
        { shape: "Baguette", type: "", qty: 0, cost: "" },
        { shape: "Fancy", type: "", qty: 0, cost: "" },
        { shape: "Color", type: "", qty: 0, cost: "" },
      ]);
      return;
    }

    setSideStones((prevSideStones) =>
      prevSideStones.map((defaultItem) => {
        const targetShape = defaultItem.shape.trim().toLowerCase();

        // Lọc các dòng trong DB khớp với logic phân loại
        const matchedDbItems = sqlGemstoneData.filter((dbItem) => {
          if (!dbItem.shape) return false;
          const dbShape = dbItem.shape.trim().toLowerCase();

          if (targetShape === "fancy") {
            // Dòng Fancy sẽ gom tất cả các shape KHÔNG PHẢI Round, Baguette, Color
            return !["round", "baguette", "color"].includes(dbShape);
          } else {
            // Các dòng còn lại khớp chính xác tên shape
            return dbShape === targetShape;
          }
        });

        if (matchedDbItems.length > 0) {
          // Lấy type từ dòng đầu tiên khớp
          const type = matchedDbItems[0].gemType || "";

          // Cộng dồn tổng Quantity của nhóm
          const totalQty = matchedDbItems.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0),
            0,
          );

          // Tính cost dựa trên tổng quantity đã cộng dồn
          const unitPrice = getGemPrice(type, defaultItem.shape);
          const calculatedCost = unitPrice * totalQty;

          return {
            ...defaultItem,
            type: type,
            qty: totalQty > 0 ? totalQty : "",
            cost: calculatedCost ? calculatedCost : "",
          } as SideStoneItem;
        }

        return {
          ...defaultItem,
          type: "",
          qty: 0,
          cost: "",
        };
      }),
    );
  }, [sqlGemstoneData]);

  return (
    <div className="max-w-4xl mx-auto bg-white border border-amber-200/80 rounded-2xl shadow-xs p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
        <h2 className="text-base font-bold text-amber-950 uppercase tracking-tight flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-600" />
          Gem Details
        </h2>
      </div>

      <div className="space-y-6">
        {/* 1. BẢNG SIDE STONES */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-amber-50/50 text-amber-950 font-bold uppercase tracking-wider border-b border-gray-300">
                  <th className="p-2.5 border-r border-gray-300 w-1/4">
                    Shape
                  </th>
                  <th className="p-2.5 border-r border-gray-300 w-1/4">Type</th>
                  <th className="p-2.5 border-r border-gray-300 w-1/4">
                    Quantity
                  </th>
                  <th className="p-2.5 w-1/4">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sideStones.map((item: SideStoneItem) => (
                  <tr
                    key={item.shape}
                    className="hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="p-2.5 font-bold text-sm text-gray-800 bg-slate-50/50 border-r border-gray-200 align-middle">
                      {item.shape}
                    </td>
                    {/* Gem Type */}
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        readOnly
                        value={item.type || ""}
                        placeholder="Gem type..."
                        className="w-full px-2 py-1.5 border-r-2 border-gray-300 rounded-sm bg-gray-50 outline-none text-left text-gray-700 cursor-not-allowed font-medium text-xs"
                      />
                    </td>
                    {/* Quantity */}
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        readOnly
                        value={item.qty ?? ""}
                        placeholder="0"
                        className="w-full px-2 py-1.5  border-r-2 border-gray-300 rounded-sm outline-none text-right font-mono font-medium bg-gray-50 text-xs"
                      />
                    </td>
                    {/* Cost */}
                    <td className="p-1.5 align-middle">
                      <input
                        type="text"
                        value={item.cost}
                        readOnly
                        placeholder="0"
                        className="w-full px-2 py-1.5  rounded-sm ring-amber-500/40 outline-none text-right font-mono font-medium text-amber-700 text-xs bg-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoneDetailsForm() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-center text-sm text-gray-500">
          Loading Stone Details...
        </div>
      }
    >
      <StoneFormContent />
    </Suspense>
  );
}
