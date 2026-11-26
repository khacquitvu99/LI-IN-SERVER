"use client";

import React, { useState } from "react";
import { Package, Upload, X, Palette } from "lucide-react";

export type ParentCategory = "product" | "grillz";

interface MediaMeta {
  table: "DsProcessing";
  tab: ParentCategory;
  subTab: "3D EXPORT" | "DESIGN";
  section: "gem_position" | "render" | "design";
  dbField: "renderIMG" | "GemPosition" | "DesignIMG";
  folder: string;
  isGrill: boolean;
  isGemPositionTab: boolean;
}

interface PictureFrameProps {
  productOriginalImages?: string[];
  productProcessImages?: string[];
  grillzProcessImages?: string[];
  designImages?: string[];
  productImagePreviews?: string[];
  setProductImagePreviews?: (imgs: string[]) => void;
  setSelectedFiles?: (files: File[]) => void;
  selectedPreviewImage?: string | null;
  setSelectedPreviewImage?: (img: string | null) => void;
  activeTab?: string; // "DESIGN" | "3D EXPORT"
  activeParentTab?: ParentCategory | string; // "product" | "grillz"
  parentCategory?: ParentCategory;
  isGrill?: boolean;
  onRemoveExistingImage?: (imgName: string, meta: MediaMeta) => void;
  onUploadSuccess?: (
    newFileUrl: string,
    meta: MediaMeta,
    relativePath: string,
  ) => void;
  onDesignUploadSuccess?: (
    newFileUrl: string,
    meta: MediaMeta,
    relativePath: string,
  ) => void;
}

const DESIGN_UPLOAD_FOLDER = "db.DsProcessing/ProcessImage";

