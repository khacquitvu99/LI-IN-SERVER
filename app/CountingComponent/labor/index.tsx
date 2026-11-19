"use client";

import React, {
  useState,
  ChangeEvent,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { DollarSign, Calculator } from "lucide-react";
import { useDesignStore } from "@/store/zustandStore";
import { CostData } from "@/types";

const LABOR_FIELDS: { key: keyof CostData; label: string }[] = [
  { key: "design3d", label: "Design 3D" },
  { key: "printing3d", label: "Printing 3D" },
  { key: "casting", label: "Casting" },
  { key: "sanding", label: "Sanding" },
  { key: "settinggem", label: "SettingGem" },
  { key: "polishing", label: "Polishing" },
  { key: "plating", label: "Plating" },
];

const PRODUCTION_COST_FIELDS: { key: keyof CostData; label: string }[] = [
  { key: "cpsxChung", label: "Manufacturing overhead" },
  { key: "cpsxSp", label: "Product manufacturing" },
];

interface ProductionCostFormProps {
  productId: number | null;
}

// Định nghĩa ref handle để component cha gọi hàm saveData()
export interface ProductionCostFormHandle {
  saveData: () => Promise<void>;
}

const ProductionCostForm = forwardRef<
  ProductionCostFormHandle,
  ProductionCostFormProps
>(({ productId }, ref) => {
  const [costs, setCosts] = useState<CostData>({
    design3d: 0,
    printing3d: 0,
    casting: 0,
    sanding: 0,
    settinggem: 0,
    polishing: 0,
    plating: 0,
    cpsxChung: 0,
    cpsxSp: 0,
    price: 0,
  });

  const [loading, setLoading] = useState(false);

  // Lấy dữ liệu được truyền từ store Zustand
  const { selectedProduct } = useDesignStore();

  const sideStones = selectedProduct?.sideStones || [];
  const centerStones = selectedProduct?.centerStones || [];

  // 1. Tự động Fetch dữ liệu từ API GET khi productId thay đổi
  useEffect(() => {
    if (!productId) return;

    async function fetchCostData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/productCost?productID=${productId}`);
        const result = await res.json();

        if (result.success && result.data) {
          // Map dữ liệu từ DB (đã camelizeKeys) vào state form
          setCosts({
            design3d: result.data.design3D ?? 0,
            printing3d: result.data.printing3D ?? 0,
            casting: result.data.casting ?? 0,
            sanding: result.data.sanding ?? 0,
            settinggem: result.data.settingGem ?? 0,
            polishing: result.data.polishing ?? 0,
            plating: result.data.plating ?? 0,
            cpsxChung: result.data.cpsxChung ?? 0,
            cpsxSp: result.data.cpsxSp ?? 0,
            price: result.data.price ?? 0,
          });
        } else {
          // BỔ SUNG: Reset form về 0 ngay khi sản phẩm chưa có dữ liệu cost
          setCosts({
            design3d: 0,
            printing3d: 0,
            casting: 0,
            sanding: 0,
            settinggem: 0,
            polishing: 0,
            plating: 0,
            cpsxChung: 0,
            cpsxSp: 0,
            price: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching product cost:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCostData();
  }, [productId]);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCosts((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  // 2. Expose hàm saveData ra ngoài qua ref để nút Save ở Footer gọi
  useImperativeHandle(ref, () => ({
    async saveData() {
      if (!productId) {
        alert("Please select a product first!");
        return;
      }

      // Tính tổng grandTotalCost để lưu vào trường price (hoặc tùy chỉnh theo DB của Qui)
      const totalProcessCost = Object.values(costs).reduce(
        (acc, curr) => acc + curr,
        0,
      );
      const totalSideCost = sideStones.reduce(
        (acc: number, item: any) => acc + Number(item.cost || 0),
        0,
      );
      const totalCenterCost = centerStones.reduce(
        (acc: number, item: any) => acc + Number(item.cost || 0),
        0,
      );
      const grandTotalCost = totalSideCost + totalCenterCost + totalProcessCost;

      const res = await fetch("/api/productCost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId,
          design3D: costs.design3d,
          printing3D: costs.printing3d,
          casting: costs.casting,
          sanding: costs.sanding,
          settingGem: costs.settinggem,
          polishing: costs.polishing,
          plating: costs.plating,
          cpsxChung: costs.cpsxChung,
          cpsxSp: costs.cpsxSp,
          price: grandTotalCost, // Lưu tổng chi phí vào Price
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("Product cost saved successfully!");
      } else {
        alert(`Failed to save: ${result.message}`);
      }
    },
  }));

  // Tính toán tổng hiển thị trên giao diện
  const totalProcessCost = Object.values(costs).reduce(
    (acc, curr) => acc + curr,
    0,
  );
  const totalSideCost = sideStones.reduce(
    (acc: number, item: any) => acc + Number(item.cost || 0),
    0,
  );
  const totalCenterCost = centerStones.reduce(
    (acc: number, item: any) => acc + Number(item.cost || 0),
    0,
  );
  const grandTotalCost = totalSideCost + totalCenterCost + totalProcessCost;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-xl">
        Loading cost data...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2.5 border-b border-amber-200/60 pb-3">
        <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          Manufacturing costs
        </h2>
      </div>

      <div className="space-y-6">
        {/* 1. BẢNG LABOR / PROCESS COST */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-amber-50/50 text-amber-950 font-bold text-center py-2 uppercase tracking-wider text-md border-b border-gray-300">
            Process Cost
          </div>
          <table className="w-full border-collapse text-xs">
            <tbody className="divide-y divide-gray-200">
              {LABOR_FIELDS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="w-1/3 p-2.5 font-semibold text-sm text-gray-700 bg-slate-50/50 border-r border-gray-200">
                    {label}
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      name={key}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      value={costs[key] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handleChange({
                            target: { name: key, value: "" },
                          } as any);
                          return;
                        }
                        const numVal = Math.max(0, Number(val) || 0);
                        handleChange({
                          target: { name: key, value: String(numVal) },
                        } as any);
                      }}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 outline-none text-right font-mono font-medium text-gray-900"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. BẢNG CHI PHÍ SX */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-amber-50/50 text-amber-950 font-bold text-center py-2 text-md uppercase tracking-wider border-b border-gray-300">
            Manufacturing costs
          </div>
          <table className="w-full border-collapse text-xs">
            <tbody className="divide-y divide-gray-200">
              {PRODUCTION_COST_FIELDS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="w-1/3 p-2.5 font-semibold text-sm text-gray-700 bg-slate-50/50 border-r border-gray-200">
                    {label}
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      name={key}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      value={costs[key] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handleChange({
                            target: { name: key, value: "" },
                          } as any);
                          return;
                        }
                        const numVal = Math.max(0, Number(val) || 0);
                        handleChange({
                          target: { name: key, value: String(numVal) },
                        } as any);
                      }}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 outline-none text-right font-mono font-medium text-gray-900"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. BẢNG TOTAL */}
        <div className="border-2 border-amber-500 rounded-xl overflow-hidden shadow-xs bg-amber-50/30">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="w-1/3 p-3 font-bold text-amber-950 uppercase border-r border-amber-300 bg-amber-100/60 align-middle">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Total</span>
                  </div>
                </td>
                <td className="p-3 text-right font-mono font-bold text-base text-amber-700 align-middle">
                  {grandTotalCost.toLocaleString("vi-VN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

ProductionCostForm.displayName = "ProductionCostForm";
export default ProductionCostForm;
