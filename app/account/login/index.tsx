"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAcc } from "@/types";
import {
  User,
  Lock,
  LogIn,
  ArrowLeft,
  Loader2,
  AlertCircle,
  EyeOff,
  Eye,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setLoading, loginSuccess, loginFailure } from "@/service/acc/authslice";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));

    try {
      // Gọi API xác thực trực tiếp từ SQL Server
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        const matchedUser = result.user;

        // 1. Lưu thông tin đăng nhập vào Redux Store
        dispatch(
          loginSuccess({
            user: matchedUser,
            token: `acc_token_${matchedUser.id}_${Date.now()}`,
          }),
        );

        // 2. Lưu phiên vào LocalStorage để AuthGuard nhận diện
        localStorage.setItem("acc_current_user", JSON.stringify(matchedUser));

        // Sau khi state thay đổi, AuthGuard sẽ tự động quét thấy và điều hướng chuẩn xác theo Role.
        router.refresh();
      } else {
        dispatch(
          loginFailure(result.message || "Invalid username/email or password!"),
        );
      }
    } catch (err) {
      console.error("Login error!!", err);
      dispatch(
        loginFailure("A system error occurred. Please try again later!"),
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xs border border-gray-200/80 p-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col items-center justify-center space-y-2 border-b border-amber-200/60 pb-4">
          <div className="flex items-center justify-center gap-2.5 w-full">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full shrink-0" />
            <h1 className="text-lg md:text-xl font-bold text-gray-900 uppercase tracking-tight whitespace-nowrap">
              Login to System
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Manage jewelry manufacturing & production
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Username</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 focus:outline-none transition-all placeholder:text-gray-400 font-medium text-gray-900"
                required
                disabled={isLoading}
              />

              {/* Nút bấm ẩn/hiện mật khẩu đặt ở góc phải */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">

            {/* Link tro ve trang chủ */}
            <Link
              href="/"
              title="Trở về trang chủ"
              className="p-2.5 px-6 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/80 rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-center group shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-amber-600 group-hover:-translate-x-0.5 transition-transform" />
            </Link>

            {/* button Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
