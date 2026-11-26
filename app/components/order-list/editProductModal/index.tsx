"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Trash2, Upload, X } from "lucide-react";
import { CUSTOMER_CODE, DropdownOption } from "@/components/attribute";
import StatusWorklog from "@/Utilities/updateStatus";
import {
  ProductEditForm,
  PendingFileItem,
  EditProductModalProps,
} from "@/types";

const EMPTY_FORM: ProductEditForm = {
  orderID: "",
  productCode: "",
  customerCode: "",
  productName: "",
  dateCreate: "",
  dateFinished: "",
  feedback: "",
  images: [],
  productStatus: "0",
};

function toDateInput(val: unknown): string {
  if (!val) return "";
  return String(val).slice(0, 10);
}

function normalizeImagePath(raw?: string | null): string {
  if (!raw) return "";
  let value = String(raw)
    .trim()
    .replace(/^["']+|["']+$/g, "");
  if (!value) return "";

  if (/^https?:\/\//i.test(value) || value.startsWith("blob:")) {
    return value;
  }

  const queryIdx = value.indexOf("?path=");
  if (queryIdx !== -1) {
    value = value
      .slice(queryIdx + 6)
      .split("&")[0]
      .split("?")[0];
  }

  if (/%[0-9A-Fa-f]{2}/.test(value)) {
    try {
      value = decodeURIComponent(value);
    } catch {
      // Giữ nguyên nếu decode lỗi
    }
  }

  return value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^api\/images\//i, "")
    .trim();
}

function parseImageList(raw?: unknown): string[] {
  if (!raw) return [];
  const parts = Array.isArray(raw)
    ? raw.flatMap((entry) => String(entry).split(","))
    : String(raw).split(",");

  const cleaned = parts.map((item) => normalizeImagePath(item)).filter(Boolean);

  return Array.from(new Set(cleaned));
}

function extractRawImages(raw: Record<string, unknown>): unknown {
  return (
    raw.Image ??
    raw.image ??
    raw.ProductImage ??
    raw.productImage ??
    raw.DesignImg ??
    raw.designImg ??
    ""
  );
}

// Khớp 100% với buildMediaImageUrl bên PictureFrame
function buildPreviewUrl(raw?: string | null): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const normalized = normalizeImagePath(trimmed);
  if (!normalized) return "";

  return `/api/images?path=${encodeURIComponent(normalized)}`;
}

function mapRawToForm(raw: Record<string, unknown>): ProductEditForm {
  const statusVal = raw.ProductStatus ?? raw.productStatus ?? raw.status;
  return {
    orderID: String(raw.OrderID ?? raw.orderID ?? raw.orderId ?? "").trim(),
    productCode: String(raw.ProductCode ?? raw.productCode ?? "").trim(),
    customerCode: String(raw.CustomerCode ?? raw.customerCode ?? "").trim(),
    productName: String(raw.ProductName ?? raw.productName ?? "").trim(),
    dateCreate: toDateInput(raw.DateCreate ?? raw.dateCreate),
    dateFinished: toDateInput(raw.DateFinished ?? raw.dateFinished),
    feedback: String(raw.Feedback ?? raw.feedback ?? "").trim(),
    images: parseImageList(extractRawImages(raw)),
    productStatus:
      statusVal !== undefined && statusVal !== null && String(statusVal) !== ""
        ? String(statusVal)
        : "0",
  };
}

export default function EditProductModal({
  isOpen,
  productId,
  initialData,
  onClose,
  onUpdated,
}: EditProductModalProps) {
  const [form, setForm] = useState<ProductEditForm>(EMPTY_FORM);
  const [pendingFiles, setPendingFiles] = useState<PendingFileItem[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !productId) return;

    let cancelled = false;
    setErrorMsg("");
    setBrokenImages({});
    setPendingFiles((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });

    if (initialData) {
      setForm(mapRawToForm(initialData));
    } else {
      setForm(EMPTY_FORM);
    }

    const loadProductDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(
          `/api/product?productID=${encodeURIComponent(String(productId))}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        const productRecord = data?.product || data?.data || null;

        if (!cancelled && res.ok && data?.success !== false && productRecord) {
          setForm(mapRawToForm(productRecord));
        }
      } catch (err) {
        console.error("Không tải được chi tiết sản phẩm:", err);
      } finally {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      }
    };

    loadProductDetail();

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId, initialData]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingFiles]);

  const customerOptions = useMemo<DropdownOption[]>(() => {
    const activeList = CUSTOMER_CODE.filter((opt) => opt.isActive !== false);
    const currentCode = form.customerCode.trim();

    if (
      currentCode &&
      !activeList.some(
        (opt) => opt.value.toLowerCase() === currentCode.toLowerCase(),
      )
    ) {
      return [
        {
          id: `current-${currentCode}`,
          value: currentCode,
          label: currentCode,
          isActive: true,
        },
        ...activeList,
      ];
    }

    return activeList;
  }, [form.customerCode]);

  if (!isOpen || !productId) return null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      setErrorMsg("Một số file không phải hình ảnh hợp lệ đã được bỏ qua.");
    } else {
      setErrorMsg("");
    }

    const mapped: PendingFileItem[] = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleRemovePendingFile = (idToRemove: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleClearAllImages = () => {
    setPendingFiles((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    setForm((prev) => ({ ...prev, images: [] }));
  };

  const uploadPendingFiles = async (): Promise<string[]> => {
    if (pendingFiles.length === 0) return [];

    const uploadedPaths: string[] = [];

    for (const item of pendingFiles) {
      const formData = new FormData();
      formData.append("file", item.file);

      const uploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(
          uploadData?.error ||
            uploadData?.message ||
            `Upload ảnh thất bại (HTTP ${uploadRes.status})`,
        );
      }

      const rawServerTarget =
        uploadData.path ||
        uploadData.relativePath ||
        uploadData.url ||
        (uploadData.filename ? `raw/${uploadData.filename}` : "");

      const normalized = normalizeImagePath(rawServerTarget);
      if (!normalized) {
        throw new Error("Server không trả về đường dẫn ảnh sau khi upload.");
      }

      uploadedPaths.push(normalized);
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      setErrorMsg("Vui lòng nhập tên sản phẩm.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const newlyUploadedPaths = await uploadPendingFiles();
      const finalImages = Array.from(
        new Set([...form.images, ...newlyUploadedPaths]),
      );

      const payload = {
        productID: Number(
          isNaN(Number(productId)) ? productId : Number(productId),
        ),
        OrderID: form.orderID.trim(),
        ProductCode: form.productCode.trim(),
        CustomerCode: form.customerCode.trim(),
        ProductName: form.productName.trim(),
        DateCreate: form.dateCreate || null,
        DateFinished: form.dateFinished || null,
        Feedback: form.feedback.trim(),
        Image: finalImages.join(","),
        ProductStatus: Number(form.productStatus) || 0,
      };

      const res = await fetch("/api/product", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(
          data.message || `Cập nhật thất bại (HTTP ${res.status})`,
        );
      }

      onUpdated?.(payload);
      onClose();
    } catch (err: any) {
      console.error("Lỗi cập nhật sản phẩm:", err);
      setErrorMsg(err?.message || "Có lỗi xảy ra khi cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  const totalImageCount = form.images.length + pendingFiles.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-amber-200 w-full max-w-xl p-4 sm:p-6 shadow-xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-950">
              Update Product{" "}
              <span className="text-amber-600">
                {form.productName || `#${productId}`}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingDetail && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-xs">
            Loading data information #{productId}...
          </div>
        )}

        {errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* ProductCode & CustomerCode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ProductCode
              </label>
              <input
                type="text"
                value={form.productCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productCode: e.target.value }))
                }
                className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                CustomerCode
              </label>
              <div className="relative">
                <select
                  value={form.customerCode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customerCode: e.target.value,
                    }))
                  }
                  className="w-full appearance-none px-3 py-1.5 sm:py-2 pr-9 border border-gray-300 bg-white rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="">-- Select CustomerCode --</option>
                  {customerOptions.map((item) => (
                    <option key={item.id} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* ProductName & ProductStatus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ProductName *
              </label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, productName: e.target.value }))
                }
                className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ProductStatus
              </label>
              <input
                type="number"
                value={form.productStatus}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    productStatus: e.target.value,
                  }))
                }
                className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                DateCreate
              </label>
              <input
                type="date"
                value={form.dateCreate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateCreate: e.target.value }))
                }
                className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                DateFinished
              </label>
              <input
                type="date"
                value={form.dateFinished}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateFinished: e.target.value }))
                }
                className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Feedback
            </label>
            <textarea
              rows={2}
              value={form.feedback}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, feedback: e.target.value }))
              }
              className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Chọn nhiều ảnh + Preview */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-gray-700">
                Product Images ({totalImageCount})
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                </label>

                {totalImageCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllImages}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {totalImageCount > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {form.images.map((imgPath, idx) => {
                  const previewSrc = buildPreviewUrl(imgPath);
                  const isBroken = Boolean(brokenImages[imgPath]);

                  return (
                    <div
                      key={`existing-${imgPath}-${idx}`}
                      className="relative group aspect-square rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center p-1"
                    >
                      {isBroken ? (
                        <span className="text-[10px] text-center text-red-500 px-1 break-all">
                          Lỗi ảnh: {imgPath}
                        </span>
                      ) : (
                        <img
                          src={previewSrc}
                          alt={`Image ${idx + 1}`}
                          onError={() =>
                            setBrokenImages((prev) => ({
                              ...prev,
                              [imgPath]: true,
                            }))
                          }
                          className="max-w-full max-h-full w-full h-full object-contain"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        title="Remove image"
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/65 hover:bg-red-600 text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {pendingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="relative group aspect-square rounded-lg border border-amber-300 bg-white overflow-hidden flex items-center justify-center p-1"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="max-w-full max-h-full w-full h-full object-contain"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-medium">
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePendingFile(item.id)}
                      title="Remove selected image"
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/65 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs italic text-gray-400">
                No images selected
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loadingDetail}
              className="px-4 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
