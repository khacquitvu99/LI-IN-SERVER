"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/navigation";
import Fillter from "@/components/fillter";
import Meterials from "@/DesignComponent/material";
import Footer from "@/components/order-list/footerButton";
import ListOrder from "@/components/order-list";
import Laboratory, {
  ProductionCostFormHandle,
} from "@/CountingComponent/labor";
import ExtendGemstone from "@/CountingComponent/extend-gemstone";
import MenuLeft from "@/components/menuleft";
import Label from "@/components/labelProductName";
import Notification from "@/components/notification";

export default function CoutingPage() {
  const searchParams = useSearchParams();
  const productId = Number(searchParams.get("productId")) || null;

  // 1. Tạo ref để liên kết từ cha xuống component Laboratory
  const labFormRef = useRef<ProductionCostFormHandle>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 2. Hàm xử lý khi bấm nút Save ở Footer
  const handleSaveAll = async () => {
    if (!labFormRef.current) {
      alert("Form reference not found!");
      return;
    }

    try {
      setIsSaving(true);

      // 1. Lưu form Laboratory trước
      await labFormRef.current.saveData();

      if (!productId) {
        alert("⚠️ Laboratory saved, Product ID has not yet been identified");
        return;
      }

      const numericProductId = Number(productId);
      const timestamp = new Date().toISOString();

      // 2.1. Cập nhật Status = 3 trong bảng Products
      const updateRes = await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: numericProductId,
          productStatus: 3,
        }),
      });
      const updateResult = await updateRes.json();
      if (!updateRes.ok || !updateResult.success) {
        throw new Error(
          updateResult.message || "Failed to update product status!",
        );
      }

      // 2.2. Gửi log real-time lên WorkflowLogs
      const logRes = await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: numericProductId,
          timestamp,
        }),
      });
      const logResult = await logRes.json();
      if (!logRes.ok || !logResult.success) {
        throw new Error(logResult.message || "Failed to record workflow log!");
      }
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert("Error saving: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans pb-16">
      {/* Thanh điều hướng */}
      <Nav />

      <main className="pt-24 max-w-350 mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* THANH BỘ LỌC TÌM KIẾM THEO MÃ KHÁCH HÀNG */}
        <Notification notifications={[]} />
        <Fillter />

        {/* LAYOUT 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: DANH SÁCH ĐƠN HÀNG */}
          <div className="lg:col-span-4">
            <ListOrder />
            {/* CÁC NÚT BẤM THAO TÁC (LƯU - CẬP NHẬT - IN) */}
            <div className="mt-10 border-t border-gray-300">
              {/* Truyền hàm handleSaveAll xuống Footer qua props onSave */}
              <Footer onSave={handleSaveAll} />
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM & SẢN XUẤT */}
          <div className="lg:col-span-8 space-y-6">
            {/* Label hien thi ProductName */}
            <Label isEditable={false} />
            <div className="max-h-screen overflow-y-auto space-y-6">
              {/* THÔNG TIN GIÁ THỊ TRƯỜNG */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-amber-200 pb-3">
                  <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                    Current Gold & Silver Market Prices
                  </h2>
                </div>

                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Gold Price
                    </label>
                    <input
                      type="text"
                      placeholder="Updating price..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Silver Price
                    </label>
                    <input
                      type="text"
                      placeholder="Updating price..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                    />
                  </div>
                </form>
              </div>

              {/* KHỐI 1: THÔNG TIN SẢN PHẨM */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="flex items-center space-x-2 border-b border-amber-200 pb-3">
                  <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                    DETAILS PRODUCTS
                  </h2>
                </div>
                <Meterials onDataChange={() => {}} disabled={true} />
                <ExtendGemstone />
              </div>

              {/* Labor Các khoản chi phí - Truyền ref và productId xuống */}
              <Laboratory ref={labFormRef} productId={productId} />

              {/* PRODUC PRICE */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-amber-200 pb-3">
                  <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                    Product Price
                  </h2>
                </div>

                <form className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    placeholder="Product Price"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="ml-64">
          <MenuLeft />
        </div>
      </main>
    </div>
  );
}
