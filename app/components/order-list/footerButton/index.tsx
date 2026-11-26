"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExportModal from "@/CountingComponent/formexport";
import { Download, TriangleAlert } from "lucide-react";
import EditProductModal from "@/components/order-list/editProductModal";

interface FooterProps {
  onSave?: () => void;
  onUpdated?: () => void;
  itemCode?: string;
  productName?: string;
}

async function parseJsonSafely(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export default function Footer({
  onSave,
  onUpdated,
  itemCode = "",
  productName = "",
}: FooterProps) {
  const router = useRouter();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>("");

  const searchParams = useSearchParams();
  const rawProductId =
    searchParams.get("productID") ?? searchParams.get("productId");
  const parsedId = rawProductId ? Number(rawProductId) : NaN;
  const productId =
    rawProductId && Number.isFinite(parsedId) && parsedId > 0
      ? parsedId
      : rawProductId || null;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<
    string | number | null
  >(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDeleteClick = (
    id: string | number,
    displayName?: string,
    productCode?: string,
  ) => {
    if (!id) {
      alert("Product ID not found for deletion!");
      return;
    }
    setSelectedProductId(id);
    setSelectedProductName(displayName || productCode || `Sản phẩm #${id}`);
    setIsDeleteModalOpen(true);
  };

  const handleOpenDeleteModal = async () => {
    if (!productId) {
      alert("Không tìm thấy ID sản phẩm trên URL để xóa!");
      return;
    }

    const fallbackLabel = productName || itemCode || `Product #${productId}`;
    handleDeleteClick(productId, fallbackLabel);

    try {
      const res = await fetch(
        `/api/product?productID=${encodeURIComponent(String(productId))}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;

      const data = await parseJsonSafely(res);
      const productObj = data.product || data.data || {};
      const fetchedName =
        productObj.productName ||
        productObj.ProductName ||
        productObj.productCode ||
        productObj.ProductCode;

      if (fetchedName) {
        setSelectedProductName(String(fetchedName));
      }
    } catch {
      // Giữ tên fallback nếu không lấy thêm được chi tiết
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProductId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/product?productID=${encodeURIComponent(String(selectedProductId))}`,
        {
          method: "DELETE",
        },
      );
      const result = await parseJsonSafely(response);

      if (response.ok && result.success !== false) {
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
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-gray-100 mx-auto">
        {/* Save */}
        <button
          type="button"
          onClick={() => {
            console.log("🟢 Nút Save trong Footer đã được click!");
            if (onSave) {
              onSave();
            } else {
              console.warn("⚠️ Cảnh báo: onSave đang bị undefined!");
            }
          }}
          className="h-9 sm:h-10 px-3.5 sm:px-5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0"
        >
          Save
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => {
            if (!productId) {
              alert("Product ID not found for editing!");
              return;
            }
            setIsEditOpen(true);
          }}
          className="h-9 sm:h-10 px-3.5 sm:px-5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <span>Edit</span>
        </button>

        {/* Delete Order */}
        <button
          type="button"
          onClick={handleOpenDeleteModal}
          disabled={isDeleting}
          className="h-9 sm:h-10 px-3.5 sm:px-5 bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center whitespace-nowrap shrink-0"
        >
          {isDeleting ? "Deleting..." : "Delete Order"}
        </button>

        {/* Export */}
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="h-9 sm:h-10 px-3.5 sm:px-5 bg-gray-800 hover:bg-gray-700 active:bg-black text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span>Export</span>
        </button>
      </div>

      {/* MODAL SỬA SẢN PHẨM */}
      <EditProductModal
        isOpen={isEditOpen}
        productId={productId}
        onClose={() => setIsEditOpen(false)}
        onUpdated={() => {
          onUpdated?.();
          router.refresh();
        }}
      />

      {/* MODAL EXPORT */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        itemCode={itemCode}
        productId={typeof productId === "number" ? productId : null}
      />

      {/* MODAL XÁC NHẬN XÓA */}
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
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
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
