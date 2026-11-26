"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface PictureFrameProps {
  designImg?: string;
  statusImg?: string;
  stoneDiagramImg?: string;
  productEndpoint?: string;
  productStatusEndpoint?: string;
  productGetAllEndpoint?: string;
  dsProcessEndpoint?: string;
}

interface StageTableConfig {
  endpoint: string;
  imageFields: string[];
  label: string;
  fallbackStages?: {
    endpoint: string;
    imageFields: string[];
    label: string;
  }[];
}

const STATUS_TO_STAGE_CONFIG: Record<number, StageTableConfig> = {
  1: {
    endpoint: "/api/product/getAll",
    imageFields: ["statusImg", "productImg", "image"],
    label: "New Order",
  },
  2: {
    endpoint: "/api/product/getAll",
    imageFields: ["statusImg", "productImg", "image"],
    label: "Quotation",
  },
  3: {
    endpoint: "/api/DsProcess",
    imageFields: ["processImage", "designImg", "image"],
    label: "Design 3D",
  },
  4: {
    endpoint: "/api/DsProcess",
    imageFields: ["processImage", "designImg", "image"],
    label: "Printing/CNC",
  },
  5: {
    endpoint: "/api/casting",
    imageFields: ["castingImg", "castingIMG", "CastingIMG"],
    label: "Casting",
  },
  6: {
    endpoint: "/api/sanding",
    imageFields: ["sandingImg", "sandingIMG", "SandingIMG"],
    label: "Sanding",
    fallbackStages: [
      {
        endpoint: "/api/casting",
        imageFields: ["castingImg", "castingIMG", "CastingIMG"],
        label: "Casting",
      },
    ],
  },
  7: {
    endpoint: "/api/settingGems",
    imageFields: [
      "settingGemImg",
      "settingGemIMG",
      "settingImg",
      "SettingGemIMG",
    ],
    label: "Setting Gem",
    fallbackStages: [
      {
        endpoint: "/api/sanding",
        imageFields: ["sandingImg", "sandingIMG", "SandingIMG"],
        label: "Sanding",
      },
      {
        endpoint: "/api/casting",
        imageFields: ["castingImg", "castingIMG", "CastingIMG"],
        label: "Casting",
      },
    ],
  },
  8: {
    endpoint: "/api/polishing",
    imageFields: ["polishingImg", "polishingIMG", "PolishingIMG"],
    label: "Polishing",
    fallbackStages: [
      {
        endpoint: "/api/settingGems",
        imageFields: [
          "settingGemImg",
          "settingGemIMG",
          "settingImg",
          "SettingGemIMG",
        ],
        label: "Setting Gem",
      },
      {
        endpoint: "/api/sanding",
        imageFields: ["sandingImg", "sandingIMG", "SandingIMG"],
        label: "Sanding",
      },
      {
        endpoint: "/api/casting",
        imageFields: ["castingImg", "castingIMG", "CastingIMG"],
        label: "Casting",
      },
    ],
  },
  9: {
    endpoint: "/api/plating",
    imageFields: ["platingImg", "platingIMG", "PlatingIMG"],
    label: "Plating",
    fallbackStages: [
      {
        endpoint: "/api/polishing",
        imageFields: ["polishingImg", "polishingIMG", "PolishingIMG"],
        label: "Polishing",
      },
      {
        endpoint: "/api/settingGems",
        imageFields: [
          "settingGemImg",
          "settingGemIMG",
          "settingImg",
          "SettingGemIMG",
        ],
        label: "Setting Gem",
      },
      {
        endpoint: "/api/sanding",
        imageFields: ["sandingImg", "sandingIMG", "SandingIMG"],
        label: "Sanding",
      },
      {
        endpoint: "/api/casting",
        imageFields: ["castingImg", "castingIMG", "CastingIMG"],
        label: "Casting",
      },
    ],
  },
  10: {
    endpoint: "/api/plating",
    imageFields: ["platingImg", "platingIMG", "PlatingIMG"],
    label: "Completed",
    fallbackStages: [
      {
        endpoint: "/api/polishing",
        imageFields: ["polishingImg", "polishingIMG", "PolishingIMG"],
        label: "Polishing",
      },
      {
        endpoint: "/api/settingGems",
        imageFields: [
          "settingGemImg",
          "settingGemIMG",
          "settingImg",
          "SettingGemIMG",
        ],
        label: "Setting Gem",
      },
      {
        endpoint: "/api/sanding",
        imageFields: ["sandingImg", "sandingIMG", "SandingIMG"],
        label: "Sanding",
      },
      {
        endpoint: "/api/casting",
        imageFields: ["castingImg", "castingIMG", "CastingIMG"],
        label: "Casting",
      },
    ],
  },
};

