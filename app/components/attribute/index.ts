// Định nghĩa kiểu dữ liệu chuẩn cho Dropdown Option
export interface DropdownOption {
  id: number | string;
  value: string;
  label: string;
  isActive?: boolean; // Tùy chọn để Admin bật/tắt hiển thị
}

// Chuyển mảng thành dạng Array of Objects
export const MATERIAL_OPTIONS: DropdownOption[] = [
  {
    id: 1,
    value: "Yellow Gold 24K (9999)",
    label: "Yellow Gold 24K (9999)",
    isActive: true,
  },
  {
    id: 2,
    value: "Yellow Gold 18K (750)",
    label: "Yellow Gold 18K (750)",
    isActive: true,
  },
  {
    id: 3,
    value: "Yellow Gold 14K (585)",
    label: "Yellow Gold 14K (585)",
    isActive: true,
  },
  { id: 4, value: "White Gold 18K", label: "White Gold 18K", isActive: true },
  { id: 5, value: "Rose Gold 18K", label: "Rose Gold 18K", isActive: true },
  { id: 6, value: "Platinum", label: "Platinum", isActive: true },
  { id: 7, value: "Silver (925)", label: "Silver (925)", isActive: true },
];

export const MATERIAL_COLOR_OPTIONS: DropdownOption[] = [
  { id: 1, value: "White", label: "White", isActive: true },
  { id: 2, value: "Yellow Gold", label: "Yellow Gold", isActive: true },
  { id: 3, value: "Rose Gold", label: "Rose Gold", isActive: true },
];

export const GEM_TYPE_OPTIONS: DropdownOption[] = [
  { id: 1, value: "Diamond (SI)", label: "Diamond (SI)", isActive: true },
  { id: 2, value: "Diamond (VS)", label: "Diamond (VS)", isActive: true },
  { id: 3, value: "Diamond (VVS)", label: "Diamond (VVS)", isActive: true },
  { id: 4, value: "CVD <= 1.2mm", label: "CVD <= 1.2mm", isActive: true },
  { id: 5, value: "CVD > 1.2mm", label: "CVD > 1.2mm", isActive: true },
  { id: 6, value: "Moissanite", label: "Moissanite", isActive: true },
  { id: 7, value: "CZ", label: "CZ", isActive: true },
];

export const SHAPE_OPTIONS: DropdownOption[] = [
  { id: 1, value: "Round", label: "Round", isActive: true },
  { id: 2, value: "Baguette", label: "Baguette", isActive: true },
  { id: 3, value: "Fancy", label: "Fancy", isActive: true },
  { id: 4, value: "Color", label: "Color", isActive: true },
  { id: 5, value: "Marquise", label: "Marquise", isActive: true },
  { id: 6, value: "Pear", label: "Pear", isActive: true },
  { id: 7, value: "Oval", label: "Oval", isActive: true },
  { id: 8, value: "Heart", label: "Heart", isActive: true },
  { id: 9, value: "Princess", label: "Princess", isActive: true },
];

export const CUSTOMER_CODE: DropdownOption[] = [
  { id: 0, value: "All", label: "ALL", isActive: true },
  { id: 1, value: "ICE", label: "ICE", isActive: true },
  { id: 2, value: "BEA", label: "BEA", isActive: true },
  { id: 3, value: "GOG", label: "GOG", isActive: true },
  { id: 5, value: "MI", label: "MI", isActive: true },
  { id: 6, value: "LUX", label: "LUX", isActive: true },
];

export const STATUS_OPTIONS: DropdownOption[] = [
  { id: 0, value: "1", label: "New Order", isActive: true },
  { id: 1, value: "2", label: "Pending Quotation", isActive: true },
  { id: 2, value: "3", label: "Pending 3DExport", isActive: true },
  { id: 3, value: "4", label: "Pending Printing", isActive: true },
  { id: 4, value: "5", label: "Pending Casting", isActive: true },
  { id: 5, value: "6", label: "Pending Sanding", isActive: true },
  { id: 6, value: "7", label: "Pending SettingGem", isActive: true },
  { id: 7, value: "8", label: "Pending Polishing", isActive: true },
  { id: 8, value: "9", label: "Pending Plating", isActive: true },
  { id: 9, value: "10", label: "Completed", isActive: true },
  
];

export const getStatusLabel = (
  status: number | string | undefined | null,
): string => {
  if (!status) return "In Progress";
  const found = STATUS_OPTIONS.find((item) => item.value === String(status));
  return found ? found.label : `Status (${status})`;
};
