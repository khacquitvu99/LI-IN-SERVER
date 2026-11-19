import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserAcc, AuthState } from "@/types";

// Giá trị khởi tạo
export const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 1. Bắt đầu quá trình đăng nhập/xử lý
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // 2. Đăng nhập thành công (Lưu user & token)
    loginSuccess: (
      state,
      action: PayloadAction<{ user: UserAcc; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    // 3. Đăng nhập thất bại (Lưu thông báo lỗi)
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },

    // 4. Cập nhật thông tin user (ví dụ: đổi tên, cập nhật avatar)
    updateUser: (state, action: PayloadAction<Partial<UserAcc>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // 5. Đăng xuất (Xóa sạch thông tin auth)
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// Export các actions để gọi dispatch trong components
export const { setLoading, loginSuccess, loginFailure, updateUser, logout } =
  authSlice.actions;

// Export reducer để gắn vào store.ts
export default authSlice.reducer;
