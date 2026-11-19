"use client";

import { useState } from "react";
import { Plus, X, Package, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { OrderProductTab } from "@/types";
import {
  MATERIAL_OPTIONS,
  GEM_TYPE_OPTIONS,
  CUSTOMER_CODE,
} from "@/components/attribute";

export default function BusinessPage() {
  // Quản lý danh sách các tab sản phẩm
  const [products, setProducts] = useState<OrderProductTab[]>([
    {
      id: "prod-1",
      productName: "Product 1",
      noOrder: "0000",
      category: CUSTOMER_CODE[0]?.value,
      customCategory: "",
      dateCreated: new Date().toISOString().split("T")[0],
      dateFinished: "",
      material: MATERIAL_OPTIONS[1]?.value,
      customMaterial: "",
      gemType: GEM_TYPE_OPTIONS[1]?.value,
      customGemType: "",
      imageUrls: [],
      feedback: "",
    },
  ]);

  // Tab đang được chọn
  const [activeTabId, setActiveTabId] = useState<string>("prod-1");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Thêm sản phẩm mới (tạo tab mới)
  const handleAddProduct = () => {
    const newId = `prod-${Date.now()}`;
    const nextIdx = products.length + 1;
    const newProduct: OrderProductTab = {
      id: newId,
      productName: `Product ${nextIdx}`,
      noOrder: "0000",
      category: CUSTOMER_CODE[0]?.value,
      customCategory: "",
      dateCreated: new Date().toISOString().split("T")[0],
      dateFinished: "",
      material: MATERIAL_OPTIONS[1]?.value,
      customMaterial: "",
      gemType: GEM_TYPE_OPTIONS[1]?.value,
      customGemType: "",
      imageUrls: [],
      feedback: "",
    };

    setProducts((prev) => [...prev, newProduct]);
    setActiveTabId(newId);
  };

  // Xóa tab sản phẩm
  const handleRemoveProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (products.length === 1) return;

    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);

    if (activeTabId === id) {
      setActiveTabId(updated[updated.length - 1].id);
    }
  };

  // Cập nhật giá trị field cho tab đang active
  const handleFieldChange = <K extends keyof OrderProductTab>(
    field: K,
    value: OrderProductTab[K],
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === activeTabId ? { ...p, [field]: value } : p)),
    );
  };

  // Upload nhiều ảnh cho sản phẩm đang active
  const handleMultipleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const promises = fileArray.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newImageUrls) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === activeTabId
            ? { ...p, imageUrls: [...p.imageUrls, ...newImageUrls] }
            : p,
        ),
      );
    });
    e.target.value = "";
  };

  // Xóa ảnh đơn lẻ
  const handleRemoveImage = (imageIndex: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === activeTabId
          ? {
              ...p,
              imageUrls: p.imageUrls.filter((_, idx) => idx !== imageIndex),
            }
          : p,
      ),
    );
  };

  // Lưu toàn bộ danh sách sản phẩm/đơn hàng lên cơ sở dữ liệu Orders
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const processedProducts = [];

      // 1. Duyệt qua từng tab sản phẩm để upload ảnh trước nếu có
      for (const p of products) {
        const finalImageUrls: string[] = [];

        for (const img of p.imageUrls) {
          if (img.startsWith("data:image")) {
            const res = await fetch(img);
            const blob = await res.blob();
            const file = new File([blob], `order_img_${Date.now()}.jpg`, {
              type: blob.type,
            });
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/uploadImage", {
              method: "POST",
              body: formData,
            });
            const uploadResult = await uploadRes.json();
            if (uploadResult.success) {
              finalImageUrls.push(uploadResult.url);
            }
          } else {
            finalImageUrls.push(img);
          }
        }
        // Chuẩn bị dữ liệu chi tiết cho từng sản phẩm
        const custCode =
          p.category === "Other..." ? p.customCategory : p.category;
        const prodCode = p.noOrder;

        const productItem = {
          productName: p.productName,
          productCode: prodCode,
          customerCode: custCode,
          dateCreate: p.dateCreated,
          dateFinished: p.dateFinished,
          feedback: p.feedback,
          image: finalImageUrls.join(","),
          materialType:
            p.material === "Other..." ? p.customMaterial : p.material,
          gemType: p.gemType === "Other..." ? p.customGemType : p.gemType,
          ProductStatus: 1,
        };

        processedProducts.push(productItem);
      }

      // 2. Lấy thông tin từ sản phẩm đầu tiên để tạo OrderID chung
      const firstProduct = products.length > 0 ? products[0] : null;

      const mergCustomerCode = firstProduct
        ? firstProduct.category === "Other..."
          ? firstProduct.customCategory
          : firstProduct.category
        : "LUX";

      const orderNum = firstProduct ? firstProduct.noOrder : "001";

      // 3. Ghép mã OrderID hoàn chỉnh
      const finalOrderID = `${mergCustomerCode}-${orderNum}`;

      // 4. Đóng gói dữ liệu gửi lên API Backend tạo order
      const requestPayload = {
        orderID: finalOrderID,
        customerCode: mergCustomerCode,
        products: processedProducts,
        ProductStatus: 1,
      };

      const response = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        throw new Error(
          `Error Server not type JSON: ${responseText || response.statusText}`,
        );
      }

      if (result.success) {
        try {
          // 🔥 Lấy trực tiếp mảng productIds từ response POST trả về (Sạch sẽ, không gọi GET lookup nữa)
          const productIds: number[] =
            result.productIds || (result.productId ? [result.productId] : []);

          if (productIds.length > 0) {
            // Gửi workflow log cho từng sản phẩm vừa tạo
            for (const id of productIds) {
              await fetch("/api/WorkflowLogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: Number(id),
                  statusText: "1",
                  timestamp: new Date().toISOString(),
                }),
              });
            }
           
          } else {
            console.warn("⚠️ Không tìm thấy productIds trong response.");
          }
        } catch (logErr) {
          console.error("Error recording workflow log:", logErr);
        }

        setMessage({
          text: `Order ${finalOrderID} Create Successfully!!`,
          type: "success",
        });
      } else {
        throw new Error(result.message || "Failed to save!");
      }
    } catch (error: any) {
      console.error("Database save error:", error);
      setMessage({
        text: "Error Save DB: " + error.message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans pb-16">
      <main className="pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          {/* ================= HEADER & TAB NAVIGATION ================= */}
          <div className="border-b border-amber-200/80 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                  Order Initialization & Crafting Details
                </h2>
              </div>

              {/* ADD PRODUCT BUTTON */}
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {/* PRODUCT TABS BAR */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
              {products.map((prod) => {
                const isActive = prod.id === activeTabId;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setActiveTabId(prod.id)}
                    className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all shrink-0 ${
                      isActive
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100/80"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{prod.productName}</span>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveProduct(prod.id, e)}
                        className={`p-0.5 rounded-full transition-colors ${
                          isActive
                            ? "hover:bg-amber-600 text-white"
                            : "hover:bg-amber-200 text-amber-800"
                        }`}
                        title="Remove product"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= RENDER ACTIVE TAB CONTENT ================= */}
          {products.map((prod) => {
            const isActive = prod.id === activeTabId;
            if (!isActive) return null;

            return (
              <div key={prod.id} className="space-y-6">
                {/* Tên sản phẩm chỉnh sửa trực tiếp */}
                <div>
                  <input
                    type="text"
                    value={prod.productName}
                    onChange={(e) =>
                      handleFieldChange("productName", e.target.value)
                    }
                    placeholder="Enter product name..."
                    className="text-md font-bold text-amber-700 uppercase tracking-tight w-full border-b border-transparent focus:border-amber-500 focus:outline-none transition-all py-1"
                  />
                </div>

                {/* TABLE 1: GENERAL INFORMATION */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    1. General Information
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-700">
                      <thead className="text-xs text-gray-700 uppercase bg-amber-50/80 border-b border-gray-200 font-semibold">
                        <tr>
                          <th className="px-3 py-3 w-40">No. Order</th>
                          <th className="px-3 py-3 min-w-52">Customer Code</th>
                          <th className="px-3 py-3 w-40">Date Created</th>
                          <th className="px-3 py-3 w-40">Date Finished</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          {/* No.Oder */}
                          <td className="p-2 align-top">
                            <input
                              type="text"
                              value={prod.noOrder}
                              onChange={(e) =>
                                handleFieldChange("noOrder", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-sm font-semibold bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          {/* CustomerCode */}
                          <td className="p-2 align-top space-y-1.5">
                            <select
                              value={prod.category}
                              onChange={(e) =>
                                handleFieldChange("category", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Select Custom Code --</option>
                              {CUSTOMER_CODE.map((opt, idx) => {
                                // Lấy giá trị string an toàn từ object
                                const val =
                                  typeof opt === "object" && opt !== null
                                    ? opt.value
                                    : opt;
                                const lbl =
                                  typeof opt === "object" && opt !== null
                                    ? opt.label
                                    : opt;

                                return (
                                  <option key={idx} value={val}>
                                    {lbl}
                                  </option>
                                );
                              })}
                            </select>
                            {prod.category === "Other..." && (
                              <input
                                type="text"
                                value={prod.customCategory}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customCategory",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter custom name..."
                                className="w-full px-2.5 py-1 text-xs bg-amber-50/30 border border-amber-300 rounded-lg focus:outline-none"
                              />
                            )}
                          </td>
                          {/* DateCreate */}
                          <td className="p-2 align-top">
                            <input
                              type="date"
                              value={prod.dateCreated}
                              onChange={(e) =>
                                handleFieldChange("dateCreated", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none text-gray-700"
                            />
                          </td>
                          {/* DateFinish */}
                          <td className="p-2 align-top">
                            <input
                              type="date"
                              value={prod.dateFinished}
                              onChange={(e) =>
                                handleFieldChange(
                                  "dateFinished",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none text-gray-700"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TABLE 2: TECHNICAL DETAILS & IMAGES */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    2. Technical Details & Images
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-700">
                      <thead className="text-xs text-gray-700 uppercase bg-amber-50/80 border-b border-gray-200 font-semibold">
                        <tr>
                          <th className="px-3 py-3 w-56">MATERIAL</th>
                          <th className="px-3 py-3 w-60">GEM TYPE</th>
                          <th className="px-3 py-3 text-right">IMAGES</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          {/* Chất liệu */}
                          <td className="p-2 align-top space-y-1.5">
                            <select
                              value={prod.material}
                              onChange={(e) =>
                                handleFieldChange("material", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none cursor-pointer"
                            >
                              {MATERIAL_OPTIONS.map((opt, idx) => {
                                // Lấy giá trị string an toàn từ object
                                const val =
                                  typeof opt === "object" && opt !== null
                                    ? opt.value
                                    : opt;
                                const lbl =
                                  typeof opt === "object" && opt !== null
                                    ? opt.label
                                    : opt;

                                return (
                                  <option key={idx} value={val}>
                                    {lbl}
                                  </option>
                                );
                              })}
                            </select>
                            {prod.material === "Other..." && (
                              <input
                                type="text"
                                value={prod.customMaterial}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customMaterial",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter custom material..."
                                className="w-full px-2.5 py-1 text-xs bg-amber-50/30 border border-amber-300 rounded-lg focus:outline-none"
                              />
                            )}
                          </td>
                          {/* Gem Type */}
                          <td className="p-2 align-top space-y-1.5">
                            <select
                              value={prod.gemType}
                              onChange={(e) =>
                                handleFieldChange("gemType", e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none cursor-pointer"
                            >
                              {GEM_TYPE_OPTIONS.map((opt, idx) => {
                                // Lấy giá trị string an toàn từ object
                                const val =
                                  typeof opt === "object" && opt !== null
                                    ? opt.value
                                    : opt;
                                const lbl =
                                  typeof opt === "object" && opt !== null
                                    ? opt.label
                                    : opt;

                                return (
                                  <option key={idx} value={val}>
                                    {lbl}
                                  </option>
                                );
                              })}
                            </select>
                            {prod.gemType === "Other..." && (
                              <input
                                type="text"
                                value={prod.customGemType}
                                onChange={(e) =>
                                  handleFieldChange(
                                    "customGemType",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter custom gem type..."
                                className="w-full px-2.5 py-1 text-xs bg-amber-50/30 border border-amber-300 rounded-lg focus:outline-none"
                              />
                            )}
                          </td>
                          {/* Hinh anh */}
                          <td className="p-2 align-top">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {prod.imageUrls.map((url, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="relative group w-10 h-10 rounded-xl border border-gray-200 overflow-hidden shrink-0 shadow-2xs"
                                >
                                  <img
                                    src={url}
                                    alt={`Preview ${imgIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(imgIdx)}
                                    className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                    title="Delete image"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <label
                                className="w-10 h-10 rounded-xl border border-dashed border-gray-300 hover:border-amber-500 bg-gray-50/80 hover:bg-amber-50/50 flex items-center justify-center text-gray-400 hover:text-amber-600 cursor-pointer transition-all shrink-0"
                                title="Upload images"
                              >
                                <ImageIcon className="w-5 h-5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleMultipleImageUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3: FEEDBACK */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    3. Feedback
                  </span>
                  <textarea
                    value={prod.feedback}
                    onChange={(e) =>
                      handleFieldChange("feedback", e.target.value)
                    }
                    placeholder="Enter feedback..."
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none text-gray-700 resize-none"
                    rows={3}
                  ></textarea>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notification */}
        {message && (
          <div
            className={`p-3 rounded-xl text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Action Button Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Go back Couting */}
          <Link href="/counting">
            <button
              type="button"
              className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-sm font-semibold rounded-lg shadow-2xs transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>←</span> Go back
            </button>
          </Link>

          {/* Create Order */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToDatabase}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving to database...
              </>
            ) : (
              "CREATE ORDER"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
