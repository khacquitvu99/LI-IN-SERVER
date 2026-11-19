"use client";

import { motion, Variants } from "framer-motion";

interface CatalogItem {
  id: number;
  title: string;
  category: string;
  image: string;
  gridClass: string;
  type?: "product" | "promo";
}

const catalogData: CatalogItem[] = [
  {
    id: 1,
    title: "BST Nhẫn Kim Cương Solitaire",
    category: "HERO COLLECTION",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800",
    gridClass: "col-span-2 row-span-2 rounded-3xl",
    type: "product",
  },
  {
    id: 2,
    title: "Giày Thể Thao Sneaker",
    category: "Footwear",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600",
    gridClass: "col-span-1 row-span-1 rounded-2xl",
    type: "product",
  },
  {
    id: 3,
    title: "Túi Đựng Cao Cấp",
    category: "Packaging",
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
    gridClass: "col-span-1 row-span-1 rounded-2xl",
    type: "product",
  },
  {
    id: 4,
    title: "Khung Decor Treo Tường",
    category: "Home Decor",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800",
    gridClass: "col-span-2 row-span-1 rounded-2xl",
    type: "product",
  },
  {
    id: 5,
    title: "Đồng Hồ SmartWatch",
    category: "Gadgets",
    image:
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600",
    gridClass: "col-span-1 row-span-2 rounded-2xl",
    type: "product",
  },
  {
    id: 6,
    title: "Giày Đá Bóng Pro",
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&q=80&w=600",
    gridClass:
      "col-span-1 row-span-1 rounded-full aspect-square border-2 border-amber-300 p-1",
    type: "product",
  },
  {
    id: 7,
    title: "Bộ Chăm Sóc SkinCare",
    category: "Beauty",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800",
    gridClass: "col-span-2 row-span-1 rounded-2xl",
    type: "product",
  },
  {
    id: 8,
    title: "Túi Vải Mini Eco",
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    gridClass: "col-span-1 row-span-1 rounded-2xl",
    type: "product",
  },
  {
    id: 9,
    title: "Nến Thơm Thư Giãn",
    category: "Lifestyle",
    image:
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600",
    gridClass: "col-span-1 row-span-1 rounded-2xl",
    type: "product",
  },
  {
    id: 10,
    title: "Kính Mát Thời Trang",
    category: "Eyewear",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600",
    gridClass: "col-span-1 row-span-1 rounded-2xl",
    type: "product",
  },
];

export default function About() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18, // Tăng lên 0.18s để khoảng trễ giữa các ảnh rõ rệt hơn
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 70 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.0, // Tăng lên 1.0s để tốc độ trượt đằm và từ tốn hơn
        ease: [0.25, 0.1, 0.25, 1], // Curve mượt mà kiểu Smooth Ease
      },
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-slate-50/60 rounded-3xl">
      {/* HEADER BỘ SƯU TẬP */}
      <div className="mb-6 flex items-center justify-between border-b border-amber-200/80 pb-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            Bento Grid Layout
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
            Bộ Sưu Tập Lấp Kín 100%
          </h2>
        </div>
      </div>

      {/* CONTAINER GRID TÍCH HỢP ANIMATION */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-40 md:auto-rows-47.5 gap-4 grid-flow-dense"
      >
        {catalogData.map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className={`group relative overflow-hidden bg-white border border-amber-200/70 shadow-sm hover:shadow-xl transition-shadow duration-500 cursor-pointer ${item.gridClass}`}
          >
            {/* Ảnh sản phẩm */}
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Hiệu ứng ánh kim lướt nhẹ khi hover */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-tl from-transparent via-white/20 to-transparent translate-x-full translate-y-full transition-transform duration-1000 ease-in-out group-hover:-translate-x-full group-hover:-translate-y-full" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}