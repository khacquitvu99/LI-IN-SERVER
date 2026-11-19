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

      // Lưu các File object để chuẩn bị gửi lên server
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      // Tạo URL tạm để hiển thị preview ngay lập tức trên giao diện
      const newPreviewUrls = filesArray.map((file) =>
        URL.createObjectURL(file),
      );
      setProductImagePreviews((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  // 3. HÀM XÓA 1 ẢNH (Xóa cả file vật lý trên ổ D, cập nhật lại DB và giao diện)
  const handleRemoveImage = async (index: number) => {
    try {
      const existingImages = castingData.castingIMG
        ? castingData.castingIMG.split(",")
        : [];

      // THƯỜNG TRƯỜNG HỢP 1: Ảnh đang chọn là ảnh cũ (đã lưu sẵn trong DB / ổ D)
      if (index < existingImages.length) {
        const imgToDelete = existingImages[index];

        // A. Gọi API xóa file vật lý trên ổ D
        const deleteRes = await fetch("/api/deleteImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: imgToDelete }),
        });
        const deleteResult = await deleteRes.json();

        if (!deleteResult.success) {
          console.warn(
            "⚠️ Xóa file vật lý có thể chưa thành công:",
            deleteResult.error,
          );
        }

        // B. Cập nhật lại mảng ảnh trong state castingData (bỏ ảnh vừa xóa ra)
        existingImages.splice(index, 1);
        const newCastingIMG = existingImages.join(",");

        // C. Gửi ngay request PUT xuống API Upsert để cập nhật lại cơ sở dữ liệu MSSQL ngay lập tức
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
        // THƯỜNG TRƯỜNG HỢP 2: Ảnh mới chọn nhưng CHƯA bấm nút Save (chỉ đang là preview blob tạm)
        const fileIndex = index - existingImages.length;
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

      // ⏱️ Lấy thời gian thực tại đúng khoảnh khắc click nút Save
      const realTimeTimestamp = new Date().toISOString();

      let uploadedImageNames: string[] = castingData.castingIMG
        ? castingData.castingIMG.split(",")
        : [];

      // BƯỚC 1: Upload các file ảnh mới (nếu có)
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);

          const uploadRes = await fetch("/api/uploadImage", {
            method: "POST",
            body: uploadFormData,
          });

          const uploadResult = await uploadRes.json();
          if (uploadResult.success && uploadResult.url) {
            const urlParts = uploadResult.url.split("/");
            const fileName = urlParts[urlParts.length - 1];
            uploadedImageNames.push(fileName);
          } else {
            alert("Error uploading image: " + uploadResult.error);
            return;
          }
        }
      }

      const finalCastingImg = uploadedImageNames.join(",");

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
        // Cập nhật trạng thái sản phẩm sang bước kế tiếp
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

      // 🚀 BƯỚC 3: Gửi productId kèm thời gian thực lên API WorkflowLogs
      // Backend sẽ tự động lấy ProductName, ProductStatus và lưu vào bảng log
      await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: castingData.productId,
          timestamp: realTimeTimestamp,
        }),
      });

      alert("Save Successfully");

      // BƯỚC 4: Reset state sạch sẽ, chống nhân đôi ảnh
      setCastingData((prev) => ({ ...prev, castingIMG: finalCastingImg }));
      setSelectedFiles([]);
      setProductImagePreviews([]);
    } catch (error) {
      console.error("Error Save Process:", error);
      alert("A system connection error has occurred!");
    }
  };

  // Tổng hợp danh sách ảnh hiển thị (Ảnh cũ từ DB + Ảnh preview mới chọn)
  const existingImages = castingData.castingIMG
    ? castingData.castingIMG.split(",")
    : [];
  const rawImagesToShow = [
    ...existingImages.map((img) => `/api/images/${img}`),
    ...productImagePreviews,
  ];

  // 🔥 Dùng Set để lọc bỏ các đường dẫn URL bị trùng lặp, chống nhân đôi ảnh
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
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
                <h3 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Cpu className="w-6 h-6" />
                  Casting Process
                </h3>
              </div>

              {/* Component form con (Truyền state castingData và hàm cập nhật xuống component con) */}
              <Casting data={castingData} onChange={setCastingData} />

              {/* --- PICTURE FRAME & UPLOAD NHIỀU ẢNH --- */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Product Progress Images
                </h4>

                <div className="flex flex-col gap-4 p-4 bg-amber-50/30 rounded-xl border border-dashed border-amber-300">
                  {/* Khung hiển thị danh sách ảnh Preview */}
                  <div className="flex flex-wrap gap-4">
                    {allImagesToShow.length > 0 ? (
                      allImagesToShow.map((imgSrc, index) => (
                        <div
                          key={index}
                          className="w-28 h-28 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group"
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
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs w-6 h-6 flex items-center justify-center shadow"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="w-36 h-36 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center p-2">
                        <Image className="w-16 h-16 opacity-30 mx-auto" />
                        <span className="text-[11px] text-gray-500 font-medium mt-1">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Phần thao tác chọn file */}
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Upload design photos or jewelry blueprints (Multiple
                      support)
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Support PNG, JPG, WEBP ...
                    </p>

                    <label className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg cursor-pointer shadow-sm transition-colors w-fit gap-2">
                      <Upload className="h-4 w-4" />
                      Choose Image Files
                      <input
                        type="file"
                        accept="image/*"
                        multiple // 🔥 Cho phép chọn nhiều ảnh cùng lúc
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
                onClick={handleSaveProcess} // Gắn hàm xử lý Upsert và Upload nhiều ảnh vào đây
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
