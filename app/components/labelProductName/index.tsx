"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Package, CalendarFold } from "lucide-react";

interface LabelProps {
  isEditable?: boolean; // Mặc định là false (khóa)
}

export default function LabelContent({ isEditable = false }: LabelProps) {
  // 1. Lấy trực tiếp productId từ URL Search Params (?productId=...)
  const searchParams = useSearchParams();
  const pID = searchParams.get("productId");

  const [productName, setProductName] = useState<string>("");
  const [dateFinished, setDateFinished] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Hàm format ngày tháng từ chuỗi ISO (VD: 2026-10-29T00:00:00.000Z -> 29/10/2026)
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${day}/${month}/${year}`;
  };

  // 2. Tự động fetch thông tin sản phẩm khi pID trên URL thay đổi
  useEffect(() => {
    if (!pID) {
      setProductName("");
      setDateFinished("");
      return;
    }

    const fetchProductDetails = async () => {
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
          setProductName(`PRODUCT #${pID}`);
          setDateFinished("");
          return;
        }

        const result = JSON.parse(textData);
        const productData = result.product || result.data || result;

        if (productData) {
          setProductName(
            productData.ProductName ||
              productData.productName ||
              productData.name ||
              `PRODUCT #${pID}`,
          );

          const rawDate =
            productData.DateFinished ||
            productData.dateFinished ||
            productData.finishedDate ||
            "";

          setDateFinished(formatDate(rawDate));
        } else {
          setProductName(`PRODUCT #${pID}`);
          setDateFinished("");
        }
      } catch (error) {
        console.error("❌ Error fetching product details:", error);
        setProductName(`PRODUCT #${pID}`);
        setDateFinished("");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [pID]);

  return (
    <div className="bg-linear-to-r from-amber-500 to-amber-600 rounded-xl p-3 sm:p-4 text-white shadow-xl flex items-center justify-between">
      <div className="w-full flex items-center justify-between gap-2.5 sm:gap-6 min-w-0">
        {/* Phần 1: Product Name (Nằm bên trái) kèm Icon */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 sm:space-x-2 mb-0.5 sm:mb-1">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 shrink-0" />
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-100 font-semibold truncate">
              Product Name
            </span>
          </div>
          <input
            type="text"
            value={productName}
            readOnly={!isEditable}
            onChange={(e) => {
              if (isEditable) {
                setProductName(e.target.value);
              }
            }}
            placeholder="NO PRODUCT SELECTED..."
            className="bg-transparent text-sm sm:text-xl font-extrabold text-white placeholder-amber-200 uppercase tracking-wide w-full min-w-0 focus:outline-none pb-0.5"
          />
        </div>

        {/* Phần 2: Ngày tháng (Nằm bên phải) */}
        <div className="flex flex-col items-end shrink-0 max-w-[42%] sm:max-w-none">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-100 font-semibold flex items-center gap-1 mb-0.5 sm:mb-1 whitespace-nowrap">
            <CalendarFold className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100 shrink-0" />
            <span>Delivery Date</span>
          </span>
          <input
            type="text"
            value={(() => {
              if (!dateFinished) return "";
              const parsed = new Date(dateFinished);
              if (!isNaN(parsed.getTime())) {
                const day = String(parsed.getDate()).padStart(2, "0");
                const month = String(parsed.getMonth() + 1).padStart(2, "0");
                return `${day}/${month}`;
              }
              return dateFinished;
            })()}
            readOnly={!isEditable}
            onChange={(e) => {
              if (isEditable) {
                setDateFinished(e.target.value);
              }
            }}
            placeholder="N/A"
            className="text-right bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-amber-200 w-full focus:outline-none pb-0.5"
          />
        </div>
      </div>
    </div>
  );
}
