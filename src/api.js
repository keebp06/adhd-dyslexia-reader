const API_BASE = "http://127.0.0.1:8000";

export async function uploadPdfToBackend(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/api/documents`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Upload failed");
  }
  return res.json(); // { doc_id }
}



export async function fetchConvertedUnits(docId, mode) {
  const res = await fetch(`${API_BASE}/api/documents/${docId}/convert?mode=${mode}`);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Convert failed");
  }
  return res.json(); // { doc_id, mode, units:[{page,text}] }
}
