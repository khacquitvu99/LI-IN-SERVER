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

export type ParentCategory = "product" | "grillz";

interface ProductDetailsContentProps {
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

export default function ProductDetailsContent({
  productId,
  productData,
  parentCategory = "product",
}: ProductDetailsContentProps) {
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
  const [GemCenter, setGemCenter] = useState<any>({
    shape: "",
    type: "",
    size: "",
    cost: "",
  });
  const [Gemstones, setGemstones] = useState<any[]>([]);

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
      ? splitImageList(rawImageString)
      : Array.isArray(rawImageString)
        ? rawImageString
        : [];

  const is3DExportTab = subTab === 1;
  const activeLeftImages = is3DExportTab ? gemPositionImages : renderImages;

  useEffect(() => {
    if (productId) {
      loadTabData(productId);
    }
  }, [productId]);

  const loadTabData = async (id: number) => {
    try {
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

      const loadedRender = splitImageList(
        loadedProcess?.renderIMG || loadedProcess?.RenderIMG,
      );
      const loadedGemPos = splitImageList(
        loadedProcess?.gemPosition ||
          loadedProcess?.GemPosition ||
          loadedProcess?.GemPositon,
      );
      const loadedDesignImg = splitImageList(
        loadedProcess?.designIMG ||
          loadedProcess?.DesignIMG ||
          loadedProcess?.processImage ||
          loadedProcess?.ProcessImage ||
          loadedProcess?.image,
      );

      setRenderImages(loadedRender);
      setGemPositionImages(loadedGemPos);
      setDesignProcessImages(loadedDesignImg);

      setProcessing({
        designer: loadedProcess?.designer || "",
        completedAt: loadedProcess?.completedAt || "",
        processImage: loadedDesignImg.join(","),
        renderIMG: loadedRender.join(","),
        gemPosition: loadedGemPos.join(","),
        designIMG: loadedDesignImg.join(","),
        image: loadedDesignImg.join(","),
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

  const handleUploadSuccess = (
    fileUrl: string,
    meta?: { isGemPositionTab?: boolean; dbField?: string },
    relativePath?: string,
  ) => {
    const mediaValue = relativePath || fileUrl;
    const isGemPos = Boolean(
      meta?.isGemPositionTab || meta?.dbField === "GemPosition" || subTab === 1,
    );

    isDirtyRef.current.processing = true;

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
  };

  const handleDesignUploadSuccess = (
    fileUrl: string,
    _meta?: any,
    relativePath?: string,
  ) => {
    const mediaValue = relativePath || fileUrl;
    isDirtyRef.current.processing = true;

    setDesignProcessImages((prev) => {
      const next = prev.includes(mediaValue) ? prev : [...prev, mediaValue];
      const joined = next.join(",");
      setProcessing((p: any) => ({
        ...p,
        designIMG: joined,
        processImage: joined,
        image: joined,
      }));
      return next;
    });
  };

  const handleRemoveExistingImage = async (
    imageNameToRemove: string,
    meta?: { section?: string; isGemPositionTab?: boolean },
  ) => {
    if (!confirm(`Are you sure you want to delete ${imageNameToRemove}??`))
      return;

    const isDesignSection = meta?.section === "design";
    const isGemPosSection =
      meta?.section === "gem_position" || Boolean(meta?.isGemPositionTab);

    isDirtyRef.current.processing = true;

    let nextProcessing = { ...Processing };

    if (isDesignSection) {
      const nextList = designProcessImages.filter(
        (img) => img !== imageNameToRemove,
      );
      const joined = nextList.join(",");
      setDesignProcessImages(nextList);
      nextProcessing = {
        ...nextProcessing,
        designIMG: joined,
        processImage: joined,
        image: joined,
      };
    } else if (isGemPosSection) {
      const nextList = gemPositionImages.filter(
        (img) => img !== imageNameToRemove,
      );
      setGemPositionImages(nextList);
      nextProcessing = {
        ...nextProcessing,
        gemPosition: nextList.join(","),
      };
    } else {
      const nextList = renderImages.filter((img) => img !== imageNameToRemove);
      setRenderImages(nextList);
      nextProcessing = {
        ...nextProcessing,
        renderIMG: nextList.join(","),
      };
    }

    setProcessing(nextProcessing);
    if (productId) {
      await updateProcessing(productId, nextProcessing);
    }
  };

  const saveAllProductData = async (
    targetStatus: number,
    successMessage: string,
  ) => {
    const numericId = Number(productId);
    if (!productId || Number.isNaN(numericId) || numericId <= 0) {
      alert("Please select a product before saving!");
      return;
    }
    try {
      setIsSaving(true);
      const realTimeTimestamp = new Date().toISOString();

      const mergedProcessingPayload = {
        ...Processing,
        renderIMG: renderImages.join(","),
        gemPosition: gemPositionImages.join(","),
        designIMG: designProcessImages.join(","),
        processImage: designProcessImages.join(","),
      };

      if (isDirtyRef.current.processing) {
        await updateProcessing(numericId, mergedProcessingPayload);
      }

      if (isDirtyRef.current.material && typeof updateMaterial === "function") {
        await updateMaterial(numericId, Materials);
      }

      if (isDirtyRef.current.gemstone && typeof updateGemstone === "function") {
        await updateGemstone(numericId, Gemstones);
      }

      if (
        isDirtyRef.current.gemCenter &&
        typeof updateGemCenter === "function"
      ) {
        const hasGemCenterData =
          GemCenter &&
          (GemCenter.shape ||
            GemCenter.type ||
            GemCenter.size ||
            GemCenter.cost ||
            GemCenter.id);

        if (hasGemCenterData) {
          await updateGemCenter(numericId, GemCenter);
        }
      }

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

      setProcessing(mergedProcessingPayload);
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

      <div className="space-y-6 pt-2">
        <DsProcessing
          onDataChange={(data) => {
            setProcessing((prev: any) => ({ ...prev, ...data }));
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
          parentCategory={parentCategory}
          activeParentTab={parentCategory}
          activeTab={subTab === 0 ? "DESIGN" : "3D EXPORT"}
          productOriginalImages={productOriginalImages}
          productProcessImages={activeLeftImages}
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
