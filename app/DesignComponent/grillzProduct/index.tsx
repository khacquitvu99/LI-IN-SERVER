"use client";

import { useEffect, useState } from "react";
import DsProcessing from "@/DesignComponent/design3DProcess";
import Material from "@/DesignComponent/material";
import GemStone from "@/DesignComponent/gemstone";
import GrillzStyle from "@/DesignComponent/grillz";
import PictureFrame from "@/DesignComponent/pictureFrame";
import { updateGrillz } from "@/service/handleFunction";
import { Package } from "lucide-react";

export default function GrillzContent({
  productId,
  productData,
}: {
  productId: number;
  productData: any;
}) {
  // Quản lý tab bên trong: 0 = Design, 1 = 3D Export
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
  const [Grillzdetails, setGrillzdetails] = useState<any>({
    quality: 0,
    styleName: "",
    grillzImage: "",
  });
  const [Gemstones, setGemstones] = useState<any[]>([]);

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

  const targetGrillObj = Array.isArray(Grillzdetails?.grillz)
    ? Grillzdetails.grillz[0]
    : Grillzdetails;
  const grillzImageString = targetGrillObj?.grillzImage || "";
  const grillzProcessImages: string[] = grillzImageString
    ? grillzImageString
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s && s !== "null" && s !== "undefined")
    : [];

  useEffect(() => {
    if (productId) {
      loadGrillData(productId);
    }
  }, [productId]);

  const loadGrillData = async (id: number) => {
    try {
      const resGrillz = await fetch(`/api/grillzdetail?productID=${id}`);
      const dataGrillz = await resGrillz.json();
      setGrillzdetails(dataGrillz.Grillzdetails || dataGrillz);
    } catch (error) {
      console.error("Error loading Grill data:", error);
    }
  };

  const handleUploadSuccess = (fileUrl: string) => {
    const fileName = fileUrl.split("/").pop() || fileUrl;
    setGrillzdetails((prev: any) => {
      const currentImages = prev.grillzImage
        ? prev.grillzImage
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
      if (!currentImages.includes(fileName)) {
        currentImages.push(fileName);
      }
      return { ...prev, grillzImage: currentImages.join(",") };
    });
  };

  const handleRemoveExistingImage = async (imageNameToRemove: string) => {
    if (!confirm(`Are you sure you want to delete ${imageNameToRemove}?`))
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

    const currentImages = grillzProcessImages.filter(
      (img) => img !== imageNameToRemove,
    );
    const newImageString =
      currentImages.length > 0 ? currentImages.join(",") : "";
    const updatedGrillData = { ...Grillzdetails, grillzImage: newImageString };

    setGrillzdetails(updatedGrillData);
    if (productId) {
      await updateGrillz(productId, {
        quality: updatedGrillData.quantity || updatedGrillData.quality,
        styleName: updatedGrillData.styleName,
        grillzImage: newImageString,
      });
    }
    alert("Cleaned up successfully!");
  };

  // Hàm Save cho tab Design (Grillz)
  const handleSaveGrillDesign = async () => {
    if (!productId) {
      alert("Please select a product before saving Grill Design!");
      return;
    }
    try {
      setIsSaving(true);
      const realTimeTimestamp = new Date().toISOString();

      await updateGrillz(productId, {
        quality: Grillzdetails.quantity || Grillzdetails.quality,
        styleName: Grillzdetails.styleName,
        grillzImage: Grillzdetails.grillzImage,
      });

      await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productID: productId, productStatus: 2 }),
      });

      await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, timestamp: realTimeTimestamp }),
      });

      alert("Save Grill Design Successfully..!!");
    } catch (error: any) {
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Hàm Save cho tab 3D Export (Grillz)
  const handleSaveGrill3DExport = async () => {
    if (!productId) {
      alert("Please select a product before saving Grill 3D Export!");
      return;
    }
    try {
      setIsSaving(true);
      const realTimeTimestamp = new Date().toISOString();

      await updateGrillz(productId, {
        quality: Grillzdetails.quantity || Grillzdetails.quality,
        styleName: Grillzdetails.styleName,
        grillzImage: Grillzdetails.grillzImage,
      });

      await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productID: productId, productStatus: 3 }),
      });

      await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, timestamp: realTimeTimestamp }),
      });

      alert("Save Grill 3D Export Successfully..!!");
    } catch (error: any) {
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-wider">
          {/* Icon lớp (Layers icon tương tự như mẫu Material Details) */}
          <Package className="h-6 w-6"/>
          <span>Grillz Process</span>
        </div>
        <div className="border-b border-amber-200/60 pb-2"></div>
      </div>

      {/* 2 NÚT TAB CHUYỂN ĐỔI: DESIGN & 3D EXPORT */}
      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
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

      {/* NỘI DUNG CHUNG CHO CẢ 2 TAB */}
      <div className="space-y-6 pt-2">
        <DsProcessing onDataChange={(data) => setProcessing(data)} />
        <Material onDataChange={(data) => setMaterials(data)} />
        <GemStone onDataChange={(data) => setGemstones(data)} />
        <GrillzStyle onDataChange={(data) => setGrillzdetails(data)} />
        <PictureFrame
          isGrill={true}
          productOriginalImages={productOriginalImages}
          grillzProcessImages={grillzProcessImages}
          productImagePreviews={productImagePreviews}
          selectedPreviewImage={selectedPreviewImage}
          setSelectedPreviewImage={setSelectedPreviewImage}
          setSelectedFiles={setSelectedFiles}
          setProductImagePreviews={setProductImagePreviews}
          onRemoveExistingImage={handleRemoveExistingImage}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* NÚT SAVE THAY ĐỔI THEO TAB ĐANG CHỌN */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          {subTab === 0 ? (
            <button
              type="button"
              onClick={handleSaveGrillDesign}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/30 transition-all cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Grill Design"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveGrill3DExport}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-amber-500/30 transition-all cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Grill 3D Export"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
