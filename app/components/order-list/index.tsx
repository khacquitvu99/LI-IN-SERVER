"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import ButtonNewOder from "@/CountingComponent/buttonNewOder";
import { STATUS_OPTIONS, getStatusLabel } from "@/components/attribute";

const ITEMS_PER_PAGE = 12;

function resolveProductImageUrl(rawPath?: string | null): string {
  if (!rawPath) return "";

  const value = rawPath.trim();
  if (!value) return "";

  // Đã là URL đầy đủ http/https thì giữ nguyên
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const trimmed = value.replace(/^\/+/, "");

  // Nếu đã là đường dẫn /api/images/... hoặc /api/images?path=... thì giữ nguyên
  if (trimmed.startsWith("api/images")) {
    return `/${trimmed}`;
  }

  // Trường hợp path thô như "raw/2026/11/..." -> gọi qua query ?path=
  return `/api/images?path=${encodeURIComponent(trimmed)}`;
}

export default function OrderList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentProductId = searchParams.get("productId");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const masterDataRef = useRef<any[]>([]);
  const currentCustomerRef = useRef("ALL");
  const currentKeywordRef = useRef("");
  const currentStatusRef = useRef("");

  const applyCombinedFilter = useCallback(() => {
    const keyword = currentKeywordRef.current.toLowerCase().trim();
    const statusFilter = currentStatusRef.current;

    const filtered = masterDataRef.current
      .map((order) => {
        const orderProducts = order.products || order.items || [];

        const matchedProducts = orderProducts.filter((prod: any) => {
          const pCode = String(prod.ProductCode || "").toLowerCase();
          const pName = String(prod.productName || "").toLowerCase();
          const pStatus = String(
            prod.productStatus ?? prod.ProductStatus ?? "",
          );

          const matchKeyword =
            !keyword || pCode.includes(keyword) || pName.includes(keyword);
          const matchStatus = !statusFilter || pStatus === statusFilter;

          return matchKeyword && matchStatus;
        });

        if (matchedProducts.length === 0) return null;

        return {
          ...order,
          products: matchedProducts,
          items: matchedProducts,
        };
      })
      .filter(Boolean);

    setOrders(filtered);
  }, []);

  const fetchOrders = useCallback(
    async (orderID?: string, silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const targetOrderID = orderID || currentCustomerRef.current || "ALL";
        const response = await fetch(
          `/api/orderlist?orderID=${targetOrderID}`,
          {
            cache: "no-store",
          },
        );
        const result = await response.json();

        const orderData = result.orders || result.data;
        if (result.success && Array.isArray(orderData)) {
          masterDataRef.current = orderData;
          applyCombinedFilter();
        } else {
          masterDataRef.current = [];
          setOrders([]);
        }
      } catch (error) {
        console.error("Error loading the order list!!", error);
        if (!silent) {
          masterDataRef.current = [];
          setOrders([]);
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [applyCombinedFilter],
  );

  useEffect(() => {
    fetchOrders("ALL", false);

    const handleCustomerChange = (event: Event) => {
      const orderIdCode = (event as CustomEvent).detail;
      if (orderIdCode) {
        currentCustomerRef.current = orderIdCode;
        setCurrentPage(1);
        fetchOrders(orderIdCode, false);
      }
    };

    const handleProductSearch = (event: Event) => {
      currentKeywordRef.current = (event as CustomEvent).detail || "";
      setCurrentPage(1);
      applyCombinedFilter();
    };

    window.addEventListener("customerChanged", handleCustomerChange);
    window.addEventListener("productSearchChanged", handleProductSearch);

    return () => {
      window.removeEventListener("customerChanged", handleCustomerChange);
      window.removeEventListener("productSearchChanged", handleProductSearch);
    };
  }, [fetchOrders, applyCombinedFilter]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value);
    currentStatusRef.current = value;
    setCurrentPage(1);
    applyCombinedFilter();
  };

  const toggleOrder = (orderID: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderID]: !prev[orderID],
    }));
  };

  const handleSelectProduct = (prod: any, e: React.MouseEvent) => {
    e.stopPropagation();

    const pID = prod.ProductCode || prod.ProductID || prod.productID || prod.id;
    if (!pID) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("productId", String(pID));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const currentOrders = orders.slice(
    indexOfLastItem - ITEMS_PER_PAGE,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  return (
    <aside className="lg:col-span-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-2 sm:p-2.5 bg-linear-to-r from-amber-200 to-amber-400 border-b border-amber-300 gap-2">
        <div className="relative flex-1 min-w-0">
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full bg-amber-50/90 border border-amber-300 text-amber-950 text-xs font-semibold rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer shadow-xs"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter((item) => item.isActive).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchOrders(currentCustomerRef.current, true);
            }}
            disabled={isRefreshing || loading}
            title="Làm mới danh sách"
            className="p-1.5 sm:p-2 bg-amber-50/90 hover:bg-white text-amber-900 border border-amber-300 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                isRefreshing ? "animate-spin text-amber-600" : ""
              }`}
            />
          </button>

          <ButtonNewOder />
        </div>
      </div>

      <div className="grid grid-cols-12 items-center text-[11px] sm:text-xs text-gray-700 font-semibold uppercase bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-2.5">
        <div className="col-span-5">Order</div>
        <div className="col-span-3">Image</div>
        <div className="col-span-4 text-right">Status</div>
      </div>

      <div className="max-h-24 sm:max-h-none overflow-y-auto sm:overflow-visible divide-y divide-gray-100">
        {loading ? (
          <div className="text-center py-6 text-xs sm:text-sm text-gray-400">
            Loading list order...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-6 text-xs sm:text-sm text-gray-400">
            No product for this order!!
          </div>
        ) : (
          currentOrders.map((order, index) => {
            const orderID = order.orderID || order.OrderID || `order-${index}`;
            const isExpanded = !!expandedOrders[orderID];
            const orderProducts = order.products || order.items || [];

            const currentOrderStatus = String(
              order.status || "In Progress",
            ).trim();
            const isOrderCompleted =
              currentOrderStatus.toLowerCase() === "completed";

            return (
              <React.Fragment key={orderID}>
                <div
                  onClick={() => toggleOrder(orderID)}
                  className="grid grid-cols-12 items-center px-3 sm:px-4 py-2.5 text-xs sm:text-sm hover:bg-amber-50/40 transition-colors cursor-pointer bg-amber-50/20 font-semibold gap-1.5"
                >
                  <div className="col-span-5 text-amber-900 flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] sm:text-xs text-gray-500 w-3 shrink-0">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span className="whitespace-nowrap">{orderID}</span>
                  </div>

                  <div className="col-span-3 text-[11px] sm:text-xs text-gray-500 italic whitespace-nowrap">
                    {orderProducts.length} Product
                  </div>

                  <div className="col-span-4 text-right">
                    <span
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full border whitespace-nowrap inline-block ${
                        isOrderCompleted
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {currentOrderStatus}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-2 sm:p-3 bg-blue-50/10 border-t border-blue-100">
                    <div className="bg-white rounded-lg shadow-xs border border-blue-200 overflow-hidden divide-y divide-gray-100">
                      {orderProducts.length === 0 ? (
                        <div className="px-3 sm:px-4 py-3 text-center text-xs text-gray-400">
                          Product empty..!!
                        </div>
                      ) : (
                        orderProducts.map((prod: any, pIndex: number) => {
                          const pID =
                            prod.ProductCode ||
                            prod.ProductID ||
                            prod.productID;

                          const isSelected =
                            currentProductId === pID?.toString();

                          const imageList = prod.image
                            ? prod.image
                                .split(",")
                                .map((img: string) => img.trim())
                                .filter(Boolean)
                            : [];

                          const productStatusLabel = getStatusLabel(
                            prod.productStatus ?? prod.ProductStatus,
                          );

                          return (
                            <div
                              key={pIndex}
                              onClick={(e) => handleSelectProduct(prod, e)}
                              className={`grid grid-cols-12 items-center px-2.5 py-2 text-xs cursor-pointer transition-colors gap-1.5 ${
                                isSelected
                                  ? "bg-blue-100/80 font-bold border-l-4 border-l-blue-600"
                                  : "hover:bg-blue-50/40"
                              }`}
                            >
                              <div className="col-span-4 font-medium text-blue-900 min-w-0">
                                <div className="text-[10px] text-amber-600 font-semibold truncate">
                                  Code: {pID || "N/A"}
                                </div>
                                <div className="truncate">
                                  {prod.productName}
                                </div>
                              </div>

                              <div className="col-span-4">
                                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                                  {imageList.length > 0 ? (
                                    imageList.map(
                                      (imgStr: string, imgIndex: number) => {
                                        const imgSrc =
                                          resolveProductImageUrl(imgStr);
                                        if (!imgSrc) return null;

                                        return (
                                          <div
                                            key={imgIndex}
                                            className="w-9 h-9 sm:w-11 sm:h-11 rounded bg-gray-100 border border-blue-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
                                          >
                                            <img
                                              src={imgSrc}
                                              alt={`Product img ${imgIndex + 1}`}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                            />
                                          </div>
                                        );
                                      },
                                    )
                                  ) : (
                                    <span className="text-[10px] text-gray-400">
                                      No Img
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="col-span-4 text-right">
                                <span className="px-2 py-0.5 text-[10px] font-medium text-red-800 bg-blue-50 rounded-full inline-block max-w-full truncate">
                                  {productStatusLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {orders.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-t border-gray-200">
          <div className="text-xs sm:text-sm text-amber-600">
            Total <span className="font-semibold">{orders.length}</span> orders
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 sm:px-3 py-1 text-xs text-gray-900 font-medium bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Previous
            </button>

            <span className="px-2 sm:px-3 py-1 text-xs font-medium flex items-center text-gray-700 whitespace-nowrap">
              Page {currentPage} / {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 sm:px-3 py-1 text-xs text-gray-900 font-medium bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
