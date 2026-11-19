"use client";

import Nav from "@/components/navigation";
import CreateOrder from "@/CountingComponent/create-order";
import MenuLeft from "@/components/menuleft";

export default function BusinessPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mt-16">
      <Nav />
      <CreateOrder />
      <MenuLeft/>

    </div>
  );
}
