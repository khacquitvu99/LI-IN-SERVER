import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "@/service/acc/authslice";

export const store = configureStore({
  reducer: {
    // Thêm các reducer khác tại đây
    auth: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
