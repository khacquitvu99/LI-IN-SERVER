"use client";

import { useState, useRef, useEffect } from "react";
import { X, Printer } from "lucide-react";
import { ExportModalProps, GemItem } from "@/types";
import { useReactToPrint } from "react-to-print";

export default function ExportModal({
  isOpen,
  onClose,
  itemCode = "",
  productId = null,
}: ExportModalProps) {
  // State form chỉ lưu dữ liệu load lên từ API
  const [formData, setFormData] = useState({
    itemCode: itemCode,
    productName: "",
    materialType: "",
    materialWeight: "",
    labor: "",
    sale: "",
    amount: "",
  });
  // State danh sách Gemstone chỉ đọc
  const [gemstoneList, setGemstoneList] = useState<GemItem[]>([]);

  const componentRef = useRef(null);

  const [cadImage, setCadImage] = useState<string | null>(null);
  const [renderImage, setRenderImage] = useState<string | null>(null);

  // 🌟 GỌI 3 API RIÊNG BIỆT ĐỂ LOAD DỮ LIỆU LÊN
  useEffect(() => {
    if (isOpen && productId) {
      const fetchAllData = async () => {
        try {
          // 1. FETCH 1: Lấy thông tin Product
          const resProduct = await fetch(`/api/product?productID=${productId}`);
          const dataProduct = await resProduct.json();
          if (dataProduct.success && dataProduct.product) {
            const p = dataProduct.product;
            setFormData((prev) => ({
              ...prev,
              productName: p.productName || "",
            }));
          }

          // 2. FETCH 2: Lấy thông tin Material
          const resMaterial = await fetch(
            `/api/material?productID=${productId}`,
          );
          const dataMaterial = await resMaterial.json();
          const matItem = Array.isArray(dataMaterial)
            ? dataMaterial[0]
            : dataMaterial.material;

          if (matItem) {
            setFormData((prev) => ({
              ...prev,
              materialType: matItem.type || "",
              materialWeight: matItem.finishedWeight || "",
            }));
          }

          // 3. FETCH 3: Lấy danh sách Gemstone (Nhiều dòng)
          const resGem = await fetch(`/api/gemstone?productID=${productId}`);
          const dataGem = await resGem.json();
          console.log("Fetched gemstone data:", dataGem);
          const rawGems = Array.isArray(dataGem)
            ? dataGem
            : dataGem.gemstone || [];

          if (rawGems.length > 0) {
            const formattedGems = rawGems.map((g: any) => ({
              gemType: g.gemType || g.type || g.GemType || "",
              weight: g.weight || "",
            }));
            console.log("Formatted gemstone list:", formattedGems);
            setGemstoneList(formattedGems);
          } else {
            setGemstoneList([]);
          }
        } catch (error) {
          console.error("❌ Lỗi khi fetch dữ liệu export:", error);
        } finally {
        }
      };

      fetchAllData();
    } else if (!isOpen) {
      // Reset sạch sẽ khi đóng modal
      setFormData({
        itemCode: itemCode,
        productName: "",
        materialType: "",
        materialWeight: "",
        labor: "",
        sale: "",
        amount: "",
      });
      setGemstoneList([]);
      setCadImage(null);
      setRenderImage(null);
    }
  }, [isOpen, productId, itemCode]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Product-Details",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200/80 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500/10 border-b border-amber-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-1.5 h-5 bg-amber-600 rounded-full" />
            <h3 className="text-base font-bold text-amber-950 uppercase tracking-wide">
              Export Product Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-800/60 hover:text-amber-950 hover:bg-amber-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div ref={componentRef} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CỘT BÊN TRÁI */}
            <div className="space-y-4">
              {/* Product Name */}
              <div className="flex items-center gap-3">
                <label className="w-24 font-bold text-amber-950 text-xs uppercase tracking-wider">
                  Prod. Name
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  readOnly
                  className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg bg-amber-50/50 text-amber-950 font-semibold text-sm outline-none cursor-default"
                />
              </div>

              {/* Material */}
              <div className="border border-amber-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-amber-100/60 px-3 py-1.5 font-bold text-xs text-amber-900 border-b border-amber-200/80 uppercase tracking-wider">
                  Material
                </div>
                <div className="bg-amber-50/80 grid grid-cols-12 gap-1 px-3 py-1 text-[11px] font-bold text-amber-800 border-b border-amber-100 items-center uppercase">
                  <span className="col-span-6">Type</span>
                  <span className="col-span-6 text-right">Weight (gr)</span>
                </div>
                <div className="p-2.5 grid grid-cols-12 gap-2 bg-white">
                  <input
                    type="text"
                    value={formData.materialType}
                    readOnly
                    className="col-span-6 px-2.5 py-1.5 text-xs border-r-2 border-amber-200/80 rounded-sm bg-amber-50/20 text-amber-950 outline-none cursor-default"
                  />
                  <input
                    type="text"
                    value={formData.materialWeight}
                    readOnly
                    className="col-span-6 px-2.5 py-1.5 text-xs rounded-sm bg-amber-50/20 text-amber-950 text-right font-mono outline-none cursor-default"
                  />
                </div>
              </div>

              {/* Gemstone (Nhiều dòng động - Chỉ đọc) */}
              <div className="border border-amber-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-amber-100/60 px-3 py-1.5 font-bold text-xs text-amber-900 border-b border-amber-200/80 uppercase tracking-wider">
                  Gemstone
                </div>

                <div className="bg-amber-50/80 grid grid-cols-12 gap-1 px-3 py-1 text-[11px] font-bold text-amber-800 border-b border-amber-100 items-center uppercase">
                  <span className="col-span-6">Type</span>
                  <span className="col-span-6 text-right">Weight (ct)</span>
                </div>

                <div className="divide-y divide-amber-100 bg-white">
                  {gemstoneList.length > 0 ? (
                    gemstoneList.map((gem, index) => (
                      <div
                        key={index}
                        className="p-2.5 grid grid-cols-12 gap-2 items-center"
                      >
                        {/* type */}
                        <input
                          type="text"
                          value={gem.gemType}
                          readOnly
                          className="col-span-6 px-2.5 py-1.5 text-xs border-r-2 border-amber-200/80 rounded-sm bg-amber-50/20 text-amber-950 outline-none cursor-default"
                        />
                        {/* weight */}
                        <input
                          type="text"
                          value={gem.weight}
                          readOnly
                          className="col-span-6 px-2.5 py-1.5 text-xs rounded-sm bg-amber-50/20 text-amber-950 text-right font-mono outline-none cursor-default"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-400 italic">
                      No gemstone data
                    </div>
                  )}
                </div>
              </div>

              {/* Labo / Sale / Amount */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-200/80">
                  <label className="w-20 font-bold text-xs text-amber-900 uppercase">
                    Labor
                  </label>
                  <input
                    type="text"
                    value={formData.labor}
                    readOnly
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-amber-200 rounded-md text-amber-950 font-mono outline-none cursor-default"
                  />
                </div>

                <div className="flex items-center bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-200/80">
                  <label className="w-20 font-bold text-xs text-amber-900 uppercase">
                    Sale
                  </label>
                  <input
                    type="text"
                    value={formData.sale}
                    readOnly
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-amber-200 rounded-md text-amber-950 font-mono outline-none cursor-default"
                  />
                </div>

                <div className="flex items-center bg-amber-100/70 px-3 py-2 rounded-lg border border-amber-300">
                  <label className="w-20 font-extrabold text-xs text-amber-950 uppercase">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    readOnly
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-md text-amber-950 font-bold font-mono outline-none cursor-default"
                  />
                </div>
              </div>
            </div>

            {/* CỘT BÊN PHẢI (Ảnh CAD & Render - Chỉ hiển thị) */}
            <div className="flex flex-col gap-3.5 min-h-80">
              <div className="flex-1 bg-amber-50/40 rounded-xl border-2 border-dashed border-amber-300 relative flex flex-col items-center justify-center text-amber-900 overflow-hidden group">
                {cadImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={cadImage}
                    alt="CAD"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full p-4">
                    <span className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                      CAD Image
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-amber-50/40 rounded-xl border-2 border-dashed border-amber-300 relative flex flex-col items-center justify-center text-amber-900 overflow-hidden group">
                {renderImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={renderImage}
                    alt="Render"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full p-4">
                    <span className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                      Render Image
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-amber-50/40 border-t border-amber-200/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Export
          </button>
        </div>
      </div>
    </div>
  );
}
