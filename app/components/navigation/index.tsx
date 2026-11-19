"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { loginSuccess, logout } from "@/service/acc/authslice";
import { LogOut, ChevronDown, Settings } from "lucide-react";

export default function NavPage() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. TỰ ĐỘNG KHÔI PHỤC PHIÊN ĐĂNG NHẬP TỪ LOCALSTORAGE KHI LOAD TRANG
  useEffect(() => {
    if (!isAuthenticated) {
      const savedUser = localStorage.getItem("amber_current_user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          dispatch(
            loginSuccess({
              user: parsedUser,
              token: `amber_token_${parsedUser.id}`,
            }),
          );
        } catch (error) {
          console.error("Failed to parse saved user:", error);
          localStorage.removeItem("amber_current_user");
        }
      }
    }
  }, [dispatch, isAuthenticated]);

  // 2. TỰ ĐỘNG ĐÓNG DROPDOWN KHI CLICK RA NGOÀI
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. XỬ LÝ LOGOUT
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("acc_current_user");
    setIsMenuOpen(false);
    router.push("/");
  };

  const isCustomerPage = pathname === "/customer";
  const isHomePage = pathname === "/";
  const isAccountingPage = pathname === "/counting";
  const isOrderPage = pathname === "/order";
  const isDesignPage = pathname === "/design3D";
  const isPrintingPage = pathname === "/printing";
  const isCNC = pathname === "/CNC";
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b-2 border-amber-400/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 relative flex items-center justify-between gap-2">
        {/* Góc trái: Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 z-10 shrink-0">
          <Link href="/">
            <img
              src="/LOGO-LIIN.jpg"
              alt="LI-IN JEWELRY"
              className="h-12 sm:h-20 w-auto object-contain mix-blend-multiply contrast-125 cursor-pointer"
            />
          </Link>
        </div>

        {/* Tiêu đề căn giữa */}
        <div className="flex-1 min-w-0 px-1 sm:px-28 flex items-center justify-center pointer-events-none">
          <h1
            className={`text-xs sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight pointer-events-auto uppercase text-center leading-tight line-clamp-2 sm:line-clamp-1 ${
              isHomePage ? "text-amber-500" : "text-gray-800"
            }`}
          >
            {isAccountingPage
              ? "COUNTING DEPARTMENT"
              : isCustomerPage
                ? "ORDER INFORMATION"
                : isHomePage
                  ? "LI-IN JEWELRY"
                  : isOrderPage
                    ? "Order Initialization"
                    : isDesignPage
                      ? "3D Design Management"
                      : isPrintingPage
                        ? "Printing 3D Management"
                        : isCNC
                          ? "CNC/R&D Management"
                          : "ORDER MANAGEMENT"}
          </h1>
        </div>

        {/* Góc phải: Profile hoặc Nút Login */}
        <div className="flex items-center space-x-2 sm:space-x-4 z-10 shrink-0">
          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all cursor-pointer"
              >
                <img
                  src={
                    user.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                  }
                  alt={user.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-amber-400 shadow-xs shrink-0"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-700">
                    {user.role || "Staff"}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 shrink-0" />
              </button>

              {/* Popover Logout */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-amber-200 rounded-xl shadow-lg py-1 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-amber-100 md:hidden">
                    <p className="text-xs font-bold text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-amber-700">{user.role}</p>
                  </div>
                  <div
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </div>
                  {user?.role === "Admin" && (
                    <Link
                      href="/admin"
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium text-amber-950 bg-amber-200 hover:bg-amber-400 rounded-lg shadow-sm hover:shadow transition-all active:scale-95 inline-block text-center whitespace-nowrap"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
