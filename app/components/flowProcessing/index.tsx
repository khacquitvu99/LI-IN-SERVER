"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  PencilRuler,
  Printer,
  Flame,
  Waves,
  Gem,
  Sparkles,
  Layers,
  CircleCheck,
  Clock,
} from "lucide-react";

const stages = [
  { name: "New Order", Icon: Clock }, // 1
  { name: "Quotation", Icon: FileText }, // 2
  { name: "Design 3D", Icon: PencilRuler }, // 3
  { name: "Printing/CNC", Icon: Printer }, // 4
  { name: "Casting", Icon: Flame }, // 5
  { name: "Sanding", Icon: Waves }, // 6
  { name: "Setting Gem", Icon: Gem }, // 7
  { name: "Polishing", Icon: Sparkles }, // 8
  { name: "Plating", Icon: Layers }, // 9
  { name: "Completed", Icon: CircleCheck }, // 10
];

export default function ProductionProgress() {
  const searchParams = useSearchParams();
  const pID = searchParams.get("productId");

  const [currentStage, setCurrentStage] = useState<number>(1);
  const [productName, setProductName] = useState<string>(""); // 👈 Thêm state lưu tên sản phẩm
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!pID) {
      setCurrentStage(1);
      setProductName("");
      return;
    }

    const fetchProductProgress = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/product?productID=${pID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textData = await response.text();
        if (!textData || textData.trim() === "") {
          return;
        }

        const result = JSON.parse(textData);
        const productData = result.product || result.data || result;

        if (productData) {
          // 1. Lấy trạng thái sản phẩm
          const statusFromDB =
            productData.productStatus ??
            productData.ProductStatus ??
            productData.status ??
            1;
          setCurrentStage(Number(statusFromDB));

          // 2. Lấy tên sản phẩm (bám sát logic chuẩn của LabelContent)
          const nameFromDB =
            productData.ProductName ||
            productData.productName ||
            productData.name ||
            `PRODUCT #${pID}`;
          setProductName(nameFromDB);
        }
      } catch (error) {
        console.error("❌ Error fetching product progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductProgress();
  }, [pID]);

  const normalizedStage = Math.max(1, currentStage || 1);
  const currentIndex = normalizedStage - 1;
  const progress = Math.round((normalizedStage / stages.length) * 100);

  return (
    <section className="rounded-2xl border-gray-200 bg-white p-5 shadow-lg">
      {/* Product Name */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          {/* Hiển thị Tên sản phẩm kết hợp ID trên tiêu đề */}
          <h2 className="text-lg font-semibold text-slate-800">
            <span className="text-amber-600 font-bold uppercase">
              {productName}
            </span>
          </h2>
          {loading && (
            <span className="text-xs text-slate-400">
              Đang đồng bộ từ DB...
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-amber-600">{progress}%</span>
      </div>
      {/* hien thi phan tram */}
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
        {stages.map((stage, index) => {
          const Icon = stage.Icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={stage.name}
              className="flex flex-col items-center text-center"
            >
              <div
                className={`mb-2 flex size-10 items-center justify-center rounded-xl text-xs
                  ${
                    isCompleted
                      ? "bg-green-100 text-green-600"
                      : isCurrent
                        ? "bg-amber-100 text-amber-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
              >
                {isCompleted ? <CircleCheck size={20} /> : <Icon size={20} />}
              </div>

              <span className="text-xs font-medium text-slate-800 line-clamp-1">
                {stage.name}
              </span>
              <span className="mt-1 text-[10px] text-amber-600">
                {isCompleted
                  ? "Success"
                  : isCurrent
                    ? "In Progress"
                    : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