function extractRawMediaPath(rawPath?: string | null): string {
  if (!rawPath) return "";
  const value = rawPath.trim();
  if (!value) return "";

  const queryIndex = value.indexOf("?path=");
  if (queryIndex !== -1) {
    const existingPath = value.slice(queryIndex + 6);
    if (!existingPath) return "";
    try {
      return decodeURIComponent(existingPath);
    } catch {
      return existingPath;
    }
  }

  const trimmed = value.replace(/^\/+/, "");
  if (trimmed.startsWith("api/images/")) {
    const subPath = trimmed.slice("api/images/".length);
    try {
      return decodeURIComponent(subPath);
    } catch {
      return subPath;
    }
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function buildMediaImageUrl(rawPath?: string | null): string {
  if (!rawPath) return "";

  const value = rawPath.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
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

async function uploadFilesToServer(
  files: FileList,
  folder: string,
  onSuccess?: (result: { url: string; relativePath: string }) => void,
) {
  const formData = new FormData();
  formData.append("folder", folder);
  for (let i = 0; i < files.length; i++) {
    formData.append("file", files[i]);
  }

  const uploadRes = await fetch("/api/uploadImage", {
    method: "POST",
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(uploadData.error || "Upload file thất bại!");
  }

  const rawServerTarget =
    uploadData.relativePath ||
    uploadData.path ||
    uploadData.url ||
    (uploadData.fileName ? `${folder}/${uploadData.fileName}` : null);

  if (rawServerTarget) {
    const newFileUrl = buildMediaImageUrl(rawServerTarget);
    const cleanRelPath = extractRawMediaPath(rawServerTarget);
    onSuccess?.({ url: newFileUrl, relativePath: cleanRelPath });
  }
}

async function deleteFileFromServer(imgName: string): Promise<void> {
  const rawPath = extractRawMediaPath(imgName);
  if (!rawPath || /^https?:\/\//i.test(rawPath)) return;

  const res = await fetch(
    `/api/uploadImage?path=${encodeURIComponent(rawPath)}`,
    {
      method: "DELETE",
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Xóa file trên server thất bại!");
  }
}

export default function PictureFrame({
  productOriginalImages = [],
  productProcessImages = [],
  grillzProcessImages = [],
  designImages = [],
  productImagePreviews = [],
  setProductImagePreviews,
  setSelectedFiles,
  selectedPreviewImage,
  setSelectedPreviewImage,
  activeTab = "DESIGN",
  activeParentTab = "product",
  parentCategory,
  isGrill = false,
  onRemoveExistingImage,
  onUploadSuccess,
  onDesignUploadSuccess,
}: PictureFrameProps) {
  const [internalSelectedImage, setInternalSelectedImage] = useState<
    string | null
  >(null);
  const [localDesignImages, setLocalDesignImages] = useState<string[]>([]);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  void productImagePreviews;
  void setProductImagePreviews;
  void setSelectedFiles;

  const effectiveParent =
    parentCategory ??
    (String(activeParentTab).trim().toLowerCase() === "grillz"
      ? "grillz"
      : "product");

  const normalizedParentTab: ParentCategory =
    isGrill || effectiveParent === "grillz" ? "grillz" : "product";

  const normalizedSubTab = String(activeTab || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  const isGemPositionTab = normalizedSubTab === "3d export";

  const currentProcessImages =
    normalizedParentTab === "grillz"
      ? grillzProcessImages
      : productProcessImages;

  const processTitle = isGemPositionTab ? "Gem Position" : "Render Images";
  const emptyMessage = isGemPositionTab
    ? "No gem position images available for this product..."
    : "No render images available for this product...";
  const uploadLabelText = isGemPositionTab
    ? "Upload Gem Position"
    : "Upload Render Images";

  const leftUploadFolder = isGemPositionTab
    ? "dc.DsProcessing/GemPosition"
    : "dc.DsProcessing/RenderIMG";

  const leftDbField: "renderIMG" | "GemPosition" = isGemPositionTab
    ? "GemPosition"
    : "renderIMG";

  const leftMeta: MediaMeta = {
    table: "DsProcessing",
    tab: normalizedParentTab,
    subTab: isGemPositionTab ? "3D EXPORT" : "DESIGN",
    section: isGemPositionTab ? "gem_position" : "render",
    dbField: leftDbField,
    folder: leftUploadFolder,
    isGrill: normalizedParentTab === "grillz",
    isGemPositionTab,
  };

  const designMeta: MediaMeta = {
    table: "DsProcessing",
    tab: normalizedParentTab,
    subTab: isGemPositionTab ? "3D EXPORT" : "DESIGN",
    section: "design",
    dbField: "DesignIMG",
    folder: DESIGN_UPLOAD_FOLDER,
    isGrill: normalizedParentTab === "grillz",
    isGemPositionTab,
  };

  const previewImage =
    selectedPreviewImage !== undefined
      ? selectedPreviewImage
      : internalSelectedImage;

  const handleSelectPreview = (img: string | null) => {
    if (setSelectedPreviewImage) {
      setSelectedPreviewImage(img);
    } else {
      setInternalSelectedImage(img);
    }
  };

  const mergedDesignImages =
    designImages && designImages.length > 0 ? designImages : localDesignImages;

  const handleUploadLeftFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      await uploadFilesToServer(
        files,
        leftUploadFolder,
        ({ url, relativePath }) => {
          onUploadSuccess?.(url, leftMeta, relativePath);
        },
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Upload file thất bại!";
      console.error("❌ Lỗi upload:", error);
      alert(`Thất bại: ${message}`);
    } finally {
      e.target.value = "";
    }
  };

  const handleUploadDesignFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      await uploadFilesToServer(
        files,
        DESIGN_UPLOAD_FOLDER,
        ({ url, relativePath }) => {
          setLocalDesignImages((prev) => [...prev, url]);
          onDesignUploadSuccess?.(url, designMeta, relativePath);
        },
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Upload file thất bại!";
      console.error("❌ Lỗi upload design:", error);
      alert(`Thất bại: ${message}`);
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveLeftImage = async (imgName: string) => {
    try {
      setDeletingImage(imgName);
      await deleteFileFromServer(imgName);
      onRemoveExistingImage?.(imgName, leftMeta);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Xóa file trên server thất bại!";
      console.error("❌ Lỗi xóa ảnh:", error);
      alert(`Xóa thất bại: ${message}`);
    } finally {
      setDeletingImage(null);
    }
  };

  const handleRemoveDesignImage = async (imgName: string) => {
    try {
      setDeletingImage(imgName);
      await deleteFileFromServer(imgName);
      setLocalDesignImages((prev) => prev.filter((item) => item !== imgName));
      onRemoveExistingImage?.(imgName, designMeta);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Xóa file trên server thất bại!";
      console.error("❌ Lỗi xóa ảnh design:", error);
      alert(`Xóa thất bại: ${message}`);
    } finally {
      setDeletingImage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HÀNG TRÊN: Sketch Images */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-600" />
          Sketch Images
        </h3>

        <div className="flex flex-wrap gap-3 justify-center">
          {productOriginalImages && productOriginalImages.length > 0 ? (
            productOriginalImages.map((imgName: string, index: number) => {
              const imgSrc = buildMediaImageUrl(imgName);
              return (
                <div
                  key={index}
                  onClick={() => handleSelectPreview(imgSrc)}
                  className="relative w-20 h-20 rounded-lg border border-amber-200 overflow-hidden shadow-2xs group bg-amber-50 cursor-pointer hover:border-amber-500 transition-all"
                  title="Click để xem ảnh lớn"
                >
                  <img
                    src={imgSrc}
                    alt={`Product Original ${index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-400 italic">
              No original images available for this product...
            </p>
          )}
        </div>
      </div>

      {/* HÀNG DƯỚI: 2 Ô GỘP (Ẩn Design Images ở tab 3D Export) */}
      <div
        className={`grid grid-cols-1 ${
          isGemPositionTab ? "lg:grid-cols-1" : "lg:grid-cols-2"
        } gap-6 items-stretch`}
      >
        {/* Ô TRÁI: Render Images (tab DESIGN) / Gem Position (tab 3D EXPORT) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              {processTitle}
            </h3>

            <div className="flex flex-wrap gap-3 justify-center min-h-12 items-center">
              {currentProcessImages && currentProcessImages.length > 0 ? (
                currentProcessImages.map((imgName: string, index: number) => {
                  const imgSrc = buildMediaImageUrl(imgName);
                  const isDeleting = deletingImage === imgName;

                  return (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-lg border border-amber-200 overflow-hidden shadow-2xs group bg-amber-50"
                    >
                      <img
                        src={imgSrc}
                        alt={`${processTitle} ${index}`}
                        onClick={() => handleSelectPreview(imgSrc)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        title="Click để xem ảnh lớn"
                      />
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLeftImage(imgName);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 disabled:opacity-40 transition-opacity cursor-pointer shadow-sm"
                        title="Delete image permanently"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 italic">{emptyMessage}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-600 hover:underline hover:decoration-amber-500 hover:decoration-2 underline-offset-4 cursor-pointer select-none">
              <Upload className="w-4 h-4 text-red-600 shrink-0 animate-pulse transition-all" />
              <span>{uploadLabelText}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleUploadLeftFile}
              />
            </label>
          </div>
        </div>

        {/* Ô PHẢI: Design Images + Upload Design Images (Chỉ hiện ở tab DESIGN) */}
        {!isGemPositionTab && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex flex-col justify-between space-y-5">
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-600" />
                Design Images
              </h3>

              <div className="flex flex-wrap gap-3 justify-center min-h-12 items-center">
                {mergedDesignImages && mergedDesignImages.length > 0 ? (
                  mergedDesignImages.map((imgName: string, index: number) => {
                    const imgSrc = buildMediaImageUrl(imgName);
                    const isDeleting = deletingImage === imgName;

                    return (
                      <div
                        key={index}
                        className="relative w-20 h-20 rounded-lg border border-amber-200 overflow-hidden shadow-2xs group bg-amber-50"
                      >
                        <img
                          src={imgSrc}
                          alt={`Design Image ${index}`}
                          onClick={() => handleSelectPreview(imgSrc)}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                          title="Click để xem ảnh lớn"
                        />
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDesignImage(imgName);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 disabled:opacity-40 transition-opacity cursor-pointer shadow-sm"
                          title="Delete design image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No design images available for this product...
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-600 hover:underline hover:decoration-amber-500 hover:decoration-2 underline-offset-4 cursor-pointer select-none">
                <Upload className="w-4 h-4 text-red-600 shrink-0 animate-pulse transition-all" />
                <span>Upload Design Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadDesignFile}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 🔍 MODAL XEM ẢNH LỚN & TẢI VỀ */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-3 bg-amber-500 text-white">
              <span className="text-sm font-bold">Image Preview</span>
              <button
                type="button"
                onClick={() => handleSelectPreview(null)}
                className="p-1 hover:bg-amber-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-gray-900 overflow-auto flex-1">
              <img
                src={previewImage}
                alt="Large Preview"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-3 bg-gray-50 border-t border-gray-200">
              <a
                href={previewImage}
                download="downloaded-image.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Download Image</span>
              </a>
              <button
                type="button"
                onClick={() => handleSelectPreview(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
