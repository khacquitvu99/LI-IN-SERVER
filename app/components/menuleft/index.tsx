"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useState } from "react";
import {
  LayoutDashboard,
  FlaskConical,
  Layers,
  Cpu,
  BrushCleaning,
  Sparkles,
  LogOut,
  PencilSparkles,
  GemIcon,
  Menu,
  Printer3d,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role;

  // State quản lý ẩn/hiện sidebar
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* NÚT MỞ SIDEBAR (Hiển thị khi sidebar đang bị ẩn) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-50 p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/30 hover:bg-amber-600 transition-all cursor-pointer"
          title="Mở Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* SIDEBAR CHÍNH */}
      <aside
        className={`fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-4 pt-6 shadow-sm z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* PHẦN TRÊN: LOGO & MENU ITEMS */}
        <div className="space-y-6">
          {/* LOGO / BRAND & NÚT ĐÓNG */}
          <div className="flex items-center justify-between px-2 py-2.5 border-b-2 border-amber-400/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Li-In Jewelry
                </h1>
                <p className="text-[11px] text-amber-600 font-semibold">
                  {userRole || "Guest"}
                </p>
              </div>
            </div>

            {/* Nút đóng sidebar */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
              title="Thu gọn Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DANH SÁCH MENU (MENU LIST) */}
          <nav className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Department List
            </p>

            {/* Counting */}
            <Link
              href="/counting"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/counting")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Counting</span>
            </Link>

            {/* Design */}
            <Link
              href="/design3D"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/design3D")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <PencilSparkles className="w-4 h-4" />
              <span>Design</span>
            </Link>

            {/* Printing */}
            <Link
              href="/printing"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/printing")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <Printer3d className="w-4 h-4" />
              <span>Printing 3D</span>
            </Link>

            {/* CNC/R&D */}
            <Link
              href="/CNC"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/CNC")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <Printer3d className="w-4 h-4" />
              <span>CNC/R&D</span>
            </Link>

            {/* Casting */}
            <Link
              href="/casting"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/casting")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Casting</span>
            </Link>

            {/* Sanding */}
            <Link
              href="/sanding"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/sanding")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <BrushCleaning className="w-4 h-4" />
              <span>Sanding</span>
            </Link>

            {/* Setting */}
            <Link
              href={"/settinggem"}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/setting")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <GemIcon className="w-4 h-4" />
              <span>Setting</span>
            </Link>

            {/* Polishing */}
            <Link
              href="/polishing"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/polishing")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Polishing</span>
            </Link>

            {/* Plating */}
            <Link
              href="/plating"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith("/plating")
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Plating</span>
            </Link>

            {/* CHỈ ADMIN MỚI THẤY KHU VỰC DASHBOARD QUẢN TRỊ */}
            {userRole === "Admin" && (
              <>
                <div className="pt-2 pb-1">
                  <hr className="border-gray-100" />
                </div>
                <Link
                  href="/admin"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                      : "text-gray-600 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* PHẦN DƯỚI: THÔNG TIN USER & ĐĂNG XUẤT */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="px-3 py-2 bg-gray-50 rounded-xl">
            <p className="text-[11px] font-bold text-gray-800 truncate">
              {user?.name || "Tài khoản"}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {user?.email || "Chưa đăng nhập"}
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("acc_current_user");
              localStorage.removeItem("amber_current_user");
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
