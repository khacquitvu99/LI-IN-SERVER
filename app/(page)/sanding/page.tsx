"use client";

import React, { useState } from "react";
import Nav from "@/components/navigation";
import MenuLeft from "@/components/menuleft";
import Sanding from "@/components/sanding";
import OrderList from "@/components/order-list";
import LabelContent from "@/components/labelProductName";
import Fillter from "@/components/fillter";
import Notification from "@/components/notification";

import { Image, BroomSparkles, Upload, Download } from "lucide-react";

export default function CastingPage() {
  // 1. Lưu trữ danh sách file thật người dùng vừa chọn từ máy tính
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 2. Lưu trữ danh sách URL tạm (blob) để render khung preview ngay lập tức
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>(
    [],
  );

  // 3. State dữ liệu của Sanding (trong đó có trường chứa chuỗi tên ảnh, ví dụ: sandingIMG)
  const [sandingData, setSandingData] = useState({
    productId: "",
    employName: "",
    time: "",
    receivedWeight: 0,
    solderWeight: 0,
    filingDustWeight: 0,
    finishWeight: 0,
    lossWeight: 0,
    sandingIMG: "",
  });
  // Xử lý khi chọn file ảnh mới từ máy
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Cộng dồn file thật vào mảng
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      // Tạo URL tạm để hiển thị preview ngay lập tức
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setProductImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };
  // 3. HÀM XÓA ẢNH (Xóa file trên ổ D và reset state ảnh)
  const handleRemoveImage = async (index: number) => {
    try {
      const existingImages = sandingData.sandingIMG
        ? sandingData.sandingIMG
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        : [];

      // Nếu bấm xóa ảnh cũ đã lưu trong SQL / Ổ D
      if (index < existingImages.length) {
        const rawImgToDelete = existingImages[index];

        // 1. Gọi route xóa vật lý ổ D
        const deleteRes = await fetch("/api/deleteImage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: rawImgToDelete }),
        });
        const deleteResult = await deleteRes.json();

        if (!deleteResult.success) {
          console.warn(
            "⚠️ Xóa file vật lý có thể chưa hoàn tất:",
            deleteResult.error,
          );
        }

        // 2. Cập nhật lại chuỗi ảnh trong DB
        existingImages.splice(index, 1);
        const newSandingIMG = existingImages.join(",");

        const updatePayload = {
          ...sandingData,
          sandingIMG: newSandingIMG,
        };

        const dbRes = await fetch("/api/sanding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        const dbResult = await dbRes.json();

        if (dbResult.success) {
          setSandingData((prev) => ({ ...prev, sandingIMG: newSandingIMG }));
        } else {
          alert("Error updating DB after deleting image: " + dbResult.error);
        }
      } else {
        // Nếu xóa ảnh mới chọn tạm (chưa bấm Save)
        const fileIndex = index - existingImages.length;
        setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
        setProductImagePreviews((prev) =>
          prev.filter((_, i) => i !== fileIndex),
        );
      }
    } catch (error) {
      console.error("Error removing image:", error);
      alert("An error occurred while deleting the image!");
    }
  };
  // 4. HÀM CLICK NÚT SAVE: THỰC HIỆN UPLOAD ẢNH, UPSERT SANDING & CẬP NHẬT PRODUCT STATUS
  // HÀM CLICK NÚT SAVE Ở TRANG SANDING
  const handleSaveProcess = async () => {
    try {
      if (!sandingData.productId) {
        alert("Please enter the Product ID before saving!!");
        return;
      }

      // ⏱️ Lấy thời gian thực tại đúng khoảnh khắc click nút Save
      const realTimeTimestamp = new Date().toISOString();

      let uploadedImageNames: string[] = sandingData.sandingIMG
        ? sandingData.sandingIMG.split(",")
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

      // Dùng Set lọc trùng lặp tên file tuyệt đối
      const finalSandingImg = Array.from(new Set(uploadedImageNames)).join(",");

      // BƯỚC 2: Gửi dữ liệu xuống API lưu công đoạn Sanding (Upsert)
      const payload = {
        ...sandingData,
        sandingIMG: finalSandingImg,
      };

      const response = await fetch("/api/sanding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Error saving DB: " + result.error);
        return;
      }

      // BƯỚC 3: Nếu lưu thành công -> Cập nhật ProductStatus và ghi Log real-time
      if (result.success) {
        try {
          // 3.1. Cập nhật trạng thái sản phẩm sang bước kế tiếp trong bảng Products
          await fetch("/api/product", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: sandingData.productId,
              productStatus: 7, // Trạng thái tiếp theo sau Sanding
            }),
          });

          // 3.2. Gửi log real-time lên WorkflowLogs (Backend sẽ tự đọc từ bảng Products)
          await fetch("/api/WorkflowLogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: sandingData.productId,
              timestamp: realTimeTimestamp,
            }),
          });
        } catch (statusErr) {
          console.error("Error updating product status or logging:", statusErr);
        }

        alert("Save Sanding Successfully!");
      }

      // BƯỚC 4: Reset state sạch sẽ, chống nhân đôi ảnh
      setSandingData((prev) => ({ ...prev, sandingIMG: finalSandingImg }));
      setSelectedFiles([]);
      setProductImagePreviews([]);
    } catch (error) {
      console.error("Error Save Process:", error);
      alert("A system connection error has occurred!");
    }
  };

  const existingImages = sandingData.sandingIMG
    ? sandingData.sandingIMG
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean)
    : [];

  const rawImagesToShow = [
    ...existingImages.map((img) => `/api/images/${img}`),
    ...productImagePreviews,
  ];

  // 🔥 Chống nhân đôi hiển thị 100%
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
                  <BroomSparkles className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
                  <span>Sanding Process</span>
                </h3>
              </div>

              {/* Component form con (Truyền state castingData và hàm cập nhật xuống component con) */}
              <Sanding data={sandingData} onChange={setSandingData} />

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
                            alt={`Product Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Nút xóa ảnh theo đúng vị trí index của mảng */}
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
                onClick={handleSaveProcess} // Gắn hàm xử lý Upsert và Upload ảnh vào đây
                className="inline-flex items-center gap-2 px-6 py-2.5 mb-20 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                <Download className="h-4 w-4"></Download>
                Save Process
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
