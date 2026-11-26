"use client";

import {
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

// Chỉ cộng các trường chi phí, không cộng ngược lại trường `price`
const COST_SUM_KEYS: (keyof CostData)[] = [
  ...LABOR_FIELDS.map((f) => f.key),
  ...PRODUCTION_COST_FIELDS.map((f) => f.key),
];

const INITIAL_COSTS: CostData = {
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
};

function sanitizeNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number") {
    return Number.isFinite(val) && val >= 0 ? val : fallback;
  }
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) return fallback;
    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  }
  return fallback;
}

function roundDecimal(val: number, decimals = 4): number {
  if (!Number.isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

interface ProductionCostFormProps {
  productId: number | null;
}

export interface ProductionCostFormHandle {
  saveData: () => Promise<void>;
}

const ProductionCostForm = forwardRef<
  ProductionCostFormHandle,
  ProductionCostFormProps
>(({ productId }, ref) => {
  const [costs, setCosts] = useState<CostData>(INITIAL_COSTS);
  const [loading, setLoading] = useState<boolean>(false);

  const { selectedProduct } = useDesignStore();
  const sideStones = selectedProduct?.sideStones || [];
  const centerStones = selectedProduct?.centerStones || [];

  // 1. Tự động fetch dữ liệu từ API GET khi productId thay đổi
  useEffect(() => {
    if (!productId) {
      setCosts(INITIAL_COSTS);
      return;
    }

    let cancelled = false;

    async function fetchCostData() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/productCost?productID=${encodeURIComponent(String(productId))}`,
          { cache: "no-store" },
        );
        const result = await res.json();

        if (cancelled) return;

        if (result.success && result.data) {
          setCosts({
            design3d: sanitizeNumber(
              result.data.design3D ?? result.data.design3d,
              0,
            ),
            printing3d: sanitizeNumber(
              result.data.printing3D ?? result.data.printing3d,
              0,
            ),
            casting: sanitizeNumber(result.data.casting, 0),
            sanding: sanitizeNumber(result.data.sanding, 0),
            settinggem: sanitizeNumber(
              result.data.settingGem ?? result.data.settinggem,
              0,
            ),
            polishing: sanitizeNumber(result.data.polishing, 0),
            plating: sanitizeNumber(result.data.plating, 0),
            cpsxChung: sanitizeNumber(result.data.cpsxChung, 0),
            cpsxSp: sanitizeNumber(result.data.cpsxSp, 0),
            price: sanitizeNumber(result.data.price, 0),
          });
        } else {
          setCosts(INITIAL_COSTS);
        }
      } catch (error) {
        console.error("Error fetching product cost:", error);
        if (!cancelled) {
          setCosts(INITIAL_COSTS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCostData();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCosts((prev) => ({
      ...prev,
      [name]: sanitizeNumber(value, 0),
    }));
  };

  // Tính toán tổng chi phí
  const totalProcessCost = roundDecimal(
    COST_SUM_KEYS.reduce((acc, key) => acc + sanitizeNumber(costs[key], 0), 0),
  );
  const totalSideCost = roundDecimal(
    sideStones.reduce(
      (acc: number, item: any) => acc + sanitizeNumber(item?.cost, 0),
      0,
    ),
  );
  const totalCenterCost = roundDecimal(
    centerStones.reduce(
      (acc: number, item: any) => acc + sanitizeNumber(item?.cost, 0),
      0,
    ),
  );
  const grandTotalCost = roundDecimal(
    totalSideCost + totalCenterCost + totalProcessCost,
  );

  // 2. Expose hàm saveData ra ngoài qua ref cho nút Save ở Footer
  useImperativeHandle(ref, () => ({
    async saveData() {
      if (!productId) {
        alert("Please select a product first!");
        return;
      }

      const payload = {
        productId: Number(productId),
        productID: Number(productId),
        design3D: sanitizeNumber(costs.design3d, 0),
        printing3D: sanitizeNumber(costs.printing3d, 0),
        casting: sanitizeNumber(costs.casting, 0),
        sanding: sanitizeNumber(costs.sanding, 0),
        settingGem: sanitizeNumber(costs.settinggem, 0),
        polishing: sanitizeNumber(costs.polishing, 0),
        plating: sanitizeNumber(costs.plating, 0),
        cpsxChung: sanitizeNumber(costs.cpsxChung, 0),
        cpsxSp: sanitizeNumber(costs.cpsxSp, 0),
        price: grandTotalCost,
      };

      const res = await fetch("/api/productCost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setCosts((prev) => ({ ...prev, price: grandTotalCost }));
        alert("Product cost saved successfully!");
      } else {
        alert(
          `Failed to save: ${result.message || result.error || "Unknown error"}`,
        );
      }
    },
  }));

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
        Loading cost data...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2.5 border-b border-amber-200/60 pb-3">
        <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          Manufacturing costs
        </h2>
      </div>

      <div className="space-y-6">
        {/* 1. BẢNG PROCESS COST */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-amber-50/50 text-amber-950 font-bold text-center py-2 uppercase tracking-wider text-sm sm:text-base border-b border-gray-300">
            Process Cost
          </div>
          <table className="w-full border-collapse text-xs">
            <tbody className="divide-y divide-gray-200">
              {LABOR_FIELDS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="w-1/3 p-2.5 font-semibold text-xs sm:text-sm text-gray-700 bg-slate-50/50 border-r border-gray-200">
                    {label}
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name={key}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      value={costs[key] || ""}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 outline-none text-right font-mono font-medium text-gray-900"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. BẢNG MANUFACTURING COSTS */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-amber-50/50 text-amber-950 font-bold text-center py-2 text-sm sm:text-base uppercase tracking-wider border-b border-gray-300">
            Manufacturing costs
          </div>
          <table className="w-full border-collapse text-xs">
            <tbody className="divide-y divide-gray-200">
              {PRODUCTION_COST_FIELDS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="w-1/3 p-2.5 font-semibold text-xs sm:text-sm text-gray-700 bg-slate-50/50 border-r border-gray-200">
                    {label}
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name={key}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "+" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      value={costs[key] || ""}
                      onChange={handleChange}
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
