"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LoaderPinwheel,
  MousePointerClick,
  Search,
  ArrowBigRightDash,
} from "lucide-react";
import { CUSTOMER_CODE } from "@/components/attribute";

interface FillterProps {
  disabled?: boolean;
}

export default function Fillter({ disabled = false }: FillterProps) {
  const [selectedCustomer, setSelectedCustomer] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // DIV1: Xử lý thay đổi Customer Code
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCustomer(value);

    // Phát sự kiện cho DIV1
    const event = new CustomEvent("customerChanged", { detail: value });
    window.dispatchEvent(event);
  };

  // DIV2: Xử lý tìm kiếm độc lập theo Product Code hoặc Product Name
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Phát sự kiện cho DIV2
    const event = new CustomEvent("productSearchChanged", { detail: value });
    window.dispatchEvent(event);
  };

  return (
    <section className="bg-white p-4 rounded-xl shadow-lg border border-amber-200/80 flex flex-wrap items-center justify-between gap-4">
      {/* DIV1: Customer Code Filter */}
      <div className="flex items-center space-x-3">
        <MousePointerClick className="h-6 w-6 text-lg font-bold text-amber-600" />
        <label
          htmlFor="customer-code"
          className="text-lg font-bold text-amber-600"
        >
          Customer Code:
        </label>
        <select
          id="customer-code"
          value={selectedCustomer}
          onChange={handleCustomerChange}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-amber-50/50 border border-amber-300 text-gray-800 font-medium rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
        >
          {CUSTOMER_CODE.filter((item) => item.isActive).map((cust) => (
            <option key={cust.id} value={cust.value}>
              {cust.label}
            </option>
          ))}
        </select>
      </div>

      {/* DIV2: Search by Product Code and Product Name */}
      <div className="flex items-center relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-amber-500 absolute left-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={disabled}
          placeholder="Search by Product Name..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-amber-50/50 border border-amber-300 text-gray-800 font-medium rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
        />
      </div>

      {/* DIV3: Link to page product-progress */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
          <LoaderPinwheel className="w-5 h-5 animate-spin" />
        </div>
        <div>
          <Link
            href="/product-progress"
            className="text-base font-bold text-gray-700 hover:text-amber-600 hover:underline transition-all inline-block"
          >
            Processing{" "}
            <ArrowBigRightDash className="w-5 h-5 inline-block ml-1 animate-pulse text-amber-700" />
          </Link>
        </div>
      </div>
    </section>
  );
}
