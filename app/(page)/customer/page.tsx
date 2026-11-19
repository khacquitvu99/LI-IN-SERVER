import NavPage from "@/components/navigation";
import Fillter from "@/components/fillter";
import OrderList from "@/components/order-list";
import MenuLeft from "@/components/menuleft";

export default function Customer() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans pb-16">
      {/* Thanh điều hướng */}
      <NavPage />

      <main className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* THANH BỘ LỌC TÌM KIẾM */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
          <Fillter />
        </section>

        {/* LAYOUT 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: DANH SÁCH ĐƠN HÀNG */}
          <div className="lg:col-span-4">
            <OrderList />
          </div>

          {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
          <div className="lg:col-span-8 space-y-6">
            {/* KHỐI 1: GIÁ SẢN XUẤT VÀ TỈ LỆ % */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-amber-200 pb-3">
                <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                  Thông tin giá sản xuất
                </h2>
              </div>

              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Giá xuất xưởng
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập giá sản xuất..."
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Tỉ lệ phần trăm
                  </label>
                  <div className="flex gap-2">
                    <select
                   
                      defaultValue="30"
                      className="px-3 py-2 text-sm w-20 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                    >
                      <option value="30">30%</option>
                      <option value="20">20%</option>
                      <option value="15">15%</option>
                      <option value="10">10%</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Phần trăm giá bán..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* KHỐI 2: TRẠNG THÁI SẢN PHẨM & TIẾN ĐỘ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center space-x-2 border-b border-amber-200 pb-3">
                <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                  Trạng thái & Tiến độ sản xuất
                </h2>
              </div>

              <div className="gap-6 items-center">
                {/* Hình ảnh xem trước */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <img
                    src="/LOGO-LIIN.jpg"
                    alt="Sản phẩm"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thông tin công đoạn & Thời gian */}
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <h2 className="text-base font-semibold text-amber-900">
                      Sản phẩm đang ở công đoạn:{" "}
                      <span className="font-bold text-amber-600">...</span>
                    </h2>
                  </div>

                  <form className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Thời gian hoàn thành
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all"
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <MenuLeft/>
      </main>
    </div>
  );
}
