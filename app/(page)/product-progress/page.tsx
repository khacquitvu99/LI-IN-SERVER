"use client";

import React, { use, useState } from "react";
import Nav from "@/components/navigation";
import MenuLeft from "@/components/menuleft";
import PictureFrame from "@/components/frame";
import OrderList from "@/components/order-list";
import Fillter from "@/components/fillter";
import FlowProces from "@/components/flowProcessing";

import { Loader } from "lucide-react";

export default function ProgressPage() {
  // State quản lý ảnh preview
  const [productImage, setProductImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProductImage(imageUrl);
      // TODO: Thêm logic gọi API upload file lên server/SQL nếu cần ở đây
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* 1. Thanh Navigation trên cùng */}
      <Nav />
      <div className="pt-24 max-w-350 mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Fillter />
        {/* Menu Left */}
        <div className="ml-64">
          <MenuLeft />
        </div>

        {/* 2. Nội dung chính chia bố cục 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: Order List (Cố định chiều rộng cột) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <OrderList />
          </div>

          {/* CỘT PHẢI: Product Name Header + Các Process + Picture Frame */}
          <div className="lg:col-span-8 space-y-6">
            {/* Các thành phần quy trình sản xuất */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
                <h3 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                  {/* Biểu tượng icon tùy chọn */}
                  <Loader className="w-6 h-6" />
                  Order - Product Progress
                </h3>
              </div>
              <FlowProces />
              <PictureFrame />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
