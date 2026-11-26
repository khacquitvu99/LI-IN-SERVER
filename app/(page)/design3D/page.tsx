"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import Nav from "@/components/navigation";
import MenuLeft from "@/components/menuleft";
import Filter from "@/components/fillter";
import OrderList from "@/components/order-list";
import LabelProductName from "@/components/labelProductName";
import Notification from "@/components/notification";
import ProductDetailsContent from "@/DesignComponent/productDetail";
import GrillzContent from "@/DesignComponent/grillzProduct";

// Nếu tách ra file riêng (ví dụ "@/types/design"), bạn có thể export lại từ đó để tránh circular import
export type ParentCategory = "product" | "grillz";

interface ProductData {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

function DesignPageContent() {
  // activeTab: null = hiển thị 4 nút lựa chọn lớn, 0 = Order Product, 1 = Grillz, 2 = Watch, 3 = Glasses
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams.get("productId");

  const [pID, setPID] = useState<number>(0);
  const [productData, setProductData] = useState<ProductData | null>(null);

  useEffect(() => {
    if (!productIdFromUrl) return;

    const id = Number(productIdFromUrl);
    if (Number.isNaN(id)) return;

    setPID(id);
    void loadProductData(id);
  }, [productIdFromUrl]);

  const loadProductData = async (productId: number) => {
    try {
      const resProduct = await fetch(`/api/product?productID=${productId}`);
      if (!resProduct.ok) {
        throw new Error(`HTTP error! status: ${resProduct.status}`);
      }
      const dataProduct = await resProduct.json();
      setProductData(dataProduct.product ?? null);
    } catch (error) {
      console.error("Lỗi khi load dữ liệu sản phẩm:", error);
    }
  };

  const handleSelectCategory = (tabIndex: number) => {
    setActiveTab(tabIndex);
    router.replace(pathname, { scroll: false });
  };

  // Hàm quay lại màn hình chọn 4 nút lớn ban đầu
  const handleBackToHome = () => {
    setActiveTab(null);
    router.replace(pathname, { scroll: false });
  };

  return (
    <>
      <Nav />
      <div className="bg-white w-screen h-auto flex">
        <MenuLeft />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-350 h-auto mx-auto p-6 space-y-6 my-6 mt-20 overflow-hidden">
            <Notification />
            <Filter />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <OrderList />
              <div className="lg:col-span-8 space-y-6 h-auto">
                <LabelProductName />

                <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm border border-gray-200">
                  {/* TRẠNG THÁI 1: CHƯA CHỌN GÌ -> HIỂN THỊ 4 NÚT/BLOCK LỚN (2 TRÊN, 2 DƯỚI) */}
                  {activeTab === null && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                        Please Select Category to Proceed:
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* ORDER PRODUCT BLOCK */}
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(0)}
                          className="group p-8 bg-linear-to-br from-amber-50 to-amber-100/60 hover:from-amber-500 hover:to-amber-600 border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-500 group-hover:bg-white text-white group-hover:text-amber-600 flex items-center justify-center font-bold text-lg shadow-sm transition-colors">
                            📦
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider text-amber-900 group-hover:text-white transition-colors">
                            ORDER PRODUCT
                          </span>
                        </button>

                        {/* GRILLZ BLOCK */}
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(1)}
                          className="group p-8 bg-linear-to-br from-amber-50 to-amber-100/60 hover:from-amber-500 hover:to-amber-600 border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-500 group-hover:bg-white text-white group-hover:text-amber-600 flex items-center justify-center font-bold text-lg shadow-sm transition-colors">
                            🦷
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider text-amber-900 group-hover:text-white transition-colors">
                            GRILLZ
                          </span>
                        </button>

                        {/* WATCH BLOCK */}
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(2)}
                          className="group p-8 bg-linear-to-br from-amber-50 to-amber-100/60 hover:from-amber-500 hover:to-amber-600 border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-500 group-hover:bg-white text-white group-hover:text-amber-600 flex items-center justify-center font-bold text-lg shadow-sm transition-colors">
                            ⌚
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider text-amber-900 group-hover:text-white transition-colors">
                            WATCH
                          </span>
                        </button>

                        {/* GLASSES BLOCK */}
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(3)}
                          className="group p-8 bg-linear-to-br from-amber-50 to-amber-100/60 hover:from-amber-500 hover:to-amber-600 border border-amber-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-500 group-hover:bg-white text-white group-hover:text-amber-600 flex items-center justify-center font-bold text-lg shadow-sm transition-colors">
                            👓
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider text-amber-900 group-hover:text-white transition-colors">
                            GLASSES
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TRẠNG THÁI 2: ĐÃ CHỌN -> HIỂN THỊ NÚT BACK VÀ NỘI DUNG TƯƠNG ỨNG */}
                  {activeTab !== null && (
                    <div className="space-y-4">
                      {/* Nút Back quay lại */}
                      <button
                        type="button"
                        onClick={handleBackToHome}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-amber-50 hover:bg-amber-200 rounded-lg transition-all cursor-pointer"
                      >
                        <span>← Back to Selection</span>
                      </button>

                      {/* Nội dung Component con */}
                      <div className="pt-2 h-auto">
                        {activeTab === 0 && (
                          <ProductDetailsContent
                            productId={pID}
                            productData={productData}
                            parentCategory="product"
                          />
                        )}

                        {activeTab === 1 && (
                          <GrillzContent
                            productId={pID}
                            productData={productData}
                            parentCategory="grillz"
                          />
                        )}

                        {activeTab === 2 && (
                          <div className="py-16 text-center text-gray-400 font-medium">
                            Watch section is empty.
                          </div>
                        )}

                        {activeTab === 3 && (
                          <div className="py-16 text-center text-gray-400 font-medium">
                            Glasses section is empty.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DesignPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}
    >
      <DesignPageContent />
    </Suspense>
  );
}