function buildMediaImageUrl(rawPath?: string | null): string {
  if (!rawPath) return "";

  const value = rawPath.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value) || value.startsWith("blob:")) {
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

function pickLastMediaItem(raw?: unknown): string {
  if (!raw) return "";
  if (Array.isArray(raw)) {
    const items = raw.map((item) => String(item).trim()).filter(Boolean);
    return items[items.length - 1] || "";
  }
  const str = String(raw).trim();
  if (!str) return "";
  const parts = str
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

function matchProductById(item: any, targetId: string): boolean {
  if (!item || typeof item !== "object") return false;
  const candidateIds = [
    item.productId,
    item.ProductID,
    item.productID,
    item.ProductId,
    item.id,
    item.ID,
  ].filter((v) => v !== undefined && v !== null);

  return candidateIds.some((v) => String(v).trim() === String(targetId).trim());
}

function findMatchedRecord(data: any, targetId: string): any | null {
  if (!data) return null;

  const listContainers = [
    data.DsProcessing,
    data.dsProcessing,
    data.Processing,
    data.casting,
    data.sanding,
    data.settingGem,
    data.settingGems,
    data.polishing,
    data.plating,
    data.products,
    data.data,
    data.items,
    data.list,
    Array.isArray(data) ? data : null,
  ].filter(Boolean);

  for (const container of listContainers) {
    if (Array.isArray(container)) {
      const found = container.find((row) => matchProductById(row, targetId));
      if (found) return found;
    }
  }

  const singleObjects = [
    data.product,
    data.statusData,
    data.record,
    data.result,
    typeof data === "object" && !Array.isArray(data) ? data : null,
  ].filter(Boolean);

  for (const obj of singleObjects) {
    if (matchProductById(obj, targetId)) return obj;
  }

  return null;
}

function collectRecords(data: any, targetId?: string): any[] {
  if (!data) return [];

  if (targetId) {
    const matched = findMatchedRecord(data, targetId);
    if (matched) return [matched];
  }

  const buckets = [
    data.DsProcessing,
    data.dsProcessing,
    data.Processing,
    data.product,
    data.products,
    data.data,
    data.casting,
    data.sanding,
    data.polishing,
    data.settingGem,
    data.settingGems,
    data.plating,
    data.record,
    data.result,
    data,
  ].filter(Boolean);

  const records: any[] = [];
  for (const b of buckets) {
    if (Array.isArray(b)) {
      for (let i = b.length - 1; i >= 0; i--) {
        if (b[i] && typeof b[i] === "object") {
          records.push(b[i]);
        }
      }
    } else if (typeof b === "object") {
      records.push(b);
    }
  }

  return records;
}

function parseStatusNumber(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  const str = String(raw).trim();
  const match = str.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
}

function extractDsProcessMedia(
  data: any,
  targetId: string,
): {
  renderImg: string;
  gemPositionImg: string;
  processImage: string;
} {
  const records = collectRecords(data, targetId);
  let renderImg = "";
  let gemPositionImg = "";
  let processImage = "";

  for (const item of records) {
    if (!item || typeof item !== "object") continue;

    if (!renderImg) {
      renderImg = pickLastMediaItem(item.renderIMG);
    }

    if (!gemPositionImg) {
      gemPositionImg = pickLastMediaItem(item.gemPosition ?? item.GemPosition);
    }

    if (!processImage) {
      processImage = pickLastMediaItem(item.processImage ?? item.ProcessImage);
    }
  }

  return { renderImg, gemPositionImg, processImage };
}

function extractProductStatusAndMedia(
  data: any,
  targetId: string,
): {
  productStatus: number | null;
  designImg: string;
  stoneDiagramImg: string;
} {
  const records = collectRecords(data, targetId);
  const directCandidates = [...records];
  if (data && typeof data === "object" && !Array.isArray(data)) {
    directCandidates.push(data);
  }

  let productStatus: number | null = null;
  let designImg = "";
  let stoneDiagramImg = "";

  for (const item of directCandidates) {
    if (!item || typeof item !== "object") continue;

    if (productStatus === null) {
      const rawStatus =
        item.productStatus ??
        item.ProductStatus ??
        item.status ??
        item.Status ??
        item.currentStatus;
      productStatus = parseStatusNumber(rawStatus);
    }

    if (!designImg) {
      const picked = pickLastMediaItem(
        item.designImg ?? item.renderImg ?? item.RenderIMG,
      );
      if (picked) designImg = picked;
    }

    if (!stoneDiagramImg) {
      const picked = pickLastMediaItem(item.gemPosition ?? item.GemPosition);
      if (picked) stoneDiagramImg = picked;
    }
  }

  return { productStatus, designImg, stoneDiagramImg };
}

function extractImageFromStageData(
  data: any,
  preferredFields: string[],
  targetId?: string,
): string {
  const records = collectRecords(data, targetId);

  for (const item of records) {
    for (const field of preferredFields) {
      if (field in item) {
        const picked = pickLastMediaItem(item[field]);
        if (picked) return picked;
      }
    }
  }

  return "";
}

async function fetchJsonQuietly(
  url: string,
  signal: AbortSignal,
): Promise<any | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return null;
  }
}

