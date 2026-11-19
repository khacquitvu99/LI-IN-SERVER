"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { loginSuccess } from "@/service/acc/authslice";
import { UserAcc } from "@/types";

// Các đường dẫn công khai hoàn toàn (không cần đăng nhập)
const PUBLIC_ROUTES = ["/", "/login"];

// Hàm helper xác định trang mặc định dựa theo Role
const getDefaultRouteByRole = (role?: string) => {
  switch (role) {
    case "Admin":
      return "/";
    case "Counting":
      return "/counting";
    case "Manager":
      return "/manager";
    case "Customer":
      return "/customer";
    case "Design3D":
      return "/design3D";
    case "Casting":
      return "/casting";
    case "Sanding":
      return "/sanding";
    case "Setting":
      return "/settinggem";
    case "Polishing":
      return "/polishing";
    case "Plating":
      return "/plating";
    default:
      return "/";
  }
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Phục hồi session từ localStorage nếu Redux chưa có
    const savedUserStr = localStorage.getItem("acc_current_user");
    let loggedIn = isAuthenticated;
    let currentUser: UserAcc | null = user;

    if (!loggedIn && savedUserStr) {
      try {
        const parsedData = JSON.parse(savedUserStr);
        currentUser = parsedData as UserAcc;
        dispatch(
          loginSuccess({
            user: currentUser,
            token: `acc_token_${currentUser.id}`,
          }),
        );
        loggedIn = true;
      } catch {
        localStorage.removeItem("acc_current_user");
      }
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const userRole = currentUser?.role;
    const defaultRoleRoute = getDefaultRouteByRole(userRole);

    // 2. CHƯA ĐĂNG NHẬP
    if (!loggedIn) {
      if (!isPublic) {
        // Cố vào trang bảo mật khi chưa đăng nhập -> Đẩy về "/"
        setIsAuthorized(false);
        router.replace("/");
      } else {
        // Vào trang công khai như "/" hoặc "/login" -> Cho phép
        setIsAuthorized(true);
      }
      return;
    }

    // 3. ĐÃ ĐĂNG NHẬP
    // Trường hợp 3.1: Đã đăng nhập mà cố tình vào lại trang "/login" -> Đẩy về trang mặc định của Role
    if (pathname === "/login") {
      setIsAuthorized(false);
      router.replace(defaultRoleRoute);
      return;
    }

    if (userRole === "Admin") {
      if (pathname === "/login") {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
      return;
    }
    // Trường hợp 3.2: Kiểm tra phân quyền truy cập chéo giữa các Role (Role-based Authorization)
    // Ví dụ: Role là Counting nhưng cố vào các đường dẫn bắt đầu bằng /admin hoặc /manager
    if (
      userRole === "Counting" &&
      !pathname.startsWith("/counting") &&
      !pathname.startsWith("/order") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/counting");
      return;
    }
    /////////////////////////////////
    if (
      userRole === "Customer" &&
      !pathname.startsWith("/customer") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/customer");
      return;
    }
    /////////////////////////////////
    if (
      userRole === "Casting" &&
      !pathname.startsWith("/casting") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/casting");
      return;
    }
    /////////////////////////////////
    if (
      userRole === "Sanding" &&
      !pathname.startsWith("/sanding") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/sanding");
      return;
    }
    /////////////////////////////////
    if (
      userRole === "Seting" &&
      !pathname.startsWith("/setinggem") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/setinggem");
      return;
    }
    /////////////////////////////////
    if (
      userRole === "Polishing" &&
      !pathname.startsWith("/polishing") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/polishing");
      return;
    }
    /////////////////////////////////
    if (
      userRole === "Plating" &&
      !pathname.startsWith("/plating") &&
      pathname !== "/"
    ) {
      setIsAuthorized(false);
      router.replace("/plating");
      return;
    }

    // Các đường dẫn hợp lệ khác của user
    setIsAuthorized(true);
  }, [pathname, isAuthenticated, user, dispatch, router]);

  // Màn hình chờ kiểm tra phân quyền tránh chớp nháy giao diện
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  if (isAuthorized === null || (!isAuthorized && !isPublic)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
