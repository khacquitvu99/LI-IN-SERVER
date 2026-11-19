// 1. Cập nhật 3D Design Progress
export async function updateProcessing(pID: number, progressData: any) {
  // Đảm bảo dữ liệu đầu vào luôn là một mảng an toàn
  const dsprogressArray = Array.isArray(progressData)
    ? progressData
    : [progressData].filter(Boolean);

  const res = await fetch(`/api/DsProcess?productID=${pID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productID: pID,
      items: dsprogressArray.map((item: any) => ({
        processingID: item?.processingID || item?.id || 0,
        designer: item?.designer || "",
        completedAt: item?.completedAt || "",
        processImage: item?.image || "", // 🌟 Bổ sung truyền luôn chuỗi ảnh mới upload vào đây nếu backend cần
      })),
    }),
  });

  const data = await res.json();
  if (!data.success)
    throw new Error(data.error || "Error saving 3D Processing");
  return data;
}
// ==================== Cập nhật Material (Dạng Object phẳng thuần túy) ====================
export async function updateMaterial(
  pID: number,
  materialsData: any, // Nhận vào state (mảng hoặc object) từ giao diện
) {
  // Nếu là mảng thì lấy phần tử đầu tiên, nếu là object thì dùng trực tiếp
  const item = Array.isArray(materialsData)
    ? materialsData[0] || {}
    : materialsData;

  // Đóng gói thành Object thuần phẳng
  const payload = {
    productID: Number(pID),
    materialType: item.materialtype || item.materialType || item.type || "",
    color: item.color || "",
    designWeight:
      item.designWeight === "" || item.designWeight == null
        ? 0
        : Number(item.designWeight),
    finishedWeight:
      item.finishedWeight === "" || item.finishedWeight == null
        ? 0
        : Number(item.finishedWeight),
  };

  const res = await fetch(`/api/material?productID=${pID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // Gửi object thuần trực tiếp lên server
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Error saving Material");
  return data;
}
// 3. Cập nhật Gemstone
export async function updateGemstone(pID: number, gemstones: any[]) {
  const gemstonesArray = Array.isArray(gemstones) ? gemstones : [gemstones];

  const res = await fetch(`/api/gemstone?productID=${pID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productID: pID,
      gemstones: gemstonesArray.map((item) => ({
        gemStoneID: Number(item.gemStoneID) || 0,
        gemType: item.gemType || "",
        shape: item.shape || "",
        size: item.size || "",
        weight: Number(item.weight) || 0,
        quantity: Number(item.quantity) || 1,
        color: item.color || "White",
      })),
    }),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Error saving Gemstones");
  return data;
}
// 4. Cập nhật Grillz Details
export async function updateGrillz(
  pID: number,
  grilldetails: { quality: number; styleName: string; grillzImage?: string },
) {
  const res = await fetch(`/api/grillzdetail?productID=${pID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productID: pID,
      quality: grilldetails.quality,
      styleName: grilldetails.styleName,
      grillzImage: grilldetails.grillzImage,
    }),
  });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.error || "Error saving Grillz details");
  return data;
}

// 5. Cập nhật GemCenter Details chuẩn Object phẳng của Backend
export async function updateGemCenter(
  pID: number | string,
  gemcenterData: any, // Nhận vào mảng hoặc object tùy state
) {
  // Lấy ra phần tử đầu tiên nếu dữ liệu là mảng, hoặc dùng trực tiếp nếu là object
  const item = Array.isArray(gemcenterData)
    ? gemcenterData[0] || {}
    : gemcenterData;

  // Xác định ID chuẩn xác để khớp với backend
  const gID =
    Number(item.id) ||
    Number(item.gemCenterID) ||
    Number(item.GemCenterID) ||
    1;

  // Cấu trúc payload phẳng (đúng backend đang destructure ở root body)
  const payload = {
    productId: Number(pID),
    shape: item.shape || "",
    type: item.type || "",
    size: item.size || "",
    cost: item.cost === "" || item.cost === undefined ? 0 : Number(item.cost),
  };

  const res = await fetch(`/api/gemcenter?productID=${pID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.success)
    throw new Error(data.error || "Error saving CenterGem details");
  return data;
}
