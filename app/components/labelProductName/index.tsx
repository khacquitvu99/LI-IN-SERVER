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
    <div className="bg-linear-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-xl flex items-center justify-between">
      <div className="flex items-center space-x-3 w-full">
        {/* Khung chứa danh sách các thông tin */}
        <div className="w-full flex items-center justify-between gap-6">
          {/* Phần 1: Product Name (Nằm bên trái) kèm Icon */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center space-x-2 mb-1">
              <Package className="w-5 h-5 text-amber-200" />
              <span className="text-xs uppercase tracking-wider text-amber-100 font-semibold block">
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
              className="bg-transparent text-xl font-extrabold text-white placeholder-amber-200 uppercase tracking-wide w-full focus:outline-none pb-0.5 "
            />
          </div>

          {/* Phần 2: Expected Delivery Date (Nằm bên phải) */}
          <div className="flex-1 flex flex-col justify-right items-end">
            <span className="text-xs uppercase tracking-wider text-amber-100 font-semibold block mb-1">
              <CalendarFold className="w-4 h-4 text-amber-100 inline mr-1" />
              Expected Delivery Date
            </span>
            <input
              type="text"
              value={dateFinished}
              readOnly={!isEditable}
              onChange={(e) => {
                if (isEditable) {
                  setDateFinished(e.target.value);
                }
              }}
              placeholder="N/A"
              className="text-right bg-transparent text-sm font-semibold text-white placeholder-amber-200 w-full focus:outline-none pb-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
