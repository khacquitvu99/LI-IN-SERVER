"use client";

import React, { useState } from "react";
import Nav from "@/components/navigation";
import MenuLeft from "@/components/menuleft";
import Polishing from "@/components/polishing";
import OrderList from "@/components/order-list";
import LabelContent from "@/components/labelProductName";
import Fillter from "@/components/fillter";
import Notification from "@/components/notification";

import { Image, Sparkles, Download, Upload } from "lucide-react";

function buildMediaImageUrl(rawPath?: string | null): string {
  if (!rawPath) return "";

  const value = rawPath.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value) || value.startsWith("blob:")) {
    return value;
  }

  const queryIndex = value.indexOf("?path=");
  if (queryIndex !== -1) {
    const existingPath = value.slice(queryIndex + 6);
    if (!existingPath) return "";

    let decoded = existingPath;
    if (/%[0-9A-Fa-f]{2}/.test(existingPath)) {
      try {
        decoded = decodeURIComponent(existingPath);
      } catch {
        decoded = existingPath;
      }
    }
    return `/api/images?path=${encodeURIComponent(decoded)}`;
  }

  const trimmed = value.replace(/^\/+/, "");
  if (trimmed.startsWith("api/images/")) {
    const subPath = trimmed.slice("api/images/".length);
    let decoded = subPath;
    if (/%[0-9A-Fa-f]{2}/.test(subPath)) {
      try {
        decoded = decodeURIComponent(subPath);
      } catch {
        decoded = subPath;
      }
    }
    return `/api/images?path=${encodeURIComponent(decoded)}`;
  }

  let normalizedPath = trimmed;
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      normalizedPath = decodeURIComponent(trimmed);
    } catch {
      normalizedPath = trimmed;
    }
  }

  return `/api/images?path=${encodeURIComponent(normalizedPath)}`;
}

function extractStoredMediaPath(uploadResult: any): string | null {
  if (uploadResult?.path && typeof uploadResult.path === "string") {
    return uploadResult.path.trim().replace(/^\/+/, "");
  }

  if (uploadResult?.url && typeof uploadResult.url === "string") {
    const urlStr = uploadResult.url.trim();
    const qIdx = urlStr.indexOf("?path=");
    if (qIdx !== -1) {
      const rawParam = urlStr.slice(qIdx + 6);
      try {
        return decodeURIComponent(rawParam).replace(/^\/+/, "");
      } catch {
        return rawParam.replace(/^\/+/, "");
      }
    }
    const parts = urlStr.split("/");
    return parts[parts.length - 1] || null;
  }

  return null;
}

