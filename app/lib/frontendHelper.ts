export async function uploadImageToServer(file: File, folderName: string = "uploads"): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folderName);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.success) {
      return result.url; // Trả về chuỗi đường dẫn ảnh
    } else {
      alert("Error upload: " + result.error);
      return null;
    }
  } catch (error) {
    console.error("Error connection upload:", error);
    return null;
  }
}