export default function PictureFrame({
  designImg = "",
  statusImg = "",
  stoneDiagramImg = "",
  productEndpoint = "",
  productStatusEndpoint = "/api/product/status",
  productGetAllEndpoint = "/api/product/getAll",
  dsProcessEndpoint = "/api/DsProcess",
}: PictureFrameProps) {
  const searchParams = useSearchParams();
  const productId =
    searchParams.get("productId") || searchParams.get("productID") || "";

  const [fetchedStatusImg, setFetchedStatusImg] = useState<string>("");
  const [fetchedDesignImg, setFetchedDesignImg] = useState<string>("");
  const [fetchedStoneImg, setFetchedStoneImg] = useState<string>("");
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);

  useEffect(() => {
    const trimmedId = productId.trim();
    if (!trimmedId) {
      setFetchedStatusImg("");
      setFetchedDesignImg("");
      setFetchedStoneImg("");
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    async function resolveByProductIdAndStatus() {
      setIsLoadingStatus(true);
      try {
        const effectiveStatusEndpoint = (
          productStatusEndpoint ||
          productEndpoint ||
          "/api/product/status"
        ).trim();
        const effectiveGetAllEndpoint = (
          productGetAllEndpoint || "/api/product/getAll"
        ).trim();
        const effectiveDsProcessEndpoint = (
          dsProcessEndpoint || "/api/DsProcess"
        ).trim();

        const [statusJson, dsProcessJson] = await Promise.all([
          fetchJsonQuietly(
            `${effectiveStatusEndpoint}${effectiveStatusEndpoint.includes("?") ? "&" : "?"}productId=${encodeURIComponent(trimmedId)}`,
            controller.signal,
          ),
          fetchJsonQuietly(
            `${effectiveDsProcessEndpoint}${effectiveDsProcessEndpoint.includes("?") ? "&" : "?"}productID=${encodeURIComponent(trimmedId)}`,
            controller.signal,
          ),
        ]);
        if (isCancelled) return;

        const dsMedia = extractDsProcessMedia(dsProcessJson, trimmedId);

        let {
          productStatus,
          designImg: prodDesign,
          stoneDiagramImg: prodStone,
        } = extractProductStatusAndMedia(statusJson, trimmedId);

        let allProductsJson: any = null;

        if (
          productStatus === null ||
          (!dsMedia.renderImg && !prodDesign) ||
          (!dsMedia.gemPositionImg && !prodStone)
        ) {
          allProductsJson = await fetchJsonQuietly(
            effectiveGetAllEndpoint,
            controller.signal,
          );
          if (isCancelled) return;

          const fromAll = extractProductStatusAndMedia(
            allProductsJson,
            trimmedId,
          );
          if (productStatus === null) productStatus = fromAll.productStatus;
          if (!prodDesign) prodDesign = fromAll.designImg;
          if (!prodStone) prodStone = fromAll.stoneDiagramImg;
        }

        setFetchedDesignImg(dsMedia.renderImg || prodDesign || "");
        setFetchedStoneImg(dsMedia.gemPositionImg || prodStone || "");

        if (
          productStatus !== null &&
          STATUS_TO_STAGE_CONFIG[productStatus] !== undefined
        ) {
          const stageCfg = STATUS_TO_STAGE_CONFIG[productStatus];
          let resolvedImg = "";

          if (
            productStatus <= 4 &&
            stageCfg.endpoint === effectiveDsProcessEndpoint
          ) {
            resolvedImg = dsMedia.processImage;
          } else {
            const primaryJson =
              stageCfg.endpoint === effectiveGetAllEndpoint
                ? allProductsJson ||
                  (await fetchJsonQuietly(stageCfg.endpoint, controller.signal))
                : stageCfg.endpoint === effectiveDsProcessEndpoint
                  ? dsProcessJson
                  : await fetchJsonQuietly(
                      `${stageCfg.endpoint}${stageCfg.endpoint.includes("?") ? "&" : "?"}productId=${encodeURIComponent(trimmedId)}`,
                      controller.signal,
                    );
            if (isCancelled) return;

            resolvedImg = extractImageFromStageData(
              primaryJson,
              stageCfg.imageFields,
              trimmedId,
            );
          }

          if (!resolvedImg && stageCfg.fallbackStages?.length) {
            for (const fbStage of stageCfg.fallbackStages) {
              if (isCancelled) return;
              const fbJson = await fetchJsonQuietly(
                `${fbStage.endpoint}${fbStage.endpoint.includes("?") ? "&" : "?"}productId=${encodeURIComponent(trimmedId)}`,
                controller.signal,
              );
              if (isCancelled) return;

              const fbImg = extractImageFromStageData(
                fbJson,
                fbStage.imageFields,
                trimmedId,
              );
              if (fbImg) {
                resolvedImg = fbImg;
                break;
              }
            }
          }

          setFetchedStatusImg(resolvedImg);
        } else {
          setFetchedStatusImg("");
        }
      } catch (err: any) {
        if (err?.name === "AbortError" || isCancelled) return;
        console.warn("PictureFrame flow error:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingStatus(false);
        }
      }
    }

    resolveByProductIdAndStatus();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [
    productId,
    productStatusEndpoint,
    productGetAllEndpoint,
    productEndpoint,
    dsProcessEndpoint,
  ]);

  const resolvedDesignSrc = buildMediaImageUrl(designImg || fetchedDesignImg);
  const resolvedStatusSrc = buildMediaImageUrl(statusImg || fetchedStatusImg);
  const resolvedStoneSrc = buildMediaImageUrl(
    stoneDiagramImg || fetchedStoneImg,
  );

  return (
    <div className="space-y-6 w-full mx-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
      {/* Khối 2 ảnh thiết kế & trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ảnh thiết kế */}
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
          <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Design Image
          </h5>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-200/60 border border-gray-200 flex items-center justify-center text-gray-400">
            {resolvedDesignSrc ? (
              <img
                src={resolvedDesignSrc}
                alt="Design Image"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs italic">No design image available</span>
            )}
          </div>
        </div>

        {/* Ảnh trạng thái */}
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
          <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Status Image
          </h5>
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-white border border-gray-200 flex items-center justify-center p-2 text-gray-400">
            {isLoadingStatus ? (
              <span className="text-xs italic text-amber-700">
                Loading status image...
              </span>
            ) : resolvedStatusSrc ? (
              <img
                src={resolvedStatusSrc}
                alt={`Status Image ${productId || ""}`}
                className="max-w-full max-h-full w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs italic">
                {productId
                  ? "No status image available"
                  : "Select a product from Order List"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Khối sơ đồ vị trí các loại đá */}
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200/80">
        <h5 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Gem Position Diagram
        </h5>
        <div className="relative min-h-55 w-full h-125 overflow-hidden rounded-md bg-gray-200/60 border border-gray-200 flex items-center justify-center text-gray-400">
          {resolvedStoneSrc ? (
            <img
              src={resolvedStoneSrc}
              alt="Gem Position Diagram"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs italic">
              No gem position diagram available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
