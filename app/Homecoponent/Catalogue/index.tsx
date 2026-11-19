"use client";

interface ImageItem {
  src: string;
  category: string;
  title: string;
}

export default function ListCard() {
  const images: ImageItem[] = [
    {
      src: "/chain1.png",
      category: "Nhẫn",
      title: "Nhẫn Kim Cương Solitaire",
    },
    {
      src: "/catier+bacalet.png",
      category: "Dây Chuyền",
      title: "Dây Chuyền Vàng Ý 18K",
    },
    {
      src: "/ring1.png",
      category: "Vòng Tay",
      title: "Vòng Tay Chế Tác Riêng",
    },
    {
      src: "/earring1.jpg",
      category: "Bông Tai",
      title: "Bông Tai Ngọc Trai",
    },
    {
      src: "/Grills.png",
      category: "Bộ Sưu Tập",
      title: "BST Trang Sức Mùa Cưới",
    },
    {
      src: "/pendant1.png",
      category: "Nhẫn Cưới",
      title: "Cặp Nhẫn Cưới Bạch Kim",
    },
    {
      src: "/glass1.png",
      category: "Đá Quý",
      title: "Mặt Dây Chuyền Sapphire",
    },
    {
      src: "/watch1.png",
      category: "Vòng Tay",
      title: "Vòng Tay Kim Cương Elegance",
    },
    {
      src: "/catier+bacalet.png",
      category: "Phụ Kiện",
      title: "Cài Áo Mạ Vàng Cao Cấp",
    },
    {
      src: "/ring3.png",
      category: "Nhẫn Nam",
      title: "Nhẫn Nam Đá Phong Thủy",
    },
    {
      src: "/watch2.png",
      category: "Đồng Hồ",
      title: "Đồng Hồ Nữ Nạm Kim Cương",
    },
    {
      src: "/chain2.png",
      category: "Quà Tặng",
      title: "Set Quà Tặng Trang Sức",
    },
  ];

  const columns = [
    images.slice(0, 3),
    images.slice(3, 6),
    images.slice(6, 9),
    images.slice(9, 12),
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mt-16 p-4 md:p-6 bg-slate-50/50 rounded-3xl">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
        Categories
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="grid gap-4">
            {col.map((item, imgIndex) => (
              <div
                key={imgIndex}
                className="group relative overflow-hidden rounded-xl border border-amber-200/60 bg-amber-50/20 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-300 cursor-pointer"
              >
                {/* 1. Ảnh sản phẩm */}
                <img
                  className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  src={item.src}
                  alt={item.title}
                />

                {/* 2. Vệt sáng ánh gương */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-tl from-transparent via-white/40 to-transparent translate-x-full translate-y-full transition-transform duration-1000 ease-in-out group-hover:-translate-x-full group-hover:-translate-y-full" />

                {/* 3. Lớp Overlay phủ mờ */}
                <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* 4. Text trượt từ trái sang (Đã tinh chỉnh tốc độ) */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end pointer-events-none">
                  <div
                    /* 
                      ĐIỀU CHỈNH TỐC ĐỘ TRƯỢT Ở ĐÂY:
                      - -translate-x-12: Quãng đường trượt dài hơn (từ xa hơn về)
                      - duration-700: Thời gian trượt (700ms = đằm mượt). Nếu muốn nhanh đổi thành duration-300
                      - delay-100: Chờ 100ms cho nền đen phủ lên trước rồi mới trượt chữ
                    */
                    className="transform -translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700 delay-100 ease-out"
                  >
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-0.5">
                      {item.category}
                    </span>
                    <h3 className="text-sm md:text-base font-semibold text-white drop-shadow-md truncate">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}