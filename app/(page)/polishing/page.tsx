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

export default function CastingPage() {
  // 1. STATE QUẢN LÝ DỮ LIỆU CHUNG CHO BẢNG polishing
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
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFiles((prev) => [...prev, file]);
      // Tạo URL tạm để hiển thị preview ngay lập tức trên giao diện
      const imageUrl = URL.createObjectURL(file);
      setProductImagePreviews((prev) => [...prev, imageUrl]);
    }
  };

  // 3. HÀM XÓA ẢNH (Xóa file trên ổ D và reset state ảnh)
  const handleRemoveImage = async (index: number) => {
    try {
      const existingImages = polishingData.polishingIMG
        ? polishingData.polishingIMG
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        : [];

      // Nếu bấm xóa ảnh cũ đã lưu trên DB / Ổ D
      if (index < existingImages.length) {
        const rawImgToDelete = existingImages[index];

        // 1. Gọi API xóa file vật lý trên ổ D
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

      // ⏱️ Lấy thời gian thực tại đúng khoảnh khắc click nút Save
      const realTimeTimestamp = new Date().toISOString();

      let uploadedImageNames: string[] = polishingData.polishingIMG
        ? polishingData.polishingIMG
            .split(",")
            .map((img) => img.trim())
            .filter(Boolean)
        : [];

      // Upload các file ảnh mới chọn
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
      const finalPolishingImg = Array.from(new Set(uploadedImageNames)).join(
        ",",
      );

      const payload = {
        ...polishingData,
        polishingIMG: finalPolishingImg,
      };

      const response = await fetch("/api/polishing", {
        method: "PUT", // Cơ chế Upsert
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 🛡️ Kiểm tra nếu API trả về lỗi
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Cập nhật trạng thái sản phẩm sang bước kế tiếp (Ví dụ: Plating Pending) và ghi log real-time
        try {
          // 1. Cập nhật status vào bảng Products
          await fetch("/api/product", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productID: polishingData.productId,
              productStatus: 9,
            }),
          });

          // 2. Gửi log real-time lên WorkflowLogs
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

        // Cập nhật state chuẩn từ server và dọn sạch mảng tạm chống nhân đôi ảnh
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
  // Tổng hợp danh sách ảnh hiển thị
  const existingImages = polishingData.polishingIMG
    ? polishingData.polishingIMG
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean)
    : [];

  const rawImagesToShow = [
    ...existingImages.map((img) => `/api/images/${img}`),
    ...productImagePreviews,
  ];

  // 🔥 Lọc trùng lặp tuyệt đối bằng Set
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
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
                <h3 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Polishing Process
                </h3>
              </div>

              {/*Truyền state polishingData và hàm cập nhật xuống component con */}
              <Polishing data={polishingData} onChange={setPolishingData} />

              {/* --- PICTURE FRAME & UPLOAD ANH --- */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Product Progress Images
                </h4>

                <div className="flex items-center gap-6 p-4 bg-amber-50/30 rounded-xl border border-dashed border-amber-300">
                  {/* Khung hiển thị ảnh Preview */}
                  <div className="flex flex-wrap gap-3">
                    {allImagesToShow.length > 0 ? (
                      allImagesToShow.map((imgSrc, index) => (
                        <div
                          key={index}
                          className="w-36 h-36 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group"
                        >
                          <img
                            src={imgSrc}
                            alt={`Polishing Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="w-36 h-36 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <div className="text-center p-2">
                          <Image className="w-20 h-20 opacity-30 mx-auto" />
                          <span className="text-[11px] text-gray-500 font-medium">
                            No Image
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phần thao tác chọn file */}
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Upload design photo or jewelry blueprint
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Support PNG, JPG, WEBP up to 10MB.
                    </p>

                    <label className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg cursor-pointer shadow-sm transition-colors w-fit gap-2">
                      <Upload className="h-4 w-4"></Upload>
                      Choose Image File
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
