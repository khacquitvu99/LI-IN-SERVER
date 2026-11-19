"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface OrderHeaderProps {
  showNewOrder?: boolean;
}

export default function OrderHeader({ showNewOrder = true }: OrderHeaderProps) {
  const pathname = usePathname();

  // Kiểm tra: Chỉ hiển thị khi showNewOrder = true VÀ đang ở đúng trang /counting
  const shouldRenderButton = showNewOrder && pathname === "/counting";

  if (!shouldRenderButton) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4">
      <Link href="/order">
        <button
          type="button"
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-amber-100 text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span>+</span> New Order
        </button>
      </Link>
    </div>
  );
}
