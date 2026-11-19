"use client";

import { useEffect, useState, useRef } from "react";
import DsProcessing from "@/DesignComponent/design3DProcess";
import Material from "@/DesignComponent/material";
import GemStone from "@/DesignComponent/gemstone";
import GemCenterform from "@/DesignComponent/gemcenter";
import PictureFrame from "@/DesignComponent/pictureFrame";
import {
  updateProcessing,
  updateMaterial,
  updateGemstone,
  updateGemCenter,
} from "@/service/handleFunction";
import { Package } from "lucide-react";

export default function ProductDetailsContent({
  productId,
  productData,
}: {
  productId: number;
  productData: any;
}) {
  const [subTab, setSubTab] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const [Processing, setProcessing] = useState<any>({
    designer: "",
    completedAt: "",
    processImage: "",
  });
  const [Materials, setMaterials] = useState<any>({
    materiatype: "",
    color: "",
    designWeight: 0,
    finishedWeight: 0,
  });
  const [GemCenter, setGemCenter] = useState<any>({
    shape: "",
    type: "",
    size: "",
    cost: "",
  });
  const [Gemstones, setGemstones] = useState<any[]>([]);

  // 🌟 Dùng useRef để theo dõi form nào đã thực sự bị thay đổi (dirty)
  const isDirtyRef = useRef({
    processing: false,
    material: false,
    gemstone: false,
    gemCenter: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>(
    [],
  );
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<
    string | null
  >(null);

  const rawImageString = productData?.image;
  const productOriginalImages: string[] =
    typeof rawImageString === "string"
      ? rawImageString
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(rawImageString)
        ? rawImageString
        : [];

  const processingImageString = Processing?.processImage || "";
  const productProcessImages: string[] =
    typeof processingImageString === "string"
      ? processingImageString
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s && s !== "null" && s !== "undefined")
      : [];

  useEffect(() => {
    if (productId) {
      loadTabData(productId);
    }
  }, [productId]);

  const loadTabData = async (id: number) => {
    try {
      // Khi load dữ liệu mới theo sản phẩm, reset lại trạng thái dirty
      isDirtyRef.current = {
        processing: false,
        material: false,
        gemstone: false,
        gemCenter: false,
      };

      const res3DProcess = await fetch(`/api/DsProcess?productID=${id}`);
      const data3DProcess = await res3DProcess.json();
      const loadedProcess =
        data3DProcess.Processing ||
        data3DProcess.DsProcessing?.[0] ||
        data3DProcess;

      setProcessing({
        designer: loadedProcess?.designer || "",
        completedAt: loadedProcess?.completedAt || "",
        processImage: loadedProcess?.processImage || loadedProcess?.image || "",
        image: loadedProcess?.processImage || loadedProcess?.image || "",
      });

      const resMaterial = await fetch(`/api/material?productID=${id}`);
      const dataMaterial = await resMaterial.json();
      setMaterials(dataMaterial.materials || dataMaterial);

      const resGemstone = await fetch(`/api/gemstone?productID=${id}`);
      const dataGemstone = await resGemstone.json();
      setGemstones(dataGemstone.gemstones || dataGemstone);

      const resCenterGem = await fetch(`/api/gemcenter?productID=${id}`);
      const dataGemCenter = await resCenterGem.json();
      setGemCenter(dataGemCenter.gemcenter);
    } catch (error) {
      console.error("Error loading Product Details:", error);
    }
  };

  const handleUploadSuccess = (fileUrl: string) => {
    const fileName = fileUrl.split("/").pop() || fileUrl;
    setProcessing((prev: any) => {
      const existingImg = prev.image || prev.processImage || "";
      const currentImages = existingImg
        ? existingImg
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
      if (!currentImages.includes(fileName)) {
        currentImages.push(fileName);
      }
      const combinedImageString = currentImages.join(",");
      isDirtyRef.current.processing = true; // Đánh dấu form processing thay đổi khi upload ảnh
      return {
        ...prev,
        image: combinedImageString,
        processImage: combinedImageString,
      };
    });
  };

  const handleRemoveExistingImage = async (imageNameToRemove: string) => {
    if (!confirm(`Are you sure you want to delete ${imageNameToRemove}??`))
      return;
    try {
      await fetch("/api/deleteImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: imageNameToRemove }),
      });
    } catch (err) {
      console.warn("File missing on server");
    }

    const currentImages = productProcessImages.filter(
      (img) => img !== imageNameToRemove,
    );
    const newImageString =
      currentImages.length > 0 ? currentImages.join(",") : "";
    const updatedProcessData = {
      ...Processing,
      image: newImageString,
      processImage: newImageString,
    };

    setProcessing(updatedProcessData);
    isDirtyRef.current.processing = true;
    if (productId) {
      await updateProcessing(productId, updatedProcessData);
    }
    alert("Cleaned up successfully!");
  };

  // 🌟 Hàm Save thông minh: Chỉ gọi API update cho form nào có thay đổi (dirty)
  const saveAllProductData = async (
    targetStatus: number,
    successMessage: string,
  ) => {
    if (!productId) {
      alert("Please select a product before saving!");
      return;
    }
    try {
      setIsSaving(true);
      const realTimeTimestamp = new Date().toISOString();

      let hasUpdatedAnyComponent = false;

      // 1. Chỉ update Processing nếu form này có thay đổi
      if (isDirtyRef.current.processing) {
        await updateProcessing(productId, Processing);
        hasUpdatedAnyComponent = true;
      }

      // 2. Chỉ update Material nếu form này có thay đổi
      if (isDirtyRef.current.material && typeof updateMaterial === "function") {
        await updateMaterial(productId, Materials);
        hasUpdatedAnyComponent = true;
      }

      // 3. Chỉ update Gemstones nếu form này có thay đổi
      if (isDirtyRef.current.gemstone && typeof updateGemstone === "function") {
        await updateGemstone(productId, Gemstones);
        hasUpdatedAnyComponent = true;
      }
      // 4. Chỉ update GemCenter khi có thay đổi VÀ dữ liệu không bị rỗng/chưa có thông tin
      if (
        isDirtyRef.current.gemCenter &&
        typeof updateGemCenter === "function"
      ) {
        // Kiểm tra nếu GemCenter có tồn tại và có ít nhất một trường dữ liệu (shape, type, size...) được điền
        const hasGemCenterData =
          GemCenter &&
          (GemCenter.shape ||
            GemCenter.type ||
            GemCenter.size ||
            GemCenter.cost ||
            GemCenter.id);

        if (hasGemCenterData) {
          await updateGemCenter(productId, GemCenter);
        }
      }

      // 5. Luôn cập nhật trạng thái sản phẩm và ghi log khi bấm Save
      await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productID: productId,
          productStatus: targetStatus,
        }),
      });

      await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, timestamp: realTimeTimestamp }),
      });

      // Reset lại cờ dirty sau khi lưu thành công
      isDirtyRef.current = {
        processing: false,
        material: false,
        gemstone: false,
        gemCenter: false,
      };

      alert(successMessage);
    } catch (error: any) {
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDesign = () => {
    saveAllProductData(2, "Save Design Successfully..!!");
  };

  const handleSave3DExport = () => {
    saveAllProductData(4, "Save 3D Export Successfully..!!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-wider">
          <Package className="h-6 w-6" />
          <span>Design 3D Process</span>
        </div>
        <div className="border-b border-amber-200/60 pb-2"></div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
        {/* Design */}
        <button
          type="button"
          onClick={() => setSubTab(0)}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 0
              ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/60"
          }`}
        >
          Design
        </button>

        {/* 3D Export */}
        <button
          type="button"
          onClick={() => setSubTab(1)}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            subTab === 1
              ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/60"
          }`}
        >
          3D Export
        </button>
      </div>

      {/* Nội dung các component con kèm cơ chế ghi nhận thay đổi (Dirty check) */}
      <div className="space-y-6 pt-2">
        <DsProcessing
          onDataChange={(data) => {
            setProcessing(data);
            isDirtyRef.current.processing = true;
          }}
        />
        <Material
          onDataChange={(data) => {
            setMaterials(data);
            isDirtyRef.current.material = true;
          }}
        />
        <GemStone
          initialData={Gemstones}
          onDataChange={(updatedList) => {
            setGemstones(updatedList);
            isDirtyRef.current.gemstone = true;
          }}
        />
        <div className="text-gray-700">
          <GemCenterform
            data={GemCenter}
            readOnly={subTab === 1}
            onDataChange={(data) => {
              setGemCenter(data);
              isDirtyRef.current.gemCenter = true;
            }}
          />
        </div>
        <PictureFrame
          productOriginalImages={productOriginalImages}
          productProcessImages={productProcessImages}
          productImagePreviews={productImagePreviews}
          selectedPreviewImage={selectedPreviewImage}
          setSelectedPreviewImage={setSelectedPreviewImage}
          setSelectedFiles={setSelectedFiles}
          setProductImagePreviews={setProductImagePreviews}
          onRemoveExistingImage={handleRemoveExistingImage}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Nút Save */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          {subTab === 0 ? (
            <button
              type="button"
              onClick={handleSaveDesign}
              disabled={isSaving}
              className={`px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/30 transition-all cursor-pointer ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? "Saving..." : "Save Design"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave3DExport}
              disabled={isSaving}
              className={`px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/30 transition-all cursor-pointer ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? "Saving..." : "Save 3D Export"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
