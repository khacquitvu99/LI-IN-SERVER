"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { UserAcc, AccountFormData } from "@/types";
import MenuLeft from "@/components/menuleft";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { AccountFormModal, DeleteConfirmModal } from "@/account/modal";

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState<UserAcc[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswordMap, setShowPasswordMap] = useState<{
    [key: string]: boolean;
  }>({});

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAcc | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<UserAcc | null>(null);

  // State lưu file ảnh khi người dùng chọn tải lên
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<AccountFormData>({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "",
    avatar: "",
  });

  // 1. LOAD DANH SÁCH TÀI KHOẢN (GET API)
  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/users");
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Map từ PascalCase (SQL: UserID, Name, Email,...) sang camelCase (UI)
        const mappedData = result.data.map((item: any) => ({
          id: item.userID,
          avatar: item.avatar,
          name: item.name,
          email: item.email,
          password: item.password,
          role: item.role,
        }));
        setAccounts(mappedData);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error("Error loading the list!", error);
      setAccounts([]);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  //Modal Add
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setSelectedFile(null);
    setFormData({
      id: "",
      name: "",
      email: "",
      password: "",
      role: "Counting",
      avatar: "",
    });
    setIsFormModalOpen(true);
  };
  //Modal Edit
  const handleOpenEditModal = (account: UserAcc) => {
    setEditingAccount(account);
    setSelectedFile(null);
    setFormData({
      id: account.id,
      name: account.name,
      email: account.email,
      password: account.password || "",
      role: account.role || "",
      avatar: account.avatar || "",
    });
    setIsFormModalOpen(true);
  };
  //Modal Delete
  const handleOpenDeleteModal = (account: UserAcc) => {
    setDeletingAccount(account);
    setIsDeleteModalOpen(true);
  };

  // 2. XỬ LÝ THÊM HOẶC CẬP NHẬT TÀI KHOẢN (GOM CHUNG POST & PUT)
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      let avatarUrl = formData.avatar;

      // Nếu người dùng chọn file ảnh mới, upload lên thư mục public/uploads trước
      if (selectedFile) {
        const uploadDataForm = new FormData();
        uploadDataForm.append("file", selectedFile);

        const uploadRes = await fetch("/api/uploadImage", {
          method: "POST",
          body: uploadDataForm,
        });
        const uploadResult = await uploadRes.json();

        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
        } else {
          alert("Error upload image!!: " + uploadResult.error);
          return;
        }
      }

      // Chuẩn bị payload đồng bộ với cột trong SQL (PascalCase)
      const payload = {
        Name: formData.name,
        Email: formData.email,
        Password: formData.password,
        Role: formData.role || "User",
        Avatar:
          avatarUrl ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      };

      // Tự động phân chia URL và Method dựa vào việc đang Sửa hay Thêm mới
      const url = editingAccount
        ? `/api/User/${editingAccount.id}`
        : "/api/User";
      const method = editingAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Error: " + result.message);
        return;
      }

      alert(editingAccount ? "Update Successfully" : "Add New Successfully!");
      setIsFormModalOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("Error connecting to the data-saving API!!", error);
      alert("Unable to connect to the server to save data.!");
    }
  };

  // 3. XỬ LÝ XÓA TÀI KHOẢN TRÊN SQL SERVER
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;

    try {
      const response = await fetch(`/api/User/${deletingAccount.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        alert("Delete acc successfully!!");
        fetchAccounts();
      } else {
        alert("Error delete: " + result.message);
      }
    } catch (error) {
      console.error("Error delete acc:", error);
      alert("Disconnect to server to delete!");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingAccount(null);
    }
  };

  //4. loc-tim kiêm
  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(acc.id).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isLoaded)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading accounts from SQL Server...
      </div>
    );

  return (
    <div className="min-h-screen w-7xl mx-auto bg-slate-50/50 p-4 md:p-8 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-amber-500 rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-amber-950 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Account Management
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Manage all user accounts from SQL Server database
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-amber-200/60 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-amber-200 rounded-xl bg-amber-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-gray-900 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60">
          Total: <span className="font-bold">{filteredAccounts.length}</span>
        </div>
      </div>

      {/* TABLE DANH SÁCH TÀI KHOẢN */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-100/60 text-amber-950 text-xs font-bold uppercase tracking-wider border-b border-amber-200">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Avatar</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Password</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/80 text-xs text-gray-800">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account, index) => (
                  <tr
                    key={`${account.id}-${index}`}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">
                      {account.id}
                    </td>
                    <td className="py-3 px-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(() => {
                          const avatarPath = account.avatar;
                          if (!avatarPath || avatarPath.startsWith("blob:")) {
                            return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
                          }
                          return avatarPath.startsWith("/")
                            ? avatarPath
                            : `/${avatarPath}`;
                        })()}
                        alt={account.name}
                        className="w-9 h-9 rounded-full object-cover border border-amber-300 shadow-2xs"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {account.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {account.email}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {showPasswordMap[account.id]
                            ? account.password || ""
                            : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(account.id)}
                          className="text-gray-400 hover:text-amber-600 cursor-pointer p-0.5"
                        >
                          {showPasswordMap[account.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {account.role}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(account)}
                          className="p-1.5 bg-amber-100/80 text-amber-800 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(account)}
                          className="p-1.5 bg-red-100/80 text-red-700 hover:bg-red-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-gray-400 font-medium"
                  >
                    No accounts found!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GO BACK HOME */}
      <div className="bg-amber-50 max-w-7xl w-full text-amber-600 mx-auto rounded-2xl p-4 shadow-sm border border-amber-200/80">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-semibold text-sm hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go back Home</span>
        </Link>
      </div>

      <AccountFormModal
        isOpen={isFormModalOpen}
        editingAccount={editingAccount}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        fetchAccounts={fetchAccounts}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        deletingAccount={deletingAccount}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <div className="ml-64">
        <MenuLeft />
      </div>
    </div>
  );
}