export default function PolishingPage() {
  // 1. STATE QUẢN LÝ DỮ LIỆU CHUNG CHO BẢNG POLISHING
  const [polishingData, setPolishingData] = useState({
    productId: 0,
    employName: "",
    time: "",
    receiveWeight: 0,
    finishWeight: 0,
    lossWeight: 0,
    gemLoss: 0,
    polishingIMG: "",
  });

  // 2. STATE QUẢN LÝ NHIỀU FILE ẢNH VÀ PREVIEW CHO POLISHING
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>(
    [],
  );

  // Xử lý khi chọn file ảnh mới từ máy
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      const newImageUrls = files.map((file) => URL.createObjectURL(file));
      setProductImagePreviews((prev) => [...prev, ...newImageUrls]);
    }
    e.target.value = "";
  };

  // 3. HÀM XÓA ẢNH (Xóa file vật lý, cập nhật DB và reset state ảnh)
  const handleRemoveImage = async (index: number) => {
    try {
      const existingImages = polishingData.polishingIMG
        ? polishingData.polishingIMG
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        : [];

      // Nếu bấm xóa ảnh cũ đã lưu trên DB / media storage
      if (index < existingImages.length) {
        const rawImgToDelete = existingImages[index];

        // 1. Gọi API xóa file vật lý
        const deleteRes = await fetch("/api/deleteImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: rawImgToDelete,
            filename: rawImgToDelete,
          }),
        });
        const deleteResult = await deleteRes.json();

        if (!deleteResult.success) {
          console.warn(
            "⚠️ Xóa file vật lý có thể chưa hoàn tất:",
            deleteResult.error,
          );
        }

        // 2. Cập nhật lại chuỗi ảnh trong DB của Polishing
        existingImages.splice(index, 1);
        const newPolishingIMG = existingImages.join(",");

        const updatePayload = {
          ...polishingData,
          polishingIMG: newPolishingIMG,
        };

        const dbRes = await fetch("/api/polishing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!dbRes.ok) {
          const errText = await dbRes.text();
          throw new Error(`Server error (${dbRes.status}): ${errText}`);
        }

        const dbResult = await dbRes.json();

        if (dbResult.success) {
          setPolishingData((prev) => ({
            ...prev,
            polishingIMG: newPolishingIMG,
          }));
        } else {
          alert("Error updating DB after deleting image: " + dbResult.error);
        }
      } else {
        // Nếu xóa ảnh mới chọn tạm (chưa bấm Save)
        const fileIndex = index - existingImages.length;
        const previewToRevoke = productImagePreviews[fileIndex];
        if (previewToRevoke?.startsWith("blob:")) {
          URL.revokeObjectURL(previewToRevoke);
        }

        setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
        setProductImagePreviews((prev) =>
          prev.filter((_, i) => i !== fileIndex),
        );
      }
    } catch (error: any) {
      console.error("Error removing image:", error);
      alert("An error occurred while deleting the image: " + error.message);
    }
  };

  // 4. HÀM CLICK NÚT SAVE: THỰC HIỆN UPLOAD ẢNH & UPSERT DB TRANG POLISHING
  const handleSaveProcess = async () => {
    try {
      if (!polishingData.productId) {
        alert("Please enter the Product ID before saving!!");
        return;
      }

      const realTimeTimestamp = new Date().toISOString();

      let uploadedImagePaths: string[] = polishingData.polishingIMG
        ? polishingData.polishingIMG
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        : [];

      // Upload các file ảnh mới chọn vào thư mục con "products"
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          uploadFormData.append("folder", "products");

          const uploadRes = await fetch("/api/uploadImage", {
            method: "POST",
            body: uploadFormData,
          });

          const uploadResult = await uploadRes.json();
          const storedPath = uploadResult.success
            ? extractStoredMediaPath(uploadResult)
            : null;

          if (uploadResult.success && storedPath) {
            uploadedImagePaths.push(storedPath);
          } else {
            alert("Error uploading image: " + uploadResult.error);
            return;
          }
        }
      }

      const finalPolishingImg = Array.from(new Set(uploadedImagePaths)).join(
        ",",
      );

      const payload = {
        ...polishingData,
        polishingIMG: finalPolishingImg,
      };

      const response = await fetch("/api/polishing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        try {
          await fetch("/api/product", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productID: polishingData.productId,
              productStatus: 9,
            }),
          });

          await fetch("/api/WorkflowLogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: polishingData.productId,
              timestamp: realTimeTimestamp,
            }),
          });
        } catch (statusErr) {
          console.error("Error updating product status or logging:", statusErr);
        }

        alert("Save Polishing Successfully!");

        productImagePreviews.forEach((url) => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        setPolishingData((prev) => ({
          ...prev,
          polishingIMG: finalPolishingImg,
        }));
        setSelectedFiles([]);
        setProductImagePreviews([]);
      } else {
        alert("Error saving Polishing DB: " + result.error);
      }
    } catch (error: any) {
      console.error("Error Save Polishing Process:", error);
      alert("A system connection error has occurred: " + error.message);
    }
  };

  // Tổng hợp danh sách ảnh hiển thị qua /api/images?path=...
  const existingImages = polishingData.polishingIMG
    ? polishingData.polishingIMG
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean)
    : [];

  const rawImagesToShow = [
    ...existingImages.map((img) => buildMediaImageUrl(img)),
    ...productImagePreviews,
  ].filter(Boolean);

  const allImagesToShow = Array.from(new Set(rawImagesToShow));

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* 1. Thanh Navigation trên cùng */}
      <Nav />
      <div className="pt-24 max-w-350 mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Notification />
        <Fillter />

        {/* Menu Left */}
        <div className="ml-64">
          <MenuLeft />
        </div>

        {/* 2. Nội dung chính chia bố cục 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: Order List */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <OrderList />
          </div>

          {/* CỘT PHẢI: Product Name Header + Các Process + Picture Frame */}
          <div className="lg:col-span-8 space-y-6">
            {/* Khung Header Product Name */}
            <LabelContent />

            {/* Các thành phần quy trình sản xuất */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-amber-200 mb-2.5 sm:mb-3">
                <h3 className="text-lg sm:text-2xl font-bold text-amber-900 flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
                  <span>Polishing Process</span>
                </h3>
              </div>

              {/* Truyền state polishingData và hàm cập nhật xuống component con */}
              <Polishing data={polishingData} onChange={setPolishingData} />

              {/* --- PICTURE FRAME & UPLOAD ANH --- */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Product Progress Images</span>
                </h4>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3 sm:p-4 bg-amber-50/30 rounded-xl border border-dashed border-amber-300">
                  {/* Khung hiển thị ảnh Preview */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
                    {allImagesToShow.length > 0 ? (
                      allImagesToShow.map((imgSrc, index) => (
                        <div
                          key={index}
                          className="w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group"
                        >
                          <img
                            src={imgSrc}
                            alt={`Polishing Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <div className="text-center p-1.5 sm:p-2">
                          <Image className="w-12 h-12 sm:w-20 sm:h-20 opacity-30 mx-auto" />
                          <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                            No Image
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phần thao tác chọn file */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                      Upload design photo or jewelry blueprint
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                      Support PNG, JPG, WEBP up to 10MB.
                    </p>

                    <label className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded-lg cursor-pointer shadow-sm transition-colors w-fit max-w-full gap-1.5 sm:gap-2">
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">Choose Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
              {/* ---------------------------------- */}
            </div>

            {/* Action Button: Nút Save tích hợp sẵn ở component cha */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveProcess}
                className="inline-flex items-center gap-2 px-6 py-2.5 mb-20 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Save Process
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
