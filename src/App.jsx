import { useEffect, useState } from "react";
import SplitReader from "./components/SplitReader";
import { uploadPdfToBackend, fetchConvertedUnits } from "./api";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("dyslexia");
  const [file, setFile] = useState(null);

  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [units, setUnits] = useState([]);

  // 1) Upload PDF once -> get docId
  useEffect(() => {
    async function upload() {
      if (!file) return;
      setLoading(true);
      setErr("");
      try {
        const { doc_id } = await uploadPdfToBackend(file);
        setDocId(doc_id);
      } catch (e) {
        setErr(e?.message || "Upload failed");
        setUnits(["Upload failed. Check backend is running."]);
      } finally {
        setLoading(false);
      }
    }
    upload();
  }, [file]);

  // 2) Convert whenever docId OR mode changes
  useEffect(() => {
    async function convert() {
      if (!docId) return;
      setLoading(true);
      setErr("");
      try {
        const data = await fetchConvertedUnits(docId, mode);

        // backend returns units as strings OR objects (safe handling)
        const texts = Array.isArray(data.units)
          ? data.units
              .map((u) => (typeof u === "string" ? u : u?.text))
              .filter(Boolean)
          : [];

        setUnits(texts.length ? texts : ["No text found (scanned PDF?)"]);
      } catch (e) {
        setErr(e?.message || "Conversion failed");
      } finally {
        setLoading(false);
      }
    }
    convert();
  }, [docId, mode]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="left">
          <h1 className="title">ADHD / Dyslexia Book Converter</h1>

          <div className="toggle">
            <button
              className={mode === "dyslexia" ? "active" : ""}
              onClick={() => setMode("dyslexia")}
            >
              Dyslexia
            </button>
            <button
              className={mode === "adhd" ? "active" : ""}
              onClick={() => setMode("adhd")}
            >
              ADHD
            </button>
          </div>

          {loading && (
            <span style={{ fontSize: 12, color: "#666" }}>Converting…</span>
          )}
          {err && (
            <span style={{ fontSize: 12, color: "crimson" }}>{err}</span>
          )}
        </div>

        <label className="uploadBtn">
          Upload PDF
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </header>

      {!file ? (
        <div className="converted">
          <div className="pink-box">Upload a PDF to generate converted text.</div>
        </div>
      ) : (
        <SplitReader file={file} mode={mode} units={units} />
      )}
    </div>
  );
}