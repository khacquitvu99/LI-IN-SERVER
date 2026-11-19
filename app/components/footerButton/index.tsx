"use client";

import { useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import ExportModal from "@/CountingComponent/formexport";
import { Download, TriangleAlert } from "lucide-react";

interface FooterProps {
  onSave?: () => void;
  itemCode?: string;
  productName?: string;
}

export default function Footer({ onSave, itemCode = "" }: FooterProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  // Lấy pathname và searchParams từ Next.js router
  const pathname = usePathname();
  const isCountingPage = pathname?.includes("counting");

  const searchParams = useSearchParams();
  const rawProductId = searchParams.get("productId");
  // Ép kiểu productId sang kiểu number (hoặc null nếu không có) để khớp với logic xóa
  const productId = rawProductId ? Number(rawProductId) : null;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  // Hàm xử lý mở modal xác nhận xóa
  const handleDeleteClick = (
    id: number,
    productName?: string,
    productCode?: string,
  ) => {
    if (!id) {
      alert("Product ID not found for deletion!");
      return;
    }
    setSelectedProductId(id);
    setIsDeleteModalOpen(true);

    // Ưu tiên hiển thị tên sản phẩm, nếu không có thì lấy mã code, cuối cùng mới là "N/A"
    setSelectedProductName(productName || productCode || "Sản phẩm #" + id);
  };
  // Hàm xử lý khi bấm nút "Yes, Delete" bên trong Modal
  const handleConfirmDelete = async () => {
    if (!selectedProductId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/product?productID=${selectedProductId}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();

      if (response.ok && result.success) {
        setIsDeleteModalOpen(false);
        setSelectedProductId(null);
        setSelectedProductName("");
        window.location.href = "/counting";
      } else {
        alert(
          `Delete failed: ${result.error || result.message || "An unknown error occurred!!"}`,
        );
      }
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      error instanceof Error
        ? alert(error.message)
        : alert("Error connect server!");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 sm:gap-3 pt-2">
        {/* Save */}
        <button
          type="button"
          onClick={() => {
            console.log("🟢 Nút Save trong Footer đã được click!");
            if (onSave) {
              onSave(); // Gọi hàm từ cha truyền xuống
            } else {
              console.warn("⚠️ Cảnh báo: onSave đang bị undefined!");
            }
          }}
          className="px-3.5 sm:px-6 py-1.5 sm:py-2.5 bg-amber-600 hover:bg-amber-300 active:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Save
        </button>

        {/* NÚT DELETE CHỈ HIỂN THỊ KHI Ở TRANG COUNTING */}
        {isCountingPage && (
          <button
            type="button"
            onClick={async () => {
              if (productId) {
                try {
                  const res = await fetch(
                    `/api/product?productID=${productId}`,
                  );
                  const data = await res.json();

                  // Hứng linh hoạt cả ProductName (PascalCase) lẫn productName (camelCase)
                  const productObj = data.product || {};
                  const pName = data.success
                    ? productObj.productName || productObj.productCode
                    : null;

                  handleDeleteClick(productId, pName);
                } catch (error) {
                  handleDeleteClick(productId, "Product #" + productId);
                }
              }
            }}
            disabled={isDeleting}
            className="px-3.5 sm:px-6 py-1.5 sm:py-2.5 bg-amber-800 hover:bg-amber-500 active:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Order"}
          </button>
        )}

        {/* NÚT EXPORT */}
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="px-3.5 sm:px-6 py-1.5 sm:py-2.5 bg-gray-800 hover:bg-gray-500 active:bg-black text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0" />
          <span>Export</span>
        </button>
      </div>

      {/* MODAL EXPORT - Đã truyền trực tiếp productId từ param URL vào */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        itemCode={itemCode}
        productId={productId}
      />

      {/* --- MODAL XÁC NHẬN XÓA --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity animate-fadeIn">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-2xl border border-amber-100 transform transition-all scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full text-amber-600">
              <TriangleAlert className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              Are you sure you want to delete product:{" "}
              <span className="font-bold text-amber-700">
                {selectedProductName || "Sản phẩm"}
              </span>{" "}
              ?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
