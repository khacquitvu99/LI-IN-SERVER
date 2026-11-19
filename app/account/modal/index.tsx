"use client";

import { AccountFormModalProps, DeleteConfirmModalProps } from "@/types";
import { X, Check, ShieldAlert, Upload, ChevronDown } from "lucide-react";
import { useState } from "react";

// ==================== 1. MODAL THÊM / SỬA TÀI KHOẢN ====================
export function AccountFormModal({
  isOpen,
  editingAccount,
  formData,
  setFormData,
  onClose,
  fetchAccounts,
}: AccountFormModalProps) {
  // Nếu modal không bật (isOpen = false) thì không hiển thị gì cả
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalAvatarUrl = formData.avatar;

    // 1. NẾU CÓ CHỌN FILE MỚI -> GỌI API UPLOAD LÊN SERVER TRƯỚC
    if (selectedFile) {
      const uploadDataForm = new FormData();
      uploadDataForm.append("file", selectedFile);
      uploadDataForm.append("folder", "uploads");

      try {
        const uploadRes = await fetch("/api/uploadImage", {
          method: "POST",
          body: uploadDataForm,
        });

        const uploadResult = await uploadRes.json();

        if (uploadResult.success) {
          finalAvatarUrl = uploadResult.url;
        } else {
          alert("Upload Image Failed!! " + uploadResult.error);
          return;
        }
      } catch (err) {
        console.error("Error connect!!", err);
        return;
      }
    }

    // 2. PHÂN BIỆT CHẾ ĐỘ: THÊM MỚI HOẶC CẬP NHẬT
    const isEdit = Boolean(editingAccount && (editingAccount as any).id);
    
    const payload = {
      ...(editingAccount ? editingAccount : {}),
      ...formData,
      avatar: finalAvatarUrl,
    };

    // 3. GỌI API LƯU VÀO CƠ SỞ DỮ LIỆU
    try {
      const response = await fetch("/api/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        alert(isEdit ? "Update succesfully!" : "Add new succesfully!");
        onClose();

        
        // Gọi hàm load lại danh sách tài khoản ngay tại đây
        if (fetchAccounts) {
          fetchAccounts();
        }
      } else {
        alert("Failed to Save to Database!: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    }
  };

  // Xử lý khi người dùng chọn file ảnh từ máy tính làm avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Lưu file gốc lại để lát nữa gọi API upload

      // Tạo đường dẫn tạm thời để preview mượt mà ngay lập tức
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: previewUrl }));
    }
  };

  // Xử lý khi người dùng muốn xóa bỏ ảnh đại diện
  const handleRemoveAvatar = () => {
    setSelectedFile(null); // Xóa file đang chờ upload
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  return (
    // Lớp phủ nền tối mờ phía sau (backdrop)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      {/* Khung chứa Modal */}
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 w-full max-w-md overflow-hidden">
        {/* Phần Header của Modal: Tiêu đề và nút đóng (X) */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50/80 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-amber-600 rounded-full" />
            <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
              {editingAccount ? "Edit Account" : "Add New Account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-gray-400 hover:text-amber-950 hover:bg-amber-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phần Thân Form */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
          {/* Ô nhập Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="enter"
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium text-gray-900"
            />
          </div>

          {/* Ô nhập Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="name@amber.com"
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium text-gray-900"
            />
          </div>

          {/* Ô nhập Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">
              Password
            </label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter password..."
              className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono text-gray-900"
            />
          </div>

          {/* Ô chọn Role */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">
              Role
            </label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium text-gray-900 appearance-none cursor-pointer pr-8 transition-all"
              >
                <option value="Admin">Admin</option>
                <option value="Counting">Counting</option>
                <option value="Design">Design</option>
                <option value="Casting">Casting</option>
                <option value="Sanding">Sanding</option>
                <option value="Setting">Setting</option>
                <option value="Polishing">Polishing</option>
                <option value="Plating">Plating</option>
                <option value="Customer">Customer</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Khu vực xử lý Avatar */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase">
              Avatar
            </label>

            {formData.avatar ? (
              <div className="relative w-20 h-20 mx-auto my-2 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.avatar}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                  title="Xóa ảnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/20 hover:bg-amber-50/50 hover:border-amber-400 transition-all cursor-pointer group">
                <div className="flex flex-col items-center justify-center py-2 text-amber-800">
                  <Upload className="w-5 h-5 mb-1 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">
                    Tải ảnh đại diện lên
                  </span>
                  <span className="text-[10px] text-gray-400">
                    PNG, JPG, WEBP (Tối đa 5MB)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Khu vực các nút hành động cuối form */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== 2. MODAL XÁC NHẬN XÓA TÀI KHOẢN ====================
export function DeleteConfirmModal({
  isOpen,
  deletingAccount,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !deletingAccount) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900">
            Confirm Delete Account
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            You are about to delete the account{" "}
            <span className="font-bold text-gray-800">
              {deletingAccount.name}
            </span>{" "}
            ({deletingAccount.id}). This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}