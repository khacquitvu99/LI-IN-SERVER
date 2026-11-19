import React, { FormEvent } from "react";

// Cấu trúc dữ liệu cho Khuôn đúc
export interface CastingRow {
  castingid: string;
  employeeName: string;
  time: string;
  receivedWeight: number;
  finishedWeight: number;
  lossWeight: number;
  castingIMG: string;
}

//Cấu trúc dữ liệu cho nhám nguội
export interface SandingRow {
  sandingid: string;
  employeeName: string;
  time: string;
  receivedWeight: number;
  solderWeight: number;
  filingDustWeight: number;
  finishedWeight: number;
  lossWeight: number;
  sandingIMG: string;
}

//Cấu trúc dữ liệu cho Hôt
export interface SettingRow {
  settingid: string;
  employeeName: string;
  time: string;
  revicedWeight: number;
  gemWeight: number;
  finishedWeight: number;
  filingDustWeight: number;
  gemLossWeight: number;
  settingIMG: string;
}

//Cấu trúc dữ liệu cho đánh bong
export interface PolishingRow {
  polishingid: string;
  employeeName: string;
  time: string;
  receivedWeight: number;
  finishWeight: number;
  lossWeight: number;
  gemLoss: number;
  polishingIMG: string;
}

//Cấu trúc dữ liệu cho xi mạ
export interface PlatingRow {
  platingid: number;
  employeeName: string;
  time: string;
  platingIMG: string;
}

// Cấu trúc dữ liệu cho Chất Liệu
export interface MaterialItem {
  materialID: number;
  type: string;
  color: string;
  designWeight: number;
  finishedWeight: number;
}

// Cấu trúc dữ liệu cho Thông Tin Đá
export interface GemItem {
  gemStoneID: number;
  gemType: string;
  shape: string;
  weight: number;
  size: string;
  quantity: number;
  color: string;
}

export interface PrintingProgress {
  printingid: number;
  technician: string;
  completedAt: string;
}

// Cấu trúc dữ liệu cho Tiến độ sản xuất (3D / In CNC)
export interface DsProgressItem {
  id: number;
  designer: string;
  completedAt: string;
  processImage: string;
}

// Cấu trúc dữ liệu cho Thông Tin Kinh Doanh
export interface BusinessRow {
  id: string;
  noOrder: string;
  name: string;
  customName: string;
  dateCreated: string;
  dateFinished: string;
  material: string;
  customMaterial: string;
  gemType: string;
  customGemType: string;
  imageUrls: string[];
}

export interface ProductTab {
  id: string;
  name: string;
}

// Định nghĩa kiểu dữ liệu cho User
export interface UserAcc {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  avatar?: string;
}

// Định nghĩa kiểu dữ liệu cho Auth State
export interface AuthState {
  user: UserAcc | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Interface cho bảng Side Stones
export interface SideStoneItem {
  shape: string;
  type: string;
  qty: number | "";
  cost: number | "";
}

// Interface cho bảng Center Stone
export interface CenterGemItem {
  id: number;
  name: string;
  shape: string;
  type: string;
  size: string;
  cost: number | "";
}
/*Cấu trúc chó bảng giá*/
export interface CostData {
  // Bảng Labor
  design3d: number;
  printing3d: number;
  casting: number;
  sanding: number;
  settinggem: number;
  polishing: number;
  plating: number;
  // Bảng Chi phí SX
  cpsxChung: number;
  cpsxSp: number;
  price: number;
}

// truyen Prop các phuong thức FormExport
export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCode?: string;
  onBeforePrint?: () => void;
  productId?: number | null;
}
/*---- all funtion in FROM ACC--- */
//Form ACCOUNT
export interface AccountFormData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: string;
}
/*prop ACC*/
export interface AccountFormModalProps {
  isOpen: boolean;
  editingAccount: UserAcc | null;
  formData: AccountFormData;
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  fetchAccounts?: () => void;
}
/* Modal xac nhan xoa tai khoan*/
export interface DeleteConfirmModalProps {
  isOpen: boolean;
  deletingAccount: UserAcc | null;
  onClose: () => void;
  onConfirm: () => void;
}
/*------------------///-------------------*/
/* Cấu trúc từng Product cho đơn hàng*/
export interface OrderProductTab {
  id: string;
  productName: string;
  noOrder: string;
  dateCreated: string;
  dateFinished: string;
  category: string;
  customCategory: string;
  material: string;
  customMaterial: string;
  gemType: string;
  customGemType: string;
  imageUrls: string[];
  feedback: string;
}

export interface ProductState {
  selectedProduct: any | null; // Lưu toàn bộ thông tin sản phẩm đang chọn
  selectedProductId: number | null; // Hoặc chỉ lưu ID

  // Các hành động (Actions) để thay đổi state
  setSelectedProduct: (product: any) => void;
  clearSelectedProduct: () => void;
}
export interface Product {
  productID?: number | string;
  id?: number | string;
  sideStones?: SideStoneItem[];
  centerStones?: CenterGemItem[];
  [key: string]: any; // other fields your API returns
}

//Cau truc cho GrillzStyle
export type GrillzStyleItem = {
  grillzID?: number; // Có thể để optional khi thêm mới chưa có ID
  quantity: number;
  styleName: string;
};

// Định nghĩa kiểu dữ liệu cho từng dòng thông báo
export interface NotificationItem {
  id: string | number;
  productName: string;
  statusText: string;
  timestamp: string;
}
// Định nghĩa kiểu dữ liệu cho PICTURE FRAME COMPONENT
export interface PictureFrameProps {
  isGrill?: boolean;
  productOriginalImages?: string[];
  productProcessImages?: string[];
  grillzProcessImages?: string[];
  productImagePreviews?: string[];
  selectedPreviewImage?: string | null;
  setSelectedPreviewImage?: (image: string | null) => void;
  setSelectedFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  setProductImagePreviews?: React.Dispatch<React.SetStateAction<string[]>>;
}
