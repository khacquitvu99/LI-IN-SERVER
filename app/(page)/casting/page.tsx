"use client";

import React, { useState } from "react";
import Nav from "@/components/navigation";
import MenuLeft from "@/components/menuleft";
import Casting from "@/components/casting";
import OrderList from "@/components/order-list";
import LabelContent from "@/components/labelProductName";
import Fillter from "@/components/fillter";
import Notification from "@/components/notification";

import { Cpu, Image, Upload, Download } from "lucide-react";
import { NotificationItem } from "@/types";

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

export default function CastingPage() {
  // 1. STATE QUẢN LÝ DỮ LIỆU CHUNG CHO BẢNG CASTING
  const [castingData, setCastingData] = useState({
    productId: "", // Khóa chính để Upsert
    employName: "",
    time: "",
    receivedWeight: 0,
    finishWeight: 0,
    losstWeight: 0,
    castingIMG: "",
  });

  // 2. STATE QUẢN LÝ NHIỀU FILE ẢNH VÀ PREVIEW
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>(
    [],
  );

  // Khởi tạo state chứa danh sách thông báo
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Xử lý khi chọn NHIỀU file ảnh mới từ máy
  const handleMultipleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);

      setSelectedFiles((prev) => [...prev, ...filesArray]);

      const newPreviewUrls = filesArray.map((file) =>
        URL.createObjectURL(file),
      );
      setProductImagePreviews((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  // 3. HÀM XÓA 1 ẢNH (Xóa file vật lý, cập nhật lại DB và giao diện)
  const handleRemoveImage = async (index: number) => {
    try {
      const existingImages = castingData.castingIMG
        ? castingData.castingIMG
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      // TRƯỜNG HỢP 1: Ảnh đang chọn là ảnh cũ (đã lưu sẵn trong DB / media storage)
      if (index < existingImages.length) {
        const imgToDelete = existingImages[index];

        // A. Gọi API xóa file vật lý
        const deleteRes = await fetch("/api/deleteImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: imgToDelete,
            filename: imgToDelete,
          }),
        });
        const deleteResult = await deleteRes.json();

        if (!deleteResult.success) {
          console.warn(
            "⚠️ Xóa file vật lý có thể chưa thành công:",
            deleteResult.error,
          );
        }

        // B. Cập nhật lại mảng ảnh trong state castingData
        existingImages.splice(index, 1);
        const newCastingIMG = existingImages.join(",");

        // C. Gửi ngay request PUT xuống API Upsert để cập nhật DB
        const updatePayload = {
          ...castingData,
          castingIMG: newCastingIMG,
        };

        const dbRes = await fetch("/api/casting", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        const dbResult = await dbRes.json();

        if (dbResult.success) {
          setCastingData((prev) => ({ ...prev, castingIMG: newCastingIMG }));
          alert("Image deleted from server & DB successfully!");
        } else {
          alert("Error updating DB after deleting image: " + dbResult.error);
          return;
        }
      } else {
        // TRƯỜNG HỢP 2: Ảnh mới chọn nhưng CHƯA bấm nút Save (preview blob tạm)
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
    } catch (error) {
      console.error("Error deleting image process:", error);
      alert("An error occurred while deleting the image!");
    }
  };

  // 4. HÀM CLICK NÚT SAVE: THỰC HIỆN UPLOAD TỪNG ẢNH & UPSERT DB
  const handleSaveProcess = async () => {
    try {
      if (!castingData.productId) {
        alert("Please enter the Product ID before saving!!");
        return;
      }

      const realTimeTimestamp = new Date().toISOString();

      let uploadedImagePaths: string[] = castingData.castingIMG
        ? castingData.castingIMG
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      // BƯỚC 1: Upload các file ảnh mới vào thư mục con "products"
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

      const finalCastingImg = Array.from(new Set(uploadedImagePaths)).join(",");

      // BƯỚC 2: Gửi dữ liệu xuống API lưu Casting (Upsert)
      const payload = {
        ...castingData,
        castingIMG: finalCastingImg,
      };

      const response = await fetch("/api/casting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        try {
          await fetch("/api/product", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productID: castingData.productId,
              productStatus: 6,
            }),
          });
        } catch (statusErr) {
          console.error("Error updating product status:", statusErr);
        }
      } else {
        alert("Error saving DB: " + result.error);
        return;
      }

      // BƯỚC 3: Gửi productId kèm thời gian thực lên API WorkflowLogs
      await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: castingData.productId,
          timestamp: realTimeTimestamp,
        }),
      });

      alert("Save Successfully");

      // BƯỚC 4: Giải phóng blob URL & reset state sạch sẽ
      productImagePreviews.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      setCastingData((prev) => ({ ...prev, castingIMG: finalCastingImg }));
      setSelectedFiles([]);
      setProductImagePreviews([]);
    } catch (error) {
      console.error("Error Save Process:", error);
      alert("A system connection error has occurred!");
    }
  };

  // Tổng hợp danh sách ảnh hiển thị (Ảnh cũ từ DB qua /api/images?path=... + Ảnh preview mới chọn)
  const existingImages = castingData.castingIMG
    ? castingData.castingIMG
        .split(",")
        .map((item) => item.trim())
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
        <Notification notifications={notifications} />
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
                  <Cpu className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
                  <span>Casting Process</span>
                </h3>
              </div>

              {/* Component form con */}
              <Casting data={castingData} onChange={setCastingData} />

              {/* --- PICTURE FRAME & UPLOAD NHIỀU ẢNH --- */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Product Progress Images</span>
                </h4>

                <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 bg-amber-50/30 rounded-xl border border-dashed border-amber-300">
                  {/* Khung hiển thị danh sách ảnh Preview */}
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    {allImagesToShow.length > 0 ? (
                      allImagesToShow.map((imgSrc, index) => (
                        <div
                          key={index}
                          className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group"
                        >
                          <img
                            src={imgSrc}
                            alt={`Product Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Nút xóa ảnh nhanh trên từng khung preview */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow cursor-pointer"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center p-1.5 sm:p-2">
                        <Image className="w-12 h-12 sm:w-16 sm:h-16 opacity-30 mx-auto" />
                        <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Phần thao tác chọn file */}
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">
                      Upload design photos or jewelry blueprints (Multiple
                      support)
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                      Support PNG, JPG, WEBP ...
                    </p>

                    <label className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded-lg cursor-pointer shadow-sm transition-colors w-fit max-w-full gap-1.5 sm:gap-2">
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">Choose Image Files</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleMultipleImageChange}
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
