"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  Clock,
  RefreshCcw,
  Megaphone,
} from "lucide-react";
import { NotificationItem } from "@/types";
import { getStatusLabel } from "@/components/attribute"; // 🌟 Import hàm ánh xạ dùng chung

interface LiveStatusScrollProps {
  notifications?: NotificationItem[];
}

export default function LiveStatusScroll({
  notifications: initialNotifications,
}: LiveStatusScrollProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications || [],
  );
  const [loading, setLoading] = useState<boolean>(false);

  // 🚀 Hàm fetch dữ liệu trực tiếp từ API WorkflowLogs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/WorkflowLogs");
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const now = new Date().getTime();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày tính bằng mili-giây

        const formattedLogs: NotificationItem[] = result.data
          .filter((item: any) => {
            const createdAtStr = item.CreatedAt || item.createdAt;
            if (!createdAtStr) return false;
            const logTime = new Date(createdAtStr).getTime();
            // 🛡️ Chỉ giữ lại những log có thời gian cách hiện tại dưới 7 ngày
            return now - logTime <= SEVEN_DAYS_MS;
          })
          .map((item: any) => ({
            id: item.LogID || item.logID,
            productName: item.ProductName || item.productName,
            statusText: item.StatusText || item.statusText,
            timestamp: item.CreatedAt || item.createdAt,
          }));

        setNotifications(formattedLogs);
      }
    } catch (error) {
      console.error("Error fetching workflow logs feed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động load khi mount và polling mỗi 10 giây để cập nhật real-time
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white border border-amber-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header của khung thông báo */}
      <div className="bg-linear-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <BellRing className="w-4 h-4 animate-bounce text-amber-100" />
          <span>Notification processing</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
            {notifications.length} logs recorded
          </span>
          <button
            onClick={fetchLogs}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            title="Làm mới log"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 text-amber-100 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Vùng chứa danh sách có thanh cuộn (Scrollable container) */}
      <div className="max-h-28 overflow-y-auto divide-y divide-amber-100 p-2 scrollbar-thin scrollbar-thumb-amber-300">
        {notifications.length > 0 ? (
          notifications.map((item, index) => {
            const isLatest = index === 0;
            // 🌟 Sử dụng hàm ánh xạ dùng chung lấy nhãn status chuẩn từ 1 đến 10
            const statusKey = String(item.statusText ?? "").trim();
            const statusLabel =
              getStatusLabel(statusKey) || item.statusText || "In Progress";

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-1 py-2.5 transition-all rounded-lg text-xs my-0.5 ${
                  isLatest
                    ? "bg-amber-50/90 border border-amber-300 shadow-2xs font-semibold"
                    : "hover:bg-amber-50/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />

                  {/* Hiển thị trực quan câu thông báo trạng thái */}
                  <span className="text-gray-700 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>The product</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-bold text-amber-700 rounded-md">
                      {item.productName}
                    </span>
                    <span>status has just been updated to</span>

                    <span className="px-2 font-semibold tracking-wide uppercase text-red-700">
                      {statusLabel}
                    </span>

                    {/* 🔔 Biểu tượng chuông động (BellRing) xuất hiện ở phía sau dòng đầu tiên */}
                    {isLatest && (
                      <BellRing className="w-4 h-4 text-red-600 animate-ping inline-block ml-1" />
                    )}
                  </span>
                </div>

                {/* Hiển thị thời gian thực đầy đủ cả Ngày và Giờ */}
                <div
                  className={`flex items-center gap-1 font-medium px-2 py-1 rounded-md shrink-0 ${
                    isLatest
                      ? "bg-white text-amber-900 border-amber-300 shadow-2xs"
                      : "text-gray-500 bg-gray-50 border-gray-100"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {(() => {
                      if (!item.timestamp) return "";
                      const parsedDate = new Date(item.timestamp);
                      return !isNaN(parsedDate.getTime())
                        ? parsedDate.toLocaleString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : item.timestamp;
                    })()}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-gray-400 text-xs italic">
            {loading
              ? "Đang tải dữ liệu log..."
              : "Chưa có hoạt động nào được ghi nhận..."}
          </div>
        )}
      </div>
    </div>
  );
}
