"use client";

import { useState, useEffect } from "react";

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
}

const slideData: SlideItem[] = [
  {
    id: 1,
    title: "Trang Sức Vàng 18K Khảm Kim Cương",
    subtitle: "Bộ sưu tập Chế tác Thủ công Xu hướng 2026",
    tag: "BST Mới",
    image: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image.jpg",
  },
  {
    id: 2,
    title: "Nhẫn Đá Gemstone Tinh Xảo",
    subtitle: "Định hình phong cách quý phái & hiện đại",
    tag: "Nổi Bật",
    image: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-3.jpg",
  },
  {
    id: 3,
    title: "Thiết Kế Chế Tác Theo Yêu Cầu",
    subtitle: "Công nghệ dựng 3D sắc nét từng chi tiết",
    tag: "Dịch Vụ VIP",
    image: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-6.jpg",
  },
];

export default function TrendSlider() {
  const [current, setCurrent] = useState(0);

  // Tự động chuyển slide sau mỗi 5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slideData.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slideData.length) % slideData.length);

  return (
    <div className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-2xl border border-amber-200/80 shadow-md bg-white mt-30">
      {/* KHUNG SLIDE BÊN TRONG */}
      <div
        className="flex transition-transform duration-700 ease-out h-90 md:h-105"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slideData.map((slide) => (
          <div key={slide.id} className="min-w-full relative h-full shrink-0">
            {/* Ảnh Background với hiệu ứng Zoom nhẹ */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay Gradient làm nổi bật chữ */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

            {/* Nội dung Card Glassmorphism bên dưới góc trái */}
            <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-lg p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-lg space-y-2">
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-amber-400 text-amber-950 rounded-full">
                {slide.tag}
              </span>
              <h3 className="text-xl md:text-2xl font-bold tracking-wide">
                {slide.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-200">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* NÚT ĐIỀU HƯỚNG SANG TRÁI / PHẢI */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-amber-400 text-gray-800 hover:text-amber-950 shadow-md transition-all active:scale-95 cursor-pointer"
        aria-label="Previous Slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-amber-400 text-gray-800 hover:text-amber-950 shadow-md transition-all active:scale-95 cursor-pointer"
        aria-label="Next Slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* CHỈ SỐ PHÂN TRANG DẠNG THANH TIẾN TRÌNH (PROGRESS BARS) */}
      <div className="absolute top-4 right-6 flex items-center space-x-2 z-10">
        {slideData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              current === index ? "w-8 bg-amber-400" : "w-3 bg-white/50 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}