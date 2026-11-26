"use client";

import { useEffect, useState } from "react";
import DsProcessing from "@/DesignComponent/design3DProcess";
import Material from "@/DesignComponent/material";
import GemStone from "@/DesignComponent/gemstone";
import GrillzStyle from "@/DesignComponent/grillz";
import PictureFrame from "@/DesignComponent/pictureFrame";
import { updateGrillz } from "@/service/handleFunction";
import { Package } from "lucide-react";
import type { GrillzStyleItem } from "@/types";

export type ParentCategory = "product" | "grillz";

interface GrillzContentProps {
  productId: number;
  productData: any;
  parentCategory?: ParentCategory;
}

function splitImageList(raw?: any): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(",");
  return arr
    .map((s) => String(s).trim())
    .filter((s) => s && s !== "null" && s !== "undefined");
}

export default function GrillzContent({
  productId,
  productData,
  parentCategory = "grillz",
}: GrillzContentProps) {
  // Quản lý tab bên trong: 0 = Design, 1 = 3D Export
  const [subTab, setSubTab] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const [Processing, setProcessing] = useState<any>({
    designer: "",
    completedAt: "",
    processImage: "",
    renderIMG: "",
    gemPosition: "",
    designIMG: "",
  });
  const [renderImages, setRenderImages] = useState<string[]>([]);
  const [gemPositionImages, setGemPositionImages] = useState<string[]>([]);
  const [designProcessImages, setDesignProcessImages] = useState<string[]>([]);

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
  const [grillzStyleList, setGrillzStyleList] = useState<GrillzStyleItem[]>([]);
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
      ? splitImageList(rawImageString)
      : Array.isArray(rawImageString)
        ? rawImageString
        : [];

  const targetGrillObj = Array.isArray(Grillzdetails?.grillz)
    ? Grillzdetails.grillz[0]
    : Grillzdetails;
  const grillzImageString = targetGrillObj?.grillzImage || "";
  const grillzProcessImages: string[] = splitImageList(grillzImageString);

  const is3DExportTab = subTab === 1;
  const activeLeftImages = is3DExportTab ? gemPositionImages : renderImages;

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

  const handleUploadSuccess = (
    fileUrl: string,
    meta?: { isGemPositionTab?: boolean; dbField?: string },
    relativePath?: string,
  ) => {
    const mediaValue = relativePath || fileUrl;
    const fileName = mediaValue.split("/").pop() || mediaValue;
    const isGemPos = Boolean(
      meta?.isGemPositionTab || meta?.dbField === "GemPosition" || subTab === 1,
    );

    if (isGemPos) {
      setGemPositionImages((prev) => {
        const next = prev.includes(mediaValue) ? prev : [...prev, mediaValue];
        setProcessing((p: any) => ({ ...p, gemPosition: next.join(",") }));
        return next;
      });
    } else {
      setRenderImages((prev) => {
        const next = prev.includes(mediaValue) ? prev : [...prev, mediaValue];
        setProcessing((p: any) => ({ ...p, renderIMG: next.join(",") }));
        return next;
      });
    }

    setGrillzdetails((prev: any) => {
      const baseObj = Array.isArray(prev?.grillz)
        ? prev.grillz[0] || prev
        : prev || {};
      const currentImages = splitImageList(baseObj.grillzImage);
      if (!currentImages.includes(fileName)) {
        currentImages.push(fileName);
      }
      return { ...baseObj, grillzImage: currentImages.join(",") };
    });
  };

  const handleDesignUploadSuccess = (
    fileUrl: string,
    _meta?: any,
    relativePath?: string,
  ) => {
    const mediaValue = relativePath || fileUrl;
    setDesignProcessImages((prev) => {
      const next = prev.includes(mediaValue) ? prev : [...prev, mediaValue];
      const joined = next.join(",");
      setProcessing((p: any) => ({
        ...p,
        designIMG: joined,
        processImage: joined,
      }));
      return next;
    });
  };

  const handleRemoveExistingImage = async (
    imageNameToRemove: string,
    meta?: { section?: string; isGemPositionTab?: boolean },
  ) => {
    if (!confirm(`Are you sure you want to delete ${imageNameToRemove}?`))
      return;

    const isDesignSection = meta?.section === "design";
    const isGemPosSection =
      meta?.section === "gem_position" || Boolean(meta?.isGemPositionTab);

    if (isDesignSection) {
      const nextDesign = designProcessImages.filter(
        (img) => img !== imageNameToRemove,
      );
      setDesignProcessImages(nextDesign);
      setProcessing((p: any) => ({
        ...p,
        designIMG: nextDesign.join(","),
        processImage: nextDesign.join(","),
      }));
      return;
    }

    if (isGemPosSection) {
      const nextGem = gemPositionImages.filter(
        (img) => img !== imageNameToRemove,
      );
      setGemPositionImages(nextGem);
      setProcessing((p: any) => ({ ...p, gemPosition: nextGem.join(",") }));
      return;
    }

    const nextRender = renderImages.filter((img) => img !== imageNameToRemove);
    setRenderImages(nextRender);
    setProcessing((p: any) => ({ ...p, renderIMG: nextRender.join(",") }));

    const currentImages = grillzProcessImages.filter(
      (img) => img !== imageNameToRemove,
    );
    const newImageString =
      currentImages.length > 0 ? currentImages.join(",") : "";
    const updatedGrillData = { ...Grillzdetails, grillzImage: newImageString };

    setGrillzdetails(updatedGrillData);
    if (productId) {
      const firstStyle = grillzStyleList[0];
      await updateGrillz(productId, {
        quality:
          firstStyle?.quantity ??
          updatedGrillData.quantity ??
          updatedGrillData.quality,
        styleName: firstStyle?.styleName ?? updatedGrillData.styleName,
        grillzImage: newImageString,
      });
    }
  };

  const saveGrillTab = async (
    targetStatus: number,
    successMessage: string,
    missingIdMessage: string,
  ) => {
    const numericId = Number(productId);
    if (!productId || Number.isNaN(numericId) || numericId <= 0) {
      alert(missingIdMessage);
      return;
    }
    try {
      setIsSaving(true);
      const realTimeTimestamp = new Date().toISOString();
      const firstStyle = grillzStyleList[0];

      const mergedProcessing = {
        ...Processing,
        productID: numericId,
        renderIMG: renderImages.join(","),
        gemPosition: gemPositionImages.join(","),
        designIMG: designProcessImages.join(","),
        processImage: designProcessImages.join(","),
      };

      await updateGrillz(numericId, {
        quality:
          firstStyle?.quantity ??
          Grillzdetails.quantity ??
          Grillzdetails.quality,
        styleName: firstStyle?.styleName ?? Grillzdetails.styleName,
        grillzImage: Grillzdetails.grillzImage,
      });

      // Lưu ảnh & thông tin xử lý vào DsProcessing (nếu route /api/DsProcess hỗ trợ POST/PUT)
      await fetch("/api/DsProcess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedProcessing),
      });

      await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productID: numericId,
          productStatus: targetStatus,
        }),
      });

      await fetch("/api/WorkflowLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: numericId,
          timestamp: realTimeTimestamp,
        }),
      });

      setProcessing(mergedProcessing);
      alert(successMessage);
    } catch (error: any) {
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Hàm Save cho tab Design (Grillz)
  const handleSaveGrillDesign = () =>
    saveGrillTab(
      2,
      "Save Grill Design Successfully..!!",
      "Please select a product before saving Grill Design!",
    );

  // Hàm Save cho tab 3D Export (Grillz)
  const handleSaveGrill3DExport = () =>
    saveGrillTab(
      3,
      "Save Grill 3D Export Successfully..!!",
      "Please select a product before saving Grill 3D Export!",
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-wider">
          <Package className="h-6 w-6" />
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
        <DsProcessing
          onDataChange={(data) =>
            setProcessing((prev: any) => ({ ...prev, ...data }))
          }
        />
        <Material onDataChange={(data) => setMaterials(data)} />
        <GemStone onDataChange={(data) => setGemstones(data)} />
        <GrillzStyle onDataChange={(data) => setGrillzStyleList(data)} />
        <PictureFrame
          isGrill={true}
          parentCategory={parentCategory}
          activeParentTab={parentCategory}
          activeTab={subTab === 0 ? "DESIGN" : "3D EXPORT"}
          productOriginalImages={productOriginalImages}
          grillzProcessImages={
            activeLeftImages.length > 0 ? activeLeftImages : grillzProcessImages
          }
          designImages={designProcessImages}
          productImagePreviews={productImagePreviews}
          selectedPreviewImage={selectedPreviewImage}
          setSelectedPreviewImage={setSelectedPreviewImage}
          setSelectedFiles={setSelectedFiles}
          setProductImagePreviews={setProductImagePreviews}
          onRemoveExistingImage={handleRemoveExistingImage}
          onUploadSuccess={handleUploadSuccess}
          onDesignUploadSuccess={handleDesignUploadSuccess}
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
