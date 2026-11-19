import { create } from "zustand";
import { ProductState, Product } from "@/types";

export const useProductStore = create<ProductState>((set) => ({
  selectedProduct: null,
  selectedProductId: null,

  // Hàm cập nhật sản phẩm khi người dùng click
  setSelectedProduct: (product) =>
    set({
      selectedProduct: product,
      selectedProductId: product?.ProductID || null,
    }),

  // Hàm xoá/reset lựa chọn nếu cần
  clearSelectedProduct: () =>
    set({
      selectedProduct: null,
      selectedProductId: null,
    }),
}));


// store/zustandStore.ts
interface DesignState {
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  updateSelectedProduct: (patch: Partial<Product>) => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  selectedProduct: null,
  setSelectedProduct: (p) => set({ selectedProduct: p }),

  // merges into the CURRENT state, never a stale copy
  updateSelectedProduct: (patch) =>
    set((state) => ({
      selectedProduct: { ...(state.selectedProduct ?? {}), ...patch } as Product,
    })),
}));
