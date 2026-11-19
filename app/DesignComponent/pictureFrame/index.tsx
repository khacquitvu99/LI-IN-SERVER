import { Package, Upload, X } from "lucide-react";

export default function PictureFrame({
  productOriginalImages = [],
  productProcessImages = [],
  grillzProcessImages = [],
  selectedPreviewImage,
  setSelectedPreviewImage,
  isGrill = false,
  onRemoveExistingImage, // Prop xử lý xóa ảnh cũ đã lưu
  onUploadSuccess, // Prop callback cập nhật state & database ở trang cha
}: any) {
  const currentProcessImages = isGrill
    ? grillzProcessImages
    : productProcessImages;
  const processTitle = isGrill ? "Grill Process Images" : "Processing Images";
  const emptyMessage = isGrill
    ? "No grill images available for this product..."
    : "No process images available for this product...";

  // 🌟 Cách 1: Chọn file là tự động gọi API upload ghi file vật lý ngay lập tức
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]); // Key "file" khớp với backend
      }
      const uploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload file thất bại!");
      }

      // Lấy đường dẫn hoặc tên file server trả về sau khi ghi ổ đĩa thành công
      const newFileUrl =
        uploadData.url ||
        (uploadData.filename ? `/api/images/${uploadData.filename}` : null);

      if (newFileUrl) {
        console.log("✅ Upload file vật lý thành công:", newFileUrl);
        // Bắn callback ra ngoài component cha để cập nhật state & lưu DB
        onUploadSuccess?.(newFileUrl, isGrill);
      }
      
    } catch (error: any) {
      console.error("❌ Lỗi upload:", error);
      alert(`Thất bại: ${error.message}`);
    } finally {
      e.target.value = ""; // Reset input file
    }
  };

  return (
    <div className="space-y-6">
      {/* THẺ 1: Sketch Images (Cố định hiển thị ảnh gốc) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-600" />
          Sketch Images
        </h3>

        <div className="flex flex-wrap gap-3 justify-center">
          {productOriginalImages && productOriginalImages.length > 0 ? (
            productOriginalImages.map((imgName: string, index: number) => {
              const imgSrc = imgName.startsWith("/")
                ? imgName
                : `/uploads/${imgName}`;
              return (
                <div
                  key={index}
                  onClick={() => setSelectedPreviewImage?.(imgSrc)}
                  className="relative w-20 h-20 rounded-lg border border-amber-200 overflow-hidden shadow-2xs group bg-amber-50 cursor-pointer hover:border-amber-500 transition-all"
                  title="Click để xem ảnh lớn"
                >
                  <img
                    src={imgSrc}
                    alt={`Product Original ${index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-400 italic">
              No original images available for this product...
            </p>
          )}
        </div>
      </div>

      {/* THẺ 2: Process Images (Ảnh công đoạn đã lưu) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-600" />
          {processTitle}
        </h3>

        <div className="flex flex-wrap gap-3 justify-center">
          {currentProcessImages && currentProcessImages.length > 0 ? (
            currentProcessImages.map((imgName: string, index: number) => {
              const imgSrc =
                imgName.startsWith("/") || imgName.startsWith("http")
                  ? imgName
                  : `/api/images/${imgName}`;

              return (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-lg border border-amber-200 overflow-hidden shadow-2xs group bg-amber-50"
                >
                  <img
                    src={imgSrc}
                    alt={`Process Image ${index}`}
                    onClick={() => setSelectedPreviewImage?.(imgSrc)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    title="Click để xem ảnh lớn"
                  />
                  {/* Nút Xóa ảnh */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveExistingImage?.(imgName, isGrill);
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                    title="Delete image permanently"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-400 italic">{emptyMessage}</p>
          )}
        </div>
      </div>

      {/* THẺ 3: Upload Process Images (Chọn file là upload thẳng lên server) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
        <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-amber-600" />
          Upload Process Images
        </h3>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs flex items-center gap-2">
            <span>Choose & Upload Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUploadFile} // Gọi trực tiếp hàm upload tự động ngay khi chọn ảnh
            />
          </label>
          <span className="text-xs text-gray-500">
            Select images to upload to server storage immediately.
          </span>
        </div>
      </div>

      {/* 🔍 MODAL XEM ẢNH LỚN & TẢI VỀ */}
      {selectedPreviewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-3 bg-amber-500 text-white">
              <span className="text-sm font-bold">Image Preview</span>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage?.(null)}
                className="p-1 hover:bg-amber-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-gray-900 overflow-auto flex-1">
              <img
                src={selectedPreviewImage}
                alt="Large Preview"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-3 bg-gray-50 border-t border-gray-200">
              <a
                href={selectedPreviewImage}
                download="downloaded-image.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Download Image</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage?.(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
